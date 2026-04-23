import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';

import { GetCurrentRateUseCase } from './application/use-cases/get-current-rate.use-case';
import { PrismaExchangeRateRepository } from './infrastructure/persistence/prisma-exchange-rate.repository';
import { BcvRateProvider } from './infrastructure/providers/bcv-rate.provider';
import { ExchangeRatesController } from './presentation/controllers/exchange-rates.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ExchangeRatesController],
  providers: [
    GetCurrentRateUseCase,
    BcvRateProvider,
    {
      provide: INJECTION_TOKENS.EXCHANGE_RATE_REPOSITORY,
      useClass: PrismaExchangeRateRepository,
    },
    {
      provide: INJECTION_TOKENS.RATE_PROVIDER,
      useFactory: (bcv: BcvRateProvider) => [bcv],
      inject: [BcvRateProvider],
    },
  ],
  exports: [GetCurrentRateUseCase, INJECTION_TOKENS.EXCHANGE_RATE_REPOSITORY],
})
export class CurrencyModule {}
