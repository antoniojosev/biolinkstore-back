export type PaymentMethodType =
  | 'PAGO_MOVIL'
  | 'ZELLE'
  | 'BINANCE'
  | 'TRANSFER'
  | 'CASH'
  | 'OTHER';

export class StorePaymentMethod {
  id: string;
  storeId: string;
  type: PaymentMethodType;
  label: string;
  details: Record<string, unknown>;
  instructions: string | null;
  enabled: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StorePaymentMethod>) {
    Object.assign(this, partial);
  }
}
