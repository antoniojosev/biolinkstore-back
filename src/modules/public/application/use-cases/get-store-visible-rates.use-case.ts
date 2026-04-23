import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { Plan } from '@prisma/client';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { RateResolverService } from '@/modules/rates/application/services/rate-resolver.service';
import { StoreVisibleRatesResponseDto } from '../dto/public-rate-response.dto';

const FREE_DEFAULT_RATES = ['USD_BCV'];
const PRO_DEFAULT_RATES = ['USD_BCV', 'EUR_BCV'];

@Injectable()
export class GetStoreVisibleRatesUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
    private readonly resolver: RateResolverService,
  ) {}

  async execute(slug: string): Promise<StoreVisibleRatesResponseDto> {
    const store = await this.storeRepo.findBySlug(slug);
    if (!store) throw new NotFoundException(`Store with slug "${slug}" not found`);

    const plan = store.subscription?.plan ?? Plan.FREE;
    const config = (store.currencyConfig ?? {}) as {
      visibleRates?: unknown;
      defaultRate?: unknown;
    };

    let requested: string[];
    let defaultRate: string | undefined;

    if (plan === Plan.FREE) {
      requested = FREE_DEFAULT_RATES;
      defaultRate = FREE_DEFAULT_RATES[0];
    } else {
      const configured = Array.isArray(config.visibleRates)
        ? config.visibleRates.filter((x): x is string => typeof x === 'string')
        : [];
      requested = configured.length > 0 ? configured : PRO_DEFAULT_RATES;
      defaultRate =
        typeof config.defaultRate === 'string' && requested.includes(config.defaultRate)
          ? config.defaultRate
          : requested[0];
    }

    const resolved: StoreVisibleRatesResponseDto['rates'] = [];
    for (const code of requested) {
      const r = await this.resolver.resolveOfficial(code);
      if (r) {
        resolved.push({
          code: r.code,
          label: r.label,
          baseCurrency: r.baseCurrency,
          valueVes: r.valueVes,
          fetchedAt: r.fetchedAt,
        });
      }
    }

    return { rates: resolved, defaultRate };
  }
}
