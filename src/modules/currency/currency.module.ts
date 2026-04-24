import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';

import { GetCurrentRateUseCase } from './application/use-cases/get-current-rate.use-case';
import { ResolveRateUseCase } from './application/use-cases/resolve-rate.use-case';
import { ListExchangeRateHistoryUseCase } from './application/use-cases/list-exchange-rate-history.use-case';
import { PrismaExchangeRateRepository } from './infrastructure/persistence/prisma-exchange-rate.repository';
import { PrismaExchangeRateHistoryRepository } from './infrastructure/persistence/prisma-exchange-rate-history.repository';
import { BcvRateProvider } from './infrastructure/providers/bcv-rate.provider';
import { ExchangeRatesController } from './presentation/controllers/exchange-rates.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ExchangeRatesController],
  providers: [
    GetCurrentRateUseCase,
    ResolveRateUseCase,
    ListExchangeRateHistoryUseCase,
    BcvRateProvider,
    {
      provide: INJECTION_TOKENS.EXCHANGE_RATE_REPOSITORY,
      useClass: PrismaExchangeRateRepository,
    },
    {
      provide: INJECTION_TOKENS.EXCHANGE_RATE_HISTORY_REPOSITORY,
      useClass: PrismaExchangeRateHistoryRepository,
    },
    {
      provide: INJECTION_TOKENS.RATE_PROVIDER,
      useFactory: (bcv: BcvRateProvider) => [bcv],
      inject: [BcvRateProvider],
    },
  ],
  exports: [
    GetCurrentRateUseCase,
    ResolveRateUseCase,
    ListExchangeRateHistoryUseCase,
    INJECTION_TOKENS.EXCHANGE_RATE_REPOSITORY,
    INJECTION_TOKENS.EXCHANGE_RATE_HISTORY_REPOSITORY,
  ],
})
export class CurrencyModule {}
