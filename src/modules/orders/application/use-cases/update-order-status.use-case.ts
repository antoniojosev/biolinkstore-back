import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(storeId: string, orderId: string, status: OrderStatus) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.storeId !== storeId) {
      throw new ForbiddenException('Order does not belong to this store');
    }

    return this.orderRepository.updateStatus(orderId, status);
  }
}
