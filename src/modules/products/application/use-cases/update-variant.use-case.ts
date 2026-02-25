import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IVariantRepository } from '../../domain/repositories/variant.repository.interface';
import { UpdateVariantDto } from '../dto/update-variant.dto';
import { ProductVariantResponseDto } from '../dto/product-response.dto';

@Injectable()
export class UpdateVariantUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.VARIANT_REPOSITORY)
    private readonly variantRepository: IVariantRepository,
  ) {}

  async execute(variantId: string, dto: UpdateVariantDto): Promise<ProductVariantResponseDto> {
    const existingVariant = await this.variantRepository.findById(variantId);
    if (!existingVariant) {
      throw new NotFoundException('Variant not found');
    }

    const variant = await this.variantRepository.update(variantId, dto);

    return {
      id: variant.id,
      combination: variant.combination,
      sku: variant.sku,
      priceAdjustment: variant.priceAdjustment,
      stock: variant.stock,
      image: variant.image,
      isAvailable: variant.isAvailable,
    };
  }
}
