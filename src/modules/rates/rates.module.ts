import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '@/modules/stores/stores.module';

import { FormulaParserService } from './domain/services/formula-parser.service';
import { RateResolverService } from './application/services/rate-resolver.service';
import { PrismaRateRepository } from './infrastructure/persistence/prisma-rate.repository';

import { CreateCustomRateUseCase } from './application/use-cases/create-custom-rate.use-case';
import { UpdateCustomRateUseCase } from './application/use-cases/update-custom-rate.use-case';
import { ListCustomRatesUseCase } from './application/use-cases/list-custom-rates.use-case';
import { DeleteCustomRateUseCase } from './application/use-cases/delete-custom-rate.use-case';

import { CustomRatesController } from './presentation/controllers/custom-rates.controller';

@Module({
  imports: [DatabaseModule, StoresModule],
  controllers: [CustomRatesController],
  providers: [
    FormulaParserService,
    RateResolverService,
    CreateCustomRateUseCase,
    UpdateCustomRateUseCase,
    ListCustomRatesUseCase,
    DeleteCustomRateUseCase,
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
