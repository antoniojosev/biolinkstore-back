import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IRateRepository } from '../../domain/repositories/rate.repository.interface';

@Injectable()
export class DeleteCustomRateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.RATE_REPOSITORY)
    private readonly rateRepo: IRateRepository,
  ) {}

  async execute(storeId: string, id: string): Promise<void> {
    const existing = await this.rateRepo.findCustomById(id);
    if (!existing) throw new NotFoundException('Custom rate not found');
    if (existing.storeId !== storeId) {
      throw new ForbiddenException('Custom rate does not belong to this store');
    }
    await this.rateRepo.deleteCustom(id);
  }
}
