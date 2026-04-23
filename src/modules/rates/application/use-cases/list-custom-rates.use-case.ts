import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IRateRepository } from '../../domain/repositories/rate.repository.interface';
import { RateResolverService } from '../services/rate-resolver.service';
import { CustomRateResponseDto, CustomRateModeDto } from '../dto/custom-rate.dto';

@Injectable()
export class ListCustomRatesUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.RATE_REPOSITORY)
    private readonly rateRepo: IRateRepository,
    private readonly resolver: RateResolverService,
  ) {}

  async execute(storeId: string): Promise<CustomRateResponseDto[]> {
    const list = await this.rateRepo.findCustomsByStore(storeId);
    const out: CustomRateResponseDto[] = [];
    for (const r of list) {
      const resolved = await this.resolver.resolveCustom(r);
      out.push({
        id: r.id,
        label: r.label,
        baseCurrency: r.baseCurrency,
        mode: r.mode as CustomRateModeDto,
        valueVes: r.valueVes,
        formula: r.formula,
        sourceUrl: r.sourceUrl,
        sourcePath: r.sourcePath,
        resolvedValue: resolved?.valueVes ?? null,
        resolvedAt: resolved?.fetchedAt ?? null,
      });
    }
    return out;
  }
}
