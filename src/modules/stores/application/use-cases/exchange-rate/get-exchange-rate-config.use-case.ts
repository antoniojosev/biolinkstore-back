import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ResolveRateUseCase } from '@/modules/currency/application/use-cases/resolve-rate.use-case';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { ExchangeRateConfigResponseDto } from '../../dto/exchange-rate-config.dto';

@Injectable()
export class GetExchangeRateConfigUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly resolveRate: ResolveRateUseCase,
  ) {}

  async execute(storeId: string): Promise<ExchangeRateConfigResponseDto> {
    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const plan = store.subscription?.plan;
    const canUseManual = plan === 'PRO' || plan === 'BUSINESS';

    const resolved = await this.resolveRate.execute({
      exchangeRateMode: store.exchangeRateMode,
      exchangeRateCode: store.exchangeRateCode,
      customRate: store.customRate,
    });

    return {
      mode: store.exchangeRateMode,
      code: store.exchangeRateCode,
      customRate: store.customRate,
      resolvedRate: resolved?.rate ?? null,
      resolvedSource: resolved?.source ?? null,
      canUseManual,
    };
  }
}
