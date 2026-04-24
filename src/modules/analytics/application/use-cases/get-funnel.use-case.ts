import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreAggregationsRepository } from '../../domain/repositories/store-aggregations.repository.interface';
import { AnalyticsCacheService } from '../services/analytics-cache.service';
import { DashboardPlanGate } from '../services/dashboard-plan-gate.helper';
import { buildWindow, parsePeriod } from '../services/period.helper';
import {
  FunnelResponseDto,
  FunnelStepDto,
  PeriodValue,
} from '../dto/dashboard-analytics.dto';

@Injectable()
export class GetFunnelUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_AGGREGATIONS_REPOSITORY)
    private readonly aggregations: IStoreAggregationsRepository,
    private readonly cache: AnalyticsCacheService,
    private readonly planGate: DashboardPlanGate,
  ) {}

  async execute(
    storeId: string,
    periodRaw: PeriodValue | undefined,
  ): Promise<FunnelResponseDto> {
    await this.planGate.assertAllowed(storeId, 'funnel');
    const period = parsePeriod(periodRaw);
    const cacheKey = this.cache.buildKey(storeId, 'funnel', period);

    return this.cache.getOrSet(cacheKey, async () => {
      const window = buildWindow(period);
      const counts = await this.aggregations.funnel(storeId, {
        from: window.from,
        to: window.to,
      });

      const sequence: { name: string; count: number }[] = [
        { name: 'store_view', count: counts.storeViews },
        { name: 'product_view', count: counts.productViews },
        { name: 'add_to_cart', count: counts.addToCarts },
        { name: 'whatsapp_click', count: counts.whatsappClicks },
      ];

      const steps: FunnelStepDto[] = sequence.map((step, index) => {
        if (index === 0) {
          return { name: step.name, count: step.count, rateFromPrev: null };
        }
        const prev = sequence[index - 1].count;
        const ratio = prev === 0 ? 0 : Number((step.count / prev).toFixed(4));
        return { name: step.name, count: step.count, rateFromPrev: ratio };
      });

      const overallConversion =
        counts.storeViews === 0
          ? 0
          : Number((counts.whatsappClicks / counts.storeViews).toFixed(4));

      return { period, steps, overallConversion };
    });
  }
}
