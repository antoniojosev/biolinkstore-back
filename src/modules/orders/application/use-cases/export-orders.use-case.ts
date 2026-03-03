import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

@Injectable()
export class ExportOrdersUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(storeId: string): Promise<string> {
    const result = await this.orderRepository.findByStoreId(storeId, {
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const header = 'ID,Fecha,Cliente,Telefono,Email,Items,Total,Moneda,Estado,Canal\n';
    const rows = result.data.map((order) => {
      const items = order.items
        .map((i) => `${i.productName} x${i.quantity}`)
        .join(' | ');
      const date = order.createdAt.toISOString().split('T')[0];
      return [
        order.id,
        date,
        `"${(order.customerName || '').replace(/"/g, '""')}"`,
        order.customerPhone || '',
        order.customerEmail || '',
        `"${items.replace(/"/g, '""')}"`,
        order.total,
        order.currency,
        order.status,
        order.channel,
      ].join(',');
    });

    return header + rows.join('\n');
  }
}
