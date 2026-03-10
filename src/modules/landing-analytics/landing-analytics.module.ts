import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { LandingAnalyticsController } from './presentation/controllers/landing-analytics.controller';
import { PrismaLandingVisitorRepository } from './infrastructure/persistence/prisma-landing-visitor.repository';
import { TrackLandingVisitUseCase } from './application/use-cases/track-landing-visit.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [LandingAnalyticsController],
  providers: [
    TrackLandingVisitUseCase,
    {
      provide: INJECTION_TOKENS.LANDING_VISITOR_REPOSITORY,
      useClass: PrismaLandingVisitorRepository,
    },
  ],
  exports: [
    {
      provide: INJECTION_TOKENS.LANDING_VISITOR_REPOSITORY,
      useClass: PrismaLandingVisitorRepository,
    },
  ],
})
export class LandingAnalyticsModule {}
