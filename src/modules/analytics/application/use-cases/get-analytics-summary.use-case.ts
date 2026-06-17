import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreAggregationsRepository } from '../../domain/repositories/store-aggregations.repository.interface';
import { AnalyticsCacheService } from '../services/analytics-cache.service';
import { DashboardPlanGate } from '../services/dashboard-plan-gate.helper';
import { buildWindow, parsePeriod, pctChange } from '../services/period.helper';
import {
  PeriodValue,
  SummaryResponseDto,
} from '../dto/dashboard-analytics.dto';

@Injectable()
export class GetAnalyticsSummaryUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_AGGREGATIONS_REPOSITORY)
    private readonly aggregations: IStoreAggregationsRepository,
    private readonly cache: AnalyticsCacheService,
    private readonly planGate: DashboardPlanGate,
  ) {}

  async execute(storeId: string, periodRaw: PeriodValue | undefined): Promise<SummaryResponseDto> {
    await this.planGate.assertAllowed(storeId, 'summary');
    const period = parsePeriod(periodRaw);
    const cacheKey = this.cache.buildKey(storeId, 'summary', period);

    return this.cache.getOrSet(cacheKey, async () => {
      const window = buildWindow(period);

      const [views, events, prevViews, prevEvents] = await Promise.all([
        this.aggregations.countViews(storeId, { from: window.from, to: window.to }),
        this.aggregations.countEventsByType(storeId, { from: window.from, to: window.to }),
        this.aggregations.countViews(storeId, { from: window.prevFrom, to: window.prevTo }),
        this.aggregations.countEventsByType(storeId, {
          from: window.prevFrom,
          to: window.prevTo,
        }),
      ]);

      const conversionRate =
        views.total === 0 ? 0 : Number((events.WHATSAPP_CLICK / views.total).toFixed(4));

      return {
        period,
        from: window.from.toISOString(),
        to: window.to.toISOString(),
        views,
        events: {
          productViews: events.PRODUCT_VIEW,
          addToCarts: events.ADD_TO_CART,
          whatsappClicks: events.WHATSAPP_CLICK,
          socialClicks: events.SOCIAL_CLICK,
          categoryClicks: events.CATEGORY_CLICK,
        },
        conversionRate,
        prevPeriod: {
          views: prevViews,
          events: {
            productViews: prevEvents.PRODUCT_VIEW,
            addToCarts: prevEvents.ADD_TO_CART,
            whatsappClicks: prevEvents.WHATSAPP_CLICK,
            socialClicks: prevEvents.SOCIAL_CLICK,
            categoryClicks: prevEvents.CATEGORY_CLICK,
          },
        },
        trend: {
          viewsChangePct: pctChange(views.total, prevViews.total),
          whatsappChangePct: pctChange(events.WHATSAPP_CLICK, prevEvents.WHATSAPP_CLICK),
        },
      };
    });
  }
}
