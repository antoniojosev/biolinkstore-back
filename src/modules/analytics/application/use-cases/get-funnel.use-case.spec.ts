import { Plan } from '@prisma/client';
import { AnalyticsCacheService } from '../services/analytics-cache.service';
import { DashboardPlanGate } from '../services/dashboard-plan-gate.helper';
import { IStoreAggregationsRepository } from '../../domain/repositories/store-aggregations.repository.interface';
import { GetFunnelUseCase } from './get-funnel.use-case';

describe('GetFunnelUseCase', () => {
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

  it('returns 4 steps with correct rates', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.funnel.mockResolvedValue({
      storeViews: 1000,
      productViews: 400,
      addToCarts: 100,
      whatsappClicks: 50,
    });

    const useCase = new GetFunnelUseCase(aggregations, new AnalyticsCacheService(), buildPlanGate());
    const result = await useCase.execute('s1', '30d');

    expect(result.steps).toHaveLength(4);
    expect(result.steps[0]).toEqual({ name: 'store_view', count: 1000, rateFromPrev: null });
    expect(result.steps[1]).toEqual({ name: 'product_view', count: 400, rateFromPrev: 0.4 });
    expect(result.steps[2]).toEqual({ name: 'add_to_cart', count: 100, rateFromPrev: 0.25 });
    expect(result.steps[3]).toEqual({ name: 'whatsapp_click', count: 50, rateFromPrev: 0.5 });
    expect(result.overallConversion).toBe(0.05);
  });

  it('handles empty data without dividing by zero', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.funnel.mockResolvedValue({
      storeViews: 0,
      productViews: 0,
      addToCarts: 0,
      whatsappClicks: 0,
    });

    const useCase = new GetFunnelUseCase(aggregations, new AnalyticsCacheService(), buildPlanGate());
    const result = await useCase.execute('s1', '7d');

    expect(result.overallConversion).toBe(0);
    expect(result.steps[1].rateFromPrev).toBe(0);
    expect(result.steps[2].rateFromPrev).toBe(0);
    expect(result.steps[3].rateFromPrev).toBe(0);
  });
});
