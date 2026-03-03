import { PaymentReport } from '../entities/payment-report.entity';

export interface IPaymentReportRepository {
  create(data: Omit<PaymentReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<PaymentReport>;
  findByStoreId(storeId: string): Promise<PaymentReport[]>;
}
