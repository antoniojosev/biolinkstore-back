import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ExchangeRateMode } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { GetCurrentRateUseCase } from './get-current-rate.use-case';
import { IExchangeRateHistoryRepository } from '../../domain/repositories/exchange-rate-history.repository.interface';

export interface StoreRateConfig {
  exchangeRateMode: ExchangeRateMode;
  exchangeRateCode: string;
  customRate: number | null;
  storeId?: string; // optional: when provided, lazily records AUTO rate changes in history
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
  private readonly logger = new Logger(ResolveRateUseCase.name);

  constructor(
    private readonly getCurrentRate: GetCurrentRateUseCase,
    @Optional()
    @Inject(INJECTION_TOKENS.EXCHANGE_RATE_HISTORY_REPOSITORY)
    private readonly historyRepository: IExchangeRateHistoryRepository | null = null,
  ) {}

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

      // Lazy history write: if AUTO rate differs from last recorded for this store, append.
      if (store.storeId && this.historyRepository) {
        this.recordIfChanged(store.storeId, current.rate, current.source).catch((err) =>
          this.logger.debug(`Rate history write skipped: ${err?.message ?? err}`),
        );
      }

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

  private async recordIfChanged(storeId: string, rate: number, source: string): Promise<void> {
    if (!this.historyRepository) return;
    const last = await this.historyRepository.findLatestForStore(storeId);
    if (last && Math.abs(Number(last.rate) - rate) < 1e-8) return;

    await this.historyRepository.create({
      storeId,
      rate,
      source: `AUTO:${source}`,
    });
  }
}
