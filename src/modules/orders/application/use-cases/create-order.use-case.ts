import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IProductRepository } from '@/modules/products/domain/repositories/product.repository.interface';
import { IVariantRepository } from '@/modules/products/domain/repositories/variant.repository.interface';
import { MessageGeneratorService } from '../../domain/services/message-generator.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';

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
    private readonly messageGeneratorService: MessageGeneratorService,
  ) {}

  async execute(storeSlug: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    // 1. Verify store exists
    const store = await this.storeRepository.findBySlug(storeSlug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // 2. Validate and enrich order items
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

        // If variant specified, validate and get variant price
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

    // 3. Calculate totals
    const subtotal = enrichedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal; // Can add taxes, shipping, etc. here

    // 4. Determine WhatsApp number
    let whatsappNumber = dto.whatsappNumber;
    if (dto.channel === 'WHATSAPP' && !whatsappNumber) {
      // Use store's first WhatsApp number if not provided
      if (store.whatsappNumbers.length === 0) {
        throw new BadRequestException('Store has no WhatsApp numbers configured');
      }
      whatsappNumber = store.whatsappNumbers[0];
    }

    // 5. Create order intent
    const order = await this.orderRepository.create({
      storeId: store.id,
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
    });

    // 6. Generate WhatsApp message
    const message = this.messageGeneratorService.generateWhatsAppMessage(order, store.name);
    const whatsappUrl = whatsappNumber
      ? this.messageGeneratorService.generateWhatsAppUrl(whatsappNumber, message)
      : null;

    // 7. Return order response
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
      channel: order.channel,
      whatsappNumber: order.whatsappNumber,
      messageGenerated: message,
      whatsappUrl,
      createdAt: order.createdAt,
    };
  }

  private generateVariantName(combination: any): string {
    return Object.values(combination).join(' / ');
  }
}
