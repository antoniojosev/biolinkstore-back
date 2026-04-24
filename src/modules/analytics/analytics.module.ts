import { Module, forwardRef } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '../stores/stores.module';
import { OrdersModule } from '../orders/orders.module';

// Application - Use Cases
import { TrackEventUseCase } from './application/use-cases/track-event.use-case';
import { GetStoreStatsUseCase } from './application/use-cases/get-store-stats.use-case';
import { GetAnalyticsUseCase } from './application/use-cases/get-analytics.use-case';
import { TrackStoreViewUseCase } from './application/use-cases/track-store-view.use-case';
import { GetStoreAnalyticsUseCase } from './application/use-cases/get-store-analytics.use-case';
import { TrackStoreEventUseCase } from './application/use-cases/track-store-event.use-case';
import { ListStoreEventsUseCase } from './application/use-cases/list-store-events.use-case';
import { GetAnalyticsSummaryUseCase } from './application/use-cases/get-analytics-summary.use-case';
import { GetTopProductsUseCase } from './application/use-cases/get-top-products.use-case';
import { GetFunnelUseCase } from './application/use-cases/get-funnel.use-case';
import { GetSourcesUseCase } from './application/use-cases/get-sources.use-case';

// Application - Services
import { AnalyticsCacheService } from './application/services/analytics-cache.service';
import { DashboardPlanGate } from './application/services/dashboard-plan-gate.helper';

// Infrastructure - Repositories
import { PrismaAnalyticsRepository } from './infrastructure/persistence/prisma-analytics.repository';
import { PrismaVisitorRepository } from './infrastructure/persistence/prisma-visitor.repository';
import { PrismaStoreViewRepository } from './infrastructure/persistence/prisma-store-view.repository';
import { PrismaStoreEventRepository } from './infrastructure/persistence/prisma-store-event.repository';
import { PrismaStoreAggregationsRepository } from './infrastructure/persistence/prisma-store-aggregations.repository';

// Presentation - Controllers
import { AnalyticsController } from './presentation/controllers/analytics.controller';

@Module({
  imports: [DatabaseModule, StoresModule, forwardRef(() => OrdersModule)],
  controllers: [AnalyticsController],
  providers: [
    // Use Cases
    TrackEventUseCase,
    GetStoreStatsUseCase,
    GetAnalyticsUseCase,
    TrackStoreViewUseCase,
    GetStoreAnalyticsUseCase,
    TrackStoreEventUseCase,
    ListStoreEventsUseCase,
    GetAnalyticsSummaryUseCase,
    GetTopProductsUseCase,
    GetFunnelUseCase,
    GetSourcesUseCase,

    // Application Services
    AnalyticsCacheService,
    DashboardPlanGate,

    // Repository Bindings
    {
      provide: INJECTION_TOKENS.ANALYTICS_REPOSITORY,
      useClass: PrismaAnalyticsRepository,
    },
    {
      provide: INJECTION_TOKENS.VISITOR_REPOSITORY,
      useClass: PrismaVisitorRepository,
    },
    {
      provide: INJECTION_TOKENS.STORE_VIEW_REPOSITORY,
      useClass: PrismaStoreViewRepository,
    },
    {
      provide: INJECTION_TOKENS.STORE_EVENT_REPOSITORY,
      useClass: PrismaStoreEventRepository,
    },
    {
      provide: INJECTION_TOKENS.STORE_AGGREGATIONS_REPOSITORY,
      useClass: PrismaStoreAggregationsRepository,
    },
  ],
  exports: [
    INJECTION_TOKENS.ANALYTICS_REPOSITORY,
    INJECTION_TOKENS.VISITOR_REPOSITORY,
    INJECTION_TOKENS.STORE_VIEW_REPOSITORY,
    INJECTION_TOKENS.STORE_EVENT_REPOSITORY,
    INJECTION_TOKENS.STORE_AGGREGATIONS_REPOSITORY,
  ],
})
export class AnalyticsModule {}
