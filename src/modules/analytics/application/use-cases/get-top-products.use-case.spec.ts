import { Plan } from '@prisma/client';
import { AnalyticsCacheService } from '../services/analytics-cache.service';
import { DashboardPlanGate } from '../services/dashboard-plan-gate.helper';
import { IStoreAggregationsRepository } from '../../domain/repositories/store-aggregations.repository.interface';
import { GetTopProductsUseCase } from './get-top-products.use-case';

describe('GetTopProductsUseCase', () => {
  const buildAggregationsMock = (): jest.Mocked<IStoreAggregationsRepository> => ({
    countViews: jest.fn(),
    countEventsByType: jest.fn(),
    topProducts: jest.fn(),
    funnel: jest.fn(),
    sources: jest.fn(),
    resolveProductNames: jest.fn(),
  });

  const buildPlanGate = () =>
    ({ assertAllowed: jest.fn().mockResolvedValue(Plan.PRO) } as unknown as DashboardPlanGate);

  it('scores rows with views*1 + addToCarts*3 + whatsappClicks*5 and sorts desc', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.topProducts.mockResolvedValue([
      { productId: 'p-views', views: 100, addToCarts: 0, whatsappClicks: 0 }, // 100
      { productId: 'p-mixed', views: 50, addToCarts: 10, whatsappClicks: 5 }, // 50 + 30 + 25 = 105
      { productId: 'p-wa', views: 0, addToCarts: 0, whatsappClicks: 30 }, // 150
    ]);
    aggregations.resolveProductNames.mockResolvedValue(
      new Map([
        ['p-views', 'Views Pro'],
        ['p-mixed', 'Mixed'],
        ['p-wa', 'WhatsApp Magnet'],
      ]),
    );

    const cache = new AnalyticsCacheService();
    const useCase = new GetTopProductsUseCase(aggregations, cache, buildPlanGate());

    const result = await useCase.execute('store-1', '30d', 10);

    expect(result.period).toBe('30d');
    expect(result.data.map((p) => p.productId)).toEqual(['p-wa', 'p-mixed', 'p-views']);
    expect(result.data[0]).toMatchObject({
      productId: 'p-wa',
      name: 'WhatsApp Magnet',
      score: 150,
    });
    expect(result.data[1]).toMatchObject({ productId: 'p-mixed', score: 105 });
    expect(result.data[2]).toMatchObject({ productId: 'p-views', score: 100 });
  });

  it('respects the limit clamp', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.topProducts.mockResolvedValue([
      { productId: 'a', views: 1, addToCarts: 0, whatsappClicks: 0 },
      { productId: 'b', views: 2, addToCarts: 0, whatsappClicks: 0 },
      { productId: 'c', views: 3, addToCarts: 0, whatsappClicks: 0 },
    ]);
    aggregations.resolveProductNames.mockResolvedValue(new Map());

    const cache = new AnalyticsCacheService();
    const useCase = new GetTopProductsUseCase(aggregations, cache, buildPlanGate());

    const result = await useCase.execute('store-1', '30d', 2);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((p) => p.productId)).toEqual(['c', 'b']);
  });

  it('hits the cache on the second call (same params)', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.topProducts.mockResolvedValue([]);
    aggregations.resolveProductNames.mockResolvedValue(new Map());

    const cache = new AnalyticsCacheService();
    const useCase = new GetTopProductsUseCase(aggregations, cache, buildPlanGate());

    await useCase.execute('store-1', '30d', 10);
    await useCase.execute('store-1', '30d', 10);

    expect(aggregations.topProducts).toHaveBeenCalledTimes(1);
  });

  it('refetches when the limit changes (different cache key)', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.topProducts.mockResolvedValue([]);
    aggregations.resolveProductNames.mockResolvedValue(new Map());

    const cache = new AnalyticsCacheService();
    const useCase = new GetTopProductsUseCase(aggregations, cache, buildPlanGate());

    await useCase.execute('store-1', '30d', 10);
    await useCase.execute('store-1', '30d', 20);

    expect(aggregations.topProducts).toHaveBeenCalledTimes(2);
  });
});
