import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';
import { OrderResponseDto } from '../dto/order-response.dto';
import { MessageGeneratorService } from '../../domain/services/message-generator.service';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly messageGeneratorService: MessageGeneratorService,
  ) {}

  async execute(
    storeId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const result = await this.orderRepository.findByStoreId(storeId, params);

    const orders = result.data.map((order) => {
      const whatsappUrl =
        order.whatsappNumber && order.messageGenerated
          ? this.messageGeneratorService.generateWhatsAppUrl(
              order.whatsappNumber,
              order.messageGenerated,
            )
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
        channel: order.channel,
        whatsappNumber: order.whatsappNumber,
        messageGenerated: order.messageGenerated,
        whatsappUrl,
        createdAt: order.createdAt,
      };
    });

    return {
      data: orders,
      meta: result.meta,
    };
  }
}
