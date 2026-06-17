import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreAggregationsRepository } from '../../domain/repositories/store-aggregations.repository.interface';
import { AnalyticsCacheService } from '../services/analytics-cache.service';
import { DashboardPlanGate } from '../services/dashboard-plan-gate.helper';
import { buildWindow, parsePeriod } from '../services/period.helper';
import {
  PeriodValue,
  SourceItemDto,
  SourcesResponseDto,
} from '../dto/dashboard-analytics.dto';
import { classifySource } from '../services/source-classifier.helper';

@Injectable()
export class GetSourcesUseCase {
  /** Long-tail sources collapsed into "other" once we have more than this many. */
  private static readonly MAX_VISIBLE_SOURCES = 9;

  constructor(
    @Inject(INJECTION_TOKENS.STORE_AGGREGATIONS_REPOSITORY)
    private readonly aggregations: IStoreAggregationsRepository,
    private readonly cache: AnalyticsCacheService,
    private readonly planGate: DashboardPlanGate,
  ) {}

  async execute(
    storeId: string,
    periodRaw: PeriodValue | undefined,
  ): Promise<SourcesResponseDto> {
    await this.planGate.assertAllowed(storeId, 'sources');
    const period = parsePeriod(periodRaw);
    const cacheKey = this.cache.buildKey(storeId, 'sources', period);

    return this.cache.getOrSet(cacheKey, async () => {
      const window = buildWindow(period);
      const rawRows = await this.aggregations.sources(storeId, {
        from: window.from,
        to: window.to,
      });

      // Bucket consolidation: classify referrers and accumulate by canonical bucket.
      const buckets = new Map<string, number>();
      for (const row of rawRows) {
        const bucket = classifySource(row.domain);
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + row.visits);
      }

      // Rank buckets by visits desc, then collapse the long tail into "other".
      const sorted = [...buckets.entries()]
        .map(([domain, visits]) => ({ domain, visits }))
        .sort((a, b) => b.visits - a.visits);

      let visible = sorted;
      if (sorted.length > GetSourcesUseCase.MAX_VISIBLE_SOURCES) {
        const head = sorted.slice(0, GetSourcesUseCase.MAX_VISIBLE_SOURCES - 1);
        const tailVisits = sorted
          .slice(GetSourcesUseCase.MAX_VISIBLE_SOURCES - 1)
          .reduce((sum, r) => sum + r.visits, 0);
        const otherIndex = head.findIndex((r) => r.domain === 'other');
        if (otherIndex >= 0) {
          head[otherIndex] = {
            domain: 'other',
            visits: head[otherIndex].visits + tailVisits,
          };
          visible = head;
        } else {
          visible = [...head, { domain: 'other', visits: tailVisits }];
        }
      }

      const total = visible.reduce((sum, r) => sum + r.visits, 0);

      const sources: SourceItemDto[] = visible.map((r) => ({
        domain: r.domain,
        visits: r.visits,
        pct: total === 0 ? 0 : Math.round((r.visits / total) * 100),
      }));

      return { period, sources };
    });
  }
}
