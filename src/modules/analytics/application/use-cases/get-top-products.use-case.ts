import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreAggregationsRepository } from '../../domain/repositories/store-aggregations.repository.interface';
import { AnalyticsCacheService } from '../services/analytics-cache.service';
import { DashboardPlanGate } from '../services/dashboard-plan-gate.helper';
import { buildWindow, parsePeriod } from '../services/period.helper';
import {
  PeriodValue,
  TopProductDto,
  TopProductsResponseDto,
} from '../dto/dashboard-analytics.dto';

@Injectable()
export class GetTopProductsUseCase {
  /** Scoring weights — codified once so frontends never re-implement them. */
  private static readonly WEIGHT_VIEW = 1;
  private static readonly WEIGHT_ADD_TO_CART = 3;
  private static readonly WEIGHT_WHATSAPP_CLICK = 5;

  private static readonly DEFAULT_LIMIT = 10;

  constructor(
    @Inject(INJECTION_TOKENS.STORE_AGGREGATIONS_REPOSITORY)
    private readonly aggregations: IStoreAggregationsRepository,
    private readonly cache: AnalyticsCacheService,
    private readonly planGate: DashboardPlanGate,
  ) {}

  async execute(
    storeId: string,
    periodRaw: PeriodValue | undefined,
    limitRaw: number | undefined,
  ): Promise<TopProductsResponseDto> {
    await this.planGate.assertAllowed(storeId, 'top-products');
    const period = parsePeriod(periodRaw);
    const limit = Math.max(1, Math.min(limitRaw ?? GetTopProductsUseCase.DEFAULT_LIMIT, 50));
    const cacheKey = this.cache.buildKey(storeId, 'top-products', period, `l${limit}`);

    return this.cache.getOrSet(cacheKey, async () => {
      const window = buildWindow(period);
      const rows = await this.aggregations.topProducts(
        storeId,
        { from: window.from, to: window.to },
        limit,
      );

      const scored = rows
        .map((row) => ({
          productId: row.productId,
          views: row.views,
          addToCarts: row.addToCarts,
          whatsappClicks: row.whatsappClicks,
          score:
            row.views * GetTopProductsUseCase.WEIGHT_VIEW +
            row.addToCarts * GetTopProductsUseCase.WEIGHT_ADD_TO_CART +
            row.whatsappClicks * GetTopProductsUseCase.WEIGHT_WHATSAPP_CLICK,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const names = await this.aggregations.resolveProductNames(scored.map((p) => p.productId));

      const data: TopProductDto[] = scored.map((p) => ({
        productId: p.productId,
        name: names.get(p.productId) ?? null,
        views: p.views,
        addToCarts: p.addToCarts,
        whatsappClicks: p.whatsappClicks,
        score: p.score,
      }));

      return { period, data };
    });
  }
}
