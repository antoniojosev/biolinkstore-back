import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IPaymentReportRepository } from '../../domain/repositories/payment-report.repository.interface';
import { CreatePaymentReportDto } from '../dto/create-payment-report.dto';
import { PaymentReportResponseDto } from '../dto/payment-report-response.dto';
import { PaymentReportMapper } from '../mappers/payment-report.mapper';

@Injectable()
export class CreatePaymentReportUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_REPORT_REPOSITORY)
    private readonly repo: IPaymentReportRepository,
  ) {}

  async execute(storeId: string, dto: CreatePaymentReportDto): Promise<PaymentReportResponseDto> {
    const report = await this.repo.create({
      storeId,
      type: dto.type,
      targetPlan: dto.targetPlan ?? null,
      name: dto.name,
      phone: dto.phone,
      bank: dto.bank,
      transferDate: new Date(dto.transferDate),
      proofUrl: dto.proofUrl,
      notes: dto.notes ?? null,
    });

    return PaymentReportMapper.toResponse(report);
  }
}
