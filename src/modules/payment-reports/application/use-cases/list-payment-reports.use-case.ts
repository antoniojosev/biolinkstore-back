import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IPaymentReportRepository } from '../../domain/repositories/payment-report.repository.interface';
import { PaymentReportResponseDto } from '../dto/payment-report-response.dto';
import { PaymentReportMapper } from '../mappers/payment-report.mapper';

@Injectable()
export class ListPaymentReportsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_REPORT_REPOSITORY)
    private readonly repo: IPaymentReportRepository,
  ) {}

  async execute(storeId: string): Promise<PaymentReportResponseDto[]> {
    const reports = await this.repo.findByStoreId(storeId);
    return reports.map(PaymentReportMapper.toResponse);
  }
}
