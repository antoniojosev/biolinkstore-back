export class ExchangeRateHistory {
  id: string;
  storeId: string;
  rate: number;
  source: string;
  effectiveFrom: Date;
  changedBy: string | null;
  createdAt: Date;

  constructor(partial: Partial<ExchangeRateHistory>) {
    Object.assign(this, partial);
  }
}
