export class PaymentReport {
  id: string;
  storeId: string;
  type: 'PLAN_UPGRADE' | 'DOMAIN' | 'DESIGN';
  targetPlan?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  name: string;
  phone: string;
  bank: string;
  transferDate: Date;
  proofUrl: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
