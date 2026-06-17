import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IProductRepository } from '@/modules/products/domain/repositories/product.repository.interface';
import { IVariantRepository } from '@/modules/products/domain/repositories/variant.repository.interface';
import { IVisitorRepository } from '@/modules/analytics/domain/repositories/visitor.repository.interface';
import { IPaymentMethodRepository } from '@/modules/payment-methods/domain/repositories/payment-method.repository.interface';
import { RateResolverService } from '@/modules/rates/application/services/rate-resolver.service';
import { MessageGeneratorService } from '../../domain/services/message-generator.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';

const DEFAULT_PUBLIC_RATE_CODE = 'USD_BCV';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(INJECTION_TOKENS.VARIANT_REPOSITORY)
    private readonly variantRepository: IVariantRepository,
    @Inject(INJECTION_TOKENS.VISITOR_REPOSITORY)
    private readonly visitorRepository: IVisitorRepository,
    @Inject(INJECTION_TOKENS.PAYMENT_METHOD_REPOSITORY)
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly messageGeneratorService: MessageGeneratorService,
    private readonly rateResolver: RateResolverService,
  ) {}

  async execute(storeSlug: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    const store = await this.storeRepository.findBySlug(storeSlug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const enrichedItems = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (!product.isVisible) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }

        let variantName: string | null = null;
        let price = product.basePrice;

        if (item.variantId) {
          const variant = await this.variantRepository.findById(item.variantId);
          if (!variant || variant.productId !== product.id) {
            throw new NotFoundException(`Variant ${item.variantId} not found`);
          }

          if (!variant.isAvailable) {
            throw new BadRequestException(`Variant is not available`);
          }

          price = product.basePrice + variant.priceAdjustment;
          variantName = this.generateVariantName(variant.combination);
        }

        return {
          productId: product.id,
          variantId: item.variantId ?? undefined,
          productName: product.name,
          variantName: variantName ?? undefined,
          unitPrice: price,
          quantity: item.quantity,
        };
      }),
    );

    const subtotal = enrichedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal;

    let whatsappNumber = dto.whatsappNumber;
    if (dto.channel === 'WHATSAPP' && !whatsappNumber) {
      if (store.whatsappNumbers.length === 0) {
        throw new BadRequestException('Store has no WhatsApp numbers configured');
      }
      whatsappNumber = store.whatsappNumbers[0];
    }

    let dbVisitorId: string | undefined;
    if (dto.visitorId) {
      const visitor = await this.visitorRepository.findByStoreAndVisitorId(
        store.id,
        dto.visitorId,
      );
      if (visitor) {
        dbVisitorId = visitor.id;
      }
    }

    if (dto.paymentMethodId) {
      const method = await this.paymentMethodRepository.findById(dto.paymentMethodId);
      if (!method || method.storeId !== store.id) {
        throw new NotFoundException('Payment method not found for this store');
      }
      if (!method.enabled) {
        throw new BadRequestException('Payment method is disabled');
      }
    }

    // Snapshot de la tasa publica resuelta — lo que vio el cliente al pedir.
    // Source: store.currencyConfig.defaultRate (PRO/BUSINESS) o USD_BCV (FREE/default).
    const publicRateCode = this.resolvePublicRateCode(store);
    const resolvedPublic = await this.rateResolver.resolveOfficial(publicRateCode);

    const order = await this.orderRepository.create({
      storeId: store.id,
      visitorId: dbVisitorId,
      items: enrichedItems,
      subtotal,
      total,
      currency: dto.currency || 'USD',
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      customerAddress: dto.customerAddress,
      customerNotes: dto.customerNotes,
      channel: dto.channel,
      whatsappNumber,
      paymentMethodId: dto.paymentMethodId,
      rateCodeSnapshot: resolvedPublic ? resolvedPublic.code : null,
      valueVesSnapshot: resolvedPublic ? resolvedPublic.valueVes : null,
    });

    const message = this.messageGeneratorService.generateWhatsAppMessage(order, {
      name: store.name,
      slug: store.slug,
      phone: store.phone,
      address: store.address,
      email: store.email,
      whatsappTemplate: store.whatsappTemplate,
    });
    const whatsappUrl = whatsappNumber
      ? this.messageGeneratorService.generateWhatsAppUrl(whatsappNumber, message)
      : null;

    return {
      id: order.id,
      storeId: order.storeId,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      subtotal: order.subtotal,
      total: order.total,
      currency: order.currency,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      customerNotes: order.customerNotes,
      status: order.status,
      channel: order.channel,
      whatsappNumber: order.whatsappNumber,
      messageGenerated: message,
      whatsappUrl,
      paymentMethodId: order.paymentMethodId,
      payment: order.payment,
      createdAt: order.createdAt,
    };
  }

  private resolvePublicRateCode(store: { subscription?: { plan: Plan }; currencyConfig: any }): string {
    const plan = store.subscription?.plan ?? Plan.FREE;
    if (plan === Plan.FREE) return DEFAULT_PUBLIC_RATE_CODE;
    const config = (store.currencyConfig ?? {}) as { defaultRate?: unknown };
    if (typeof config.defaultRate === 'string' && config.defaultRate.length > 0) {
      return config.defaultRate;
    }
    return DEFAULT_PUBLIC_RATE_CODE;
  }

  private generateVariantName(combination: any): string {
    return Object.values(combination).join(' / ');
  }
}
