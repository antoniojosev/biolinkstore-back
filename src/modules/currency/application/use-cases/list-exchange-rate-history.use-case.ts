import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IExchangeRateHistoryRepository } from '../../domain/repositories/exchange-rate-history.repository.interface';
import { ExchangeRateHistory } from '../../domain/entities/exchange-rate-history.entity';

export interface ListHistoryInput {
  from?: Date;
  to?: Date;
  limit?: number;
}

@Injectable()
export class ListExchangeRateHistoryUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.EXCHANGE_RATE_HISTORY_REPOSITORY)
    private readonly historyRepository: IExchangeRateHistoryRepository,
  ) {}

  async execute(storeId: string, input: ListHistoryInput = {}): Promise<ExchangeRateHistory[]> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new NotFoundException('Store not found');

    return this.historyRepository.list(storeId, {
      from: input.from,
      to: input.to,
      limit: input.limit ?? 50,
    });
  }
}
