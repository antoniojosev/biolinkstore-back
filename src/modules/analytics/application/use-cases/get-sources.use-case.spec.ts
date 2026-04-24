import { Plan } from '@prisma/client';
import { AnalyticsCacheService } from '../services/analytics-cache.service';
import { DashboardPlanGate } from '../services/dashboard-plan-gate.helper';
import { IStoreAggregationsRepository } from '../../domain/repositories/store-aggregations.repository.interface';
import { GetSourcesUseCase } from './get-sources.use-case';

describe('GetSourcesUseCase', () => {
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

  it('consolidates instagram subdomains into one bucket', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.sources.mockResolvedValue([
      { domain: 'https://www.instagram.com/foo', visits: 50 },
      { domain: 'https://l.instagram.com/?u=bar', visits: 30 },
      { domain: 'https://instagram.com/store', visits: 20 },
    ]);

    const useCase = new GetSourcesUseCase(aggregations, new AnalyticsCacheService(), buildPlanGate());
    const result = await useCase.execute('s1', '30d');

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]).toEqual({ domain: 'instagram.com', visits: 100, pct: 100 });
  });

  it('emits direct bucket for null/empty referrers', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.sources.mockResolvedValue([
      { domain: '', visits: 200 },
      { domain: 'https://instagram.com/foo', visits: 50 },
    ]);

    const useCase = new GetSourcesUseCase(aggregations, new AnalyticsCacheService(), buildPlanGate());
    const result = await useCase.execute('s1', '7d');

    expect(result.sources.find((s) => s.domain === 'direct')).toBeDefined();
    expect(result.sources.find((s) => s.domain === 'direct')!.visits).toBe(200);
  });

  it('returns empty list when no sources', async () => {
    const aggregations = buildAggregationsMock();
    aggregations.sources.mockResolvedValue([]);
    const useCase = new GetSourcesUseCase(aggregations, new AnalyticsCacheService(), buildPlanGate());
    const result = await useCase.execute('s1', '30d');
    expect(result.sources).toEqual([]);
  });
});
