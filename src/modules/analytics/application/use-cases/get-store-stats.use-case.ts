import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { IOrderRepository } from '@/modules/orders/domain/repositories/order.repository.interface';
import { StoreStatsResponseDto } from '../dto/store-stats-response.dto';

@Injectable()
export class GetStoreStatsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ANALYTICS_REPOSITORY)
    private readonly analyticsRepository: IAnalyticsRepository,
    @Inject(INJECTION_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(storeId: string, from?: Date, to?: Date): Promise<StoreStatsResponseDto> {
    const now = new Date();
    const defaultFrom = from ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = to ?? now;

    const [
      totalQuotes,
      newQuotesCount,
      uniqueVisitors,
      productViews,
      viewsByCategory,
      visitsByDay,
      viewsByProduct,
    ] = await Promise.all([
      this.orderRepository.countByStoreId(storeId),
      this.orderRepository.countByStoreId(storeId, defaultFrom),
      this.analyticsRepository.countUniqueVisitors(storeId, defaultFrom, defaultTo),
      this.analyticsRepository.countByType(storeId, 'PRODUCT_VIEW', defaultFrom, defaultTo),
      this.analyticsRepository.getViewsByCategory(storeId, defaultFrom, defaultTo),
      this.analyticsRepository.getVisitsByDay(storeId, defaultFrom, defaultTo),
      this.analyticsRepository.getViewsByProduct(storeId, defaultFrom, defaultTo),
    ]);

    return {
      totalQuotes,
      uniqueVisitors,
      productViews,
      newQuotesCount,
      viewsByCategory,
      visitsByDay,
      viewsByProduct,
    };
  }
}
