import { OrderChannel, OrderStatus } from '@prisma/client';
import { OrderIntent, OrderItem } from '../../domain/entities/order-intent.entity';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ExportOrdersUseCase } from './export-orders.use-case';

function buildRepo(): jest.Mocked<IOrderRepository> {
  return {
    findById: jest.fn(),
    findByStoreId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    countByStoreId: jest.fn(),
  };
}

function makeOrder(overrides: Partial<OrderIntent> = {}): OrderIntent {
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
        variantName: null,
        unitPrice: 25,
        quantity: 2,
      }),
    ],
    subtotal: 50,
    total: 50,
    currency: 'USD',
    rateCodeSnapshot: null,
    valueVesSnapshot: null,
    customerName: 'María',
    customerPhone: '+584140000000',
    customerEmail: 'maria@example.com',
    customerAddress: null,
    customerNotes: null,
    status: OrderStatus.PENDING,
    channel: OrderChannel.WHATSAPP,
    whatsappNumber: null,
    messageGenerated: null,
    paymentMethodId: null,
    payment: null,
    createdAt: new Date('2026-06-17T15:30:00Z'),
    ...overrides,
  });
}

describe('ExportOrdersUseCase', () => {
  it('returns a CSV header followed by one row per order', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [makeOrder(), makeOrder({ id: 'ord_2' })],
      meta: { total: 2, page: 1, limit: 10000, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ExportOrdersUseCase(repo);
    const csv = await useCase.execute('store_1');
    const lines = csv.split('\n');

    expect(lines[0]).toBe('ID,Fecha,Cliente,Telefono,Email,Items,Total,Moneda,Estado,Canal');
    expect(lines).toHaveLength(3);
  });

  it('formats createdAt as YYYY-MM-DD', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [makeOrder({ createdAt: new Date('2026-06-17T15:30:00Z') })],
      meta: { total: 1, page: 1, limit: 10000, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ExportOrdersUseCase(repo);
    const csv = await useCase.execute('store_1');

    expect(csv).toContain(',2026-06-17,');
  });

  it('wraps customerName and items in quotes and escapes embedded double quotes', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [
        makeOrder({
          customerName: 'María "La Loca"',
          items: [
            new OrderItem({
              id: 'oi_1',
              orderId: 'ord_1',
              productId: 'p_1',
              variantId: null,
              productName: 'Lentes "Premium"',
              variantName: null,
              unitPrice: 30,
              quantity: 1,
            }),
          ],
        }),
      ],
      meta: { total: 1, page: 1, limit: 10000, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ExportOrdersUseCase(repo);
    const csv = await useCase.execute('store_1');

    expect(csv).toContain('"María ""La Loca"""');
    expect(csv).toContain('"Lentes ""Premium"" x1"');
  });

  it('joins multiple items with " | " inside the items column', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [
        makeOrder({
          items: [
            new OrderItem({ id: 'a', orderId: 'ord_1', productId: 'p1', variantId: null, productName: 'A', variantName: null, unitPrice: 10, quantity: 2 }),
            new OrderItem({ id: 'b', orderId: 'ord_1', productId: 'p2', variantId: null, productName: 'B', variantName: null, unitPrice: 5, quantity: 3 }),
          ],
        }),
      ],
      meta: { total: 1, page: 1, limit: 10000, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ExportOrdersUseCase(repo);
    const csv = await useCase.execute('store_1');

    expect(csv).toContain('"A x2 | B x3"');
  });

  it('renders empty strings (not the literal "null") for missing customer fields', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [
        makeOrder({
          customerName: null,
          customerPhone: null,
          customerEmail: null,
        }),
      ],
      meta: { total: 1, page: 1, limit: 10000, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ExportOrdersUseCase(repo);
    const csv = await useCase.execute('store_1');

    expect(csv).not.toContain('null');
    // Customer name is wrapped in quotes; ensure it's an empty quoted field
    expect(csv).toContain(',"",');
  });

  it('requests a wide page (limit 10000) so all orders are exported', async () => {
    const repo = buildRepo();
    repo.findByStoreId.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10000, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
    });

    const useCase = new ExportOrdersUseCase(repo);
    await useCase.execute('store_1');

    expect(repo.findByStoreId).toHaveBeenCalledWith('store_1', {
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });
});
