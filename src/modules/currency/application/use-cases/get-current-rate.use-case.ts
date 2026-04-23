import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IExchangeRateRepository } from '../../domain/repositories/exchange-rate.repository.interface';
import { IRateProvider } from '../../domain/providers/rate-provider.interface';
import { ExchangeRateResponseDto } from '../dto/exchange-rate.dto';

export const EXCHANGE_RATE_TTL_MS = 2 * 60 * 60 * 1000; // 2h

@Injectable()
export class GetCurrentRateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.EXCHANGE_RATE_REPOSITORY)
    private readonly repository: IExchangeRateRepository,
    @Inject(INJECTION_TOKENS.RATE_PROVIDER)
    private readonly providers: IRateProvider[],
  ) {}

  async execute(code: string): Promise<ExchangeRateResponseDto> {
    const cached = await this.repository.findByCode(code);
    if (cached && !cached.isStale(EXCHANGE_RATE_TTL_MS)) {
      return {
        code: cached.code,
        rate: cached.rate,
        source: cached.source,
        fetchedAt: cached.fetchedAt,
        refreshed: false,
      };
    }

    const provider = this.providers.find((p) => p.supports(code));
    if (!provider) {
      if (cached) {
        return {
          code: cached.code,
          rate: cached.rate,
          source: cached.source,
          fetchedAt: cached.fetchedAt,
          refreshed: false,
        };
      }
      throw new NotFoundException(`No rate provider supports code ${code}`);
    }

    try {
      const { rate, source } = await provider.fetch(code);
      const fetchedAt = new Date();
      const saved = await this.repository.upsert({ code, rate, source, fetchedAt });
      return {
        code: saved.code,
        rate: saved.rate,
        source: saved.source,
        fetchedAt: saved.fetchedAt,
        refreshed: true,
      };
    } catch (err) {
      if (cached) {
        return {
          code: cached.code,
          rate: cached.rate,
          source: cached.source,
          fetchedAt: cached.fetchedAt,
          refreshed: false,
        };
      }
      throw err;
    }
  }
}
