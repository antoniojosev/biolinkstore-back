import { Injectable } from '@nestjs/common';
import { ExchangeRateMode } from '@prisma/client';
import { GetCurrentRateUseCase } from './get-current-rate.use-case';

export interface StoreRateConfig {
  exchangeRateMode: ExchangeRateMode;
  exchangeRateCode: string;
  customRate: number | null;
}

export interface ResolvedRate {
  rate: number;
  source: string;
  mode: ExchangeRateMode;
  code: string;
  fetchedAt: Date;
}

@Injectable()
export class ResolveRateUseCase {
  constructor(private readonly getCurrentRate: GetCurrentRateUseCase) {}

  async execute(store: StoreRateConfig): Promise<ResolvedRate | null> {
    if (store.exchangeRateMode === 'MANUAL') {
      if (store.customRate == null || store.customRate <= 0) {
        return null;
      }
      return {
        rate: store.customRate,
        source: 'manual',
        mode: 'MANUAL',
        code: store.exchangeRateCode,
        fetchedAt: new Date(),
      };
    }

    try {
      const current = await this.getCurrentRate.execute(store.exchangeRateCode);
      return {
        rate: current.rate,
        source: current.source,
        mode: 'AUTO',
        code: current.code,
        fetchedAt: current.fetchedAt,
      };
    } catch {
      return null;
    }
  }
}
