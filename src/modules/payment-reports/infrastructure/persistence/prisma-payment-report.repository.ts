import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IPaymentReportRepository } from '../../domain/repositories/payment-report.repository.interface';
import { PaymentReport } from '../../domain/entities/payment-report.entity';
import { PaymentReportMapper } from '../../application/mappers/payment-report.mapper';

@Injectable()
export class PrismaPaymentReportRepository implements IPaymentReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<PaymentReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<PaymentReport> {
    const record = await this.prisma.paymentReport.create({
      data: {
        storeId: data.storeId,
        type: data.type,
        targetPlan: data.targetPlan,
        name: data.name,
        phone: data.phone,
        bank: data.bank,
        transferDate: data.transferDate,
        proofUrl: data.proofUrl,
        notes: data.notes,
      },
    });
    return PaymentReportMapper.toDomain(record);
  }

  async findByStoreId(storeId: string): Promise<PaymentReport[]> {
    const records = await this.prisma.paymentReport.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(PaymentReportMapper.toDomain);
  }
}
