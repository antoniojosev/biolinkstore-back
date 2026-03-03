import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { CreatePaymentReportUseCase } from './application/use-cases/create-payment-report.use-case';
import { ListPaymentReportsUseCase } from './application/use-cases/list-payment-reports.use-case';
import { PrismaPaymentReportRepository } from './infrastructure/persistence/prisma-payment-report.repository';
import { PaymentReportsController } from './presentation/controllers/payment-reports.controller';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    DatabaseModule,
    StoresModule
  ],
  controllers: [PaymentReportsController],
  providers: [
    CreatePaymentReportUseCase,
    ListPaymentReportsUseCase,
    {
      provide: INJECTION_TOKENS.PAYMENT_REPORT_REPOSITORY,
      useClass: PrismaPaymentReportRepository,
    },
  ],
})
export class PaymentReportsModule {}
