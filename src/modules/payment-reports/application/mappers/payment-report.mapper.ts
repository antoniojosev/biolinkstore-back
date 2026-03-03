import { PaymentReport } from '../../domain/entities/payment-report.entity';
import { PaymentReportResponseDto } from '../dto/payment-report-response.dto';
import { PaymentReport as PrismaPaymentReport } from '@prisma/client';

export class PaymentReportMapper {
  static toDomain(prisma: PrismaPaymentReport): PaymentReport {
    return {
      id: prisma.id,
      storeId: prisma.storeId,
      type: prisma.type,
      targetPlan: prisma.targetPlan,
      status: prisma.status,
      name: prisma.name,
      phone: prisma.phone,
      bank: prisma.bank,
      transferDate: prisma.transferDate,
      proofUrl: prisma.proofUrl,
      notes: prisma.notes,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };
  }

  static toResponse(entity: PaymentReport): PaymentReportResponseDto {
    return {
      id: entity.id,
      storeId: entity.storeId,
      type: entity.type,
      targetPlan: entity.targetPlan,
      status: entity.status,
      name: entity.name,
      phone: entity.phone,
      bank: entity.bank,
      transferDate: entity.transferDate,
      proofUrl: entity.proofUrl,
      notes: entity.notes,
      createdAt: entity.createdAt,
    };
  }
}
