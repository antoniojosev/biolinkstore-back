import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IVariantRepository } from '../../domain/repositories/variant.repository.interface';

@Injectable()
export class DeleteVariantUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.VARIANT_REPOSITORY)
    private readonly variantRepository: IVariantRepository,
  ) {}

  async execute(variantId: string): Promise<void> {
    const variant = await this.variantRepository.findById(variantId);
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.variantRepository.delete(variantId);
  }
}
