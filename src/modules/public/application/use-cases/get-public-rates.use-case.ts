import { Injectable } from '@nestjs/common';
import { RateResolverService } from '@/modules/rates/application/services/rate-resolver.service';
import { PublicRateResponseDto } from '../dto/public-rate-response.dto';

@Injectable()
export class GetPublicRatesUseCase {
  constructor(private readonly resolver: RateResolverService) {}

  async execute(): Promise<PublicRateResponseDto[]> {
    const rates = await this.resolver.resolveAllOfficial();
    return rates.map((r) => ({
      code: r.code,
      label: r.label,
      baseCurrency: r.baseCurrency,
      valueVes: r.valueVes,
      fetchedAt: r.fetchedAt,
    }));
  }
}
