import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ResolveRateUseCase } from '@/modules/currency/application/use-cases/resolve-rate.use-case';
import { IExchangeRateHistoryRepository } from '@/modules/currency/domain/repositories/exchange-rate-history.repository.interface';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import {
  ExchangeRateConfigResponseDto,
  UpdateExchangeRateConfigDto,
} from '../../dto/exchange-rate-config.dto';
import { enforceManualRateAccess } from './validate-plan-access.util';

@Injectable()
export class UpdateExchangeRateConfigUseCase {
  private readonly logger = new Logger(UpdateExchangeRateConfigUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.EXCHANGE_RATE_HISTORY_REPOSITORY)
    private readonly historyRepository: IExchangeRateHistoryRepository,
    private readonly resolveRate: ResolveRateUseCase,
  ) {}

  async execute(
    storeId: string,
    dto: UpdateExchangeRateConfigDto,
    userId?: string,
  ): Promise<ExchangeRateConfigResponseDto> {
    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (dto.mode === 'MANUAL') {
      enforceManualRateAccess(store.subscription?.plan);
      if (dto.customRate == null || dto.customRate <= 0) {
        throw new BadRequestException(
          'Tasa manual requiere customRate > 0',
        );
      }
    }

    const updated = await this.storeRepository.update(storeId, {
      exchangeRateMode: dto.mode,
      exchangeRateCode: dto.code,
      customRate: dto.mode === 'MANUAL' ? dto.customRate ?? null : null,
    });

    const resolved = await this.resolveRate.execute({
      exchangeRateMode: updated.exchangeRateMode,
      exchangeRateCode: updated.exchangeRateCode,
      customRate: updated.customRate,
      storeId: updated.id,
    });

    // Append history entry for this manual config change.
    if (resolved) {
      this.historyRepository
        .create({
          storeId: updated.id,
          rate: resolved.rate,
          source: dto.mode === 'MANUAL' ? 'MANUAL_UPDATE' : `AUTO:${resolved.source}`,
          changedBy: userId ?? null,
        })
        .catch((err) => this.logger.warn(`History write failed: ${err?.message ?? err}`));
    }

    const plan = store.subscription?.plan;
    return {
      mode: updated.exchangeRateMode,
      code: updated.exchangeRateCode,
      customRate: updated.customRate,
      resolvedRate: resolved?.rate ?? null,
      resolvedSource: resolved?.source ?? null,
      canUseManual: plan === 'PRO' || plan === 'BUSINESS',
    };
  }
}
