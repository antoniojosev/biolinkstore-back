import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '../stores/stores.module';
import { OrdersModule } from '../orders/orders.module';

// Application - Use Cases
import { TrackEventUseCase } from './application/use-cases/track-event.use-case';
import { GetStoreStatsUseCase } from './application/use-cases/get-store-stats.use-case';
import { GetAnalyticsUseCase } from './application/use-cases/get-analytics.use-case';

// Infrastructure - Repositories
import { PrismaAnalyticsRepository } from './infrastructure/persistence/prisma-analytics.repository';
import { PrismaVisitorRepository } from './infrastructure/persistence/prisma-visitor.repository';

// Presentation - Controllers
import { AnalyticsController } from './presentation/controllers/analytics.controller';

@Module({
  imports: [DatabaseModule, StoresModule, OrdersModule],
  controllers: [AnalyticsController],
  providers: [
    // Use Cases
    TrackEventUseCase,
    GetStoreStatsUseCase,
    GetAnalyticsUseCase,

    // Repository Bindings
    {
      provide: INJECTION_TOKENS.ANALYTICS_REPOSITORY,
      useClass: PrismaAnalyticsRepository,
    },
    {
      provide: INJECTION_TOKENS.VISITOR_REPOSITORY,
      useClass: PrismaVisitorRepository,
    },
  ],
  exports: [INJECTION_TOKENS.ANALYTICS_REPOSITORY, INJECTION_TOKENS.VISITOR_REPOSITORY],
})
export class AnalyticsModule {}
