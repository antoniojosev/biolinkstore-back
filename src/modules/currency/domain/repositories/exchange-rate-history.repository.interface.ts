import { ExchangeRateHistory } from '../entities/exchange-rate-history.entity';

export interface CreateExchangeRateHistoryData {
  storeId: string;
  rate: number;
  source: string;
  changedBy?: string | null;
  effectiveFrom?: Date;
}

export interface ListExchangeRateHistoryParams {
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface IExchangeRateHistoryRepository {
  create(data: CreateExchangeRateHistoryData): Promise<ExchangeRateHistory>;
  findLatestForStore(storeId: string): Promise<ExchangeRateHistory | null>;
  list(storeId: string, params?: ListExchangeRateHistoryParams): Promise<ExchangeRateHistory[]>;
}
