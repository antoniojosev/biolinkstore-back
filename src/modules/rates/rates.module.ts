import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { FormulaParserService } from './domain/services/formula-parser.service';
import { RateResolverService } from './application/services/rate-resolver.service';
import { PrismaRateRepository } from './infrastructure/persistence/prisma-rate.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    FormulaParserService,
    RateResolverService,
    {
      provide: INJECTION_TOKENS.RATE_REPOSITORY,
      useClass: PrismaRateRepository,
    },
  ],
  exports: [
    FormulaParserService,
    RateResolverService,
    INJECTION_TOKENS.RATE_REPOSITORY,
  ],
})
export class RatesModule {}
