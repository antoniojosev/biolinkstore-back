import { OrderChannel, OrderStatus } from '@prisma/client';
import { OrderIntent, OrderItem } from '../../domain/entities/order-intent.entity';
import { IOrderRepository, OrderFilterParams } from '../../domain/repositories/order.repository.interface';
import { MessageGeneratorService } from '../../domain/services/message-generator.service';
import { ListOrdersUseCase } from './list-orders.use-case';

function buildOrder(overrides: Partial<OrderIntent> = {}): OrderIntent {
  return new OrderIntent({
    id: 'ord_1',
    storeId: 'store_1',
    visitorId: null,
    items: [
      new OrderItem({
        id: 'oi_1',
        orderId: 'ord_1',
        productId: 'p_1',
        variantId: null,
        productName: 'Camiseta negra',
        variantName: 'M',
        unitPrice: 25,
        quantity: 2,
      }),
    ],
    subtotal: 50,
    total: 50,
    currency: 'USD',
    rateCodeSnapshot: null,
    valueVesSnapshot: null,
    customerName: 'Cliente Demo',
    customerPhone: '+584140000000',
    customerEmail: null,
    customerAddress: null,
    customerNotes: null,
    status: OrderStatus.PENDING,
    channel: OrderChannel.WHATSAPP,
    whatsappNumber: '+584140000000',
    messageGenerated: 'Hola, quiero pedir',
    paymentMethodId: null,
    payment: null,
    createdAt: new Date('2026-06-17T00:00:00Z'),
    ...overrides,
  });
}

function buildRepo(): jest.Mocked<IOrderRepository> {
  return {
    findById: jest.fn(),
    findByStoreId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    countByStoreId: jest.fn(),
  };
}

describe('ListOrdersUseCase', () => {
  const messageGenerator = {
    generateWhatsAppUrl: jest.fn().mockReturnValue('https://wa.me/584140000000?text=hi'),
  } as unknown as MessageGeneratorService;

  it('forwards storeId + pagination + status filter to the repository', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [buildOrder()],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ListOrdersUseCase(repo, messageGenerator);
    await useCase.execute('store_1', {
      page: 2,
      limit: 20,
      sortOrder: 'desc',
      status: OrderStatus.PENDING,
    } as OrderFilterParams);

    expect(repo.findByStoreId).toHaveBeenCalledWith('store_1', {
      page: 2,
      limit: 20,
      sortOrder: 'desc',
      status: OrderStatus.PENDING,
    });
  });

  it('returns meta from the repository so OrdersBoard pagination works', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [buildOrder()],
      meta: { total: 47, page: 3, limit: 5, totalPages: 10, hasNextPage: true, hasPreviousPage: true },
    });

    const useCase = new ListOrdersUseCase(repo, messageGenerator);
    const result = await useCase.execute('store_1', { page: 3, limit: 5, sortOrder: 'desc' } as OrderFilterParams);

    expect(result.meta.total).toBe(47);
    expect(result.meta.totalPages).toBe(10);
    expect(result.meta.hasNextPage).toBe(true);
  });

  it('maps domain orders to response DTO including a computed whatsappUrl', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [
        buildOrder({
          id: 'ord_wa',
          whatsappNumber: '+584149999999',
          messageGenerated: 'pedido WhatsApp',
        }),
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ListOrdersUseCase(repo, messageGenerator);
    const result = await useCase.execute('store_1', { page: 1, limit: 10, sortOrder: 'desc' } as OrderFilterParams);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'ord_wa',
      whatsappUrl: 'https://wa.me/584140000000?text=hi',
      status: OrderStatus.PENDING,
      channel: OrderChannel.WHATSAPP,
    });
    expect(messageGenerator.generateWhatsAppUrl).toHaveBeenCalledWith(
      '+584149999999',
      'pedido WhatsApp',
    );
  });

  it('returns whatsappUrl=null when order has no WhatsApp number or no generated message', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [
        buildOrder({ id: 'ord_ig', whatsappNumber: null, messageGenerated: null, channel: OrderChannel.INSTAGRAM }),
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ListOrdersUseCase(repo, messageGenerator);
    const result = await useCase.execute('store_1', { page: 1, limit: 10, sortOrder: 'desc' } as OrderFilterParams);

    expect(result.data[0].whatsappUrl).toBeNull();
  });

  it('maps each order item field through to the DTO', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [buildOrder()],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ListOrdersUseCase(repo, messageGenerator);
    const result = await useCase.execute('store_1', { page: 1, limit: 10, sortOrder: 'desc' } as OrderFilterParams);

    expect(result.data[0].items).toEqual([
      {
        id: 'oi_1',
        productId: 'p_1',
        variantId: null,
        productName: 'Camiseta negra',
        variantName: 'M',
        unitPrice: 25,
        quantity: 2,
      },
    ]);
  });

  it('returns an empty data array when the repository has no matches', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ListOrdersUseCase(repo, messageGenerator);
    const result = await useCase.execute('store_1', {
      page: 1,
      limit: 10,
      sortOrder: 'desc',
      status: OrderStatus.REJECTED,
    } as OrderFilterParams);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });
});
