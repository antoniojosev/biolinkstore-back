import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '@/modules/stores/stores.module';

import { CreatePaymentMethodUseCase } from './application/use-cases/create-payment-method.use-case';
import { UpdatePaymentMethodUseCase } from './application/use-cases/update-payment-method.use-case';
import { ListPaymentMethodsUseCase } from './application/use-cases/list-payment-methods.use-case';
import { DeletePaymentMethodUseCase } from './application/use-cases/delete-payment-method.use-case';

import { PrismaPaymentMethodRepository } from './infrastructure/persistence/prisma-payment-method.repository';

import { PaymentMethodsController } from './presentation/controllers/payment-methods.controller';

@Module({
  imports: [DatabaseModule, StoresModule],
  controllers: [PaymentMethodsController],
  providers: [
    CreatePaymentMethodUseCase,
    UpdatePaymentMethodUseCase,
    ListPaymentMethodsUseCase,
    DeletePaymentMethodUseCase,
    {
      provide: INJECTION_TOKENS.PAYMENT_METHOD_REPOSITORY,
      useClass: PrismaPaymentMethodRepository,
    },
  ],
  exports: [INJECTION_TOKENS.PAYMENT_METHOD_REPOSITORY],
})
export class PaymentMethodsModule {}
