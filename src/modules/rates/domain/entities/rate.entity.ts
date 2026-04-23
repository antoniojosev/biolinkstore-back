export type CustomRateMode = 'MANUAL' | 'FORMULA' | 'API';

export class Rate {
  code: string;
  label: string;
  baseCurrency: string;
  sourceUrl: string | null;
  sourcePath: string | null;
  isActive: boolean;
  lastValue: number | null;
  lastFetchedAt: Date | null;

  constructor(partial: Partial<Rate>) {
    Object.assign(this, partial);
  }
}

export class StoreCustomRate {
  id: string;
  storeId: string;
  label: string;
  baseCurrency: string;
  mode: CustomRateMode;
  valueVes: number | null;
  formula: string | null;
  sourceUrl: string | null;
  sourcePath: string | null;
  lastValue: number | null;
  lastFetchedAt: Date | null;

  constructor(partial: Partial<StoreCustomRate>) {
    Object.assign(this, partial);
  }
}
