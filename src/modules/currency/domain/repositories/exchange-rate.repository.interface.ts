import { ExchangeRate } from '../entities/exchange-rate.entity';

export interface IExchangeRateRepository {
  findByCode(code: string): Promise<ExchangeRate | null>;
  upsert(data: UpsertExchangeRateData): Promise<ExchangeRate>;
}

export interface UpsertExchangeRateData {
  code: string;
  rate: number;
  source: string;
  fetchedAt: Date;
}
