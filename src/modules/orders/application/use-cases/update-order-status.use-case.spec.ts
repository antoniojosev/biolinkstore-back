import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderChannel, OrderStatus } from '@prisma/client';
import { OrderIntent } from '../../domain/entities/order-intent.entity';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';

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
    items: [],
    subtotal: 0,
    total: 0,
    currency: 'USD',
    rateCodeSnapshot: null,
    valueVesSnapshot: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    customerAddress: null,
    customerNotes: null,
    status: OrderStatus.PENDING,
    channel: OrderChannel.WHATSAPP,
    whatsappNumber: null,
    messageGenerated: null,
    paymentMethodId: null,
    payment: null,
    createdAt: new Date(),
    ...overrides,
  });
}

describe('UpdateOrderStatusUseCase', () => {
  it('throws NotFoundException when the order does not exist', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(null);

    const useCase = new UpdateOrderStatusUseCase(repo);

    await expect(useCase.execute('store_1', 'missing', OrderStatus.CONTACTED)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when the order belongs to a different store', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(makeOrder({ storeId: 'other_store' }));

    const useCase = new UpdateOrderStatusUseCase(repo);

    await expect(useCase.execute('store_1', 'ord_1', OrderStatus.CONTACTED)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('persists the new status when the order belongs to the store', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.PENDING }));
    repo.updateStatus.mockResolvedValue(makeOrder({ status: OrderStatus.CONTACTED }));

    const useCase = new UpdateOrderStatusUseCase(repo);
    const result = await useCase.execute('store_1', 'ord_1', OrderStatus.CONTACTED);

    expect(repo.updateStatus).toHaveBeenCalledWith('ord_1', OrderStatus.CONTACTED);
    expect(result.status).toBe(OrderStatus.CONTACTED);
  });

  it.each([
    OrderStatus.PENDING,
    OrderStatus.CONTACTED,
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
  ])('accepts all defined statuses (%s) for owned orders', async (status) => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(makeOrder());
    repo.updateStatus.mockResolvedValue(makeOrder({ status }));

    const useCase = new UpdateOrderStatusUseCase(repo);
    await expect(useCase.execute('store_1', 'ord_1', status)).resolves.toMatchObject({ status });
  });
});
