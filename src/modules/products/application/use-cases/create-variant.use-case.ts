import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { IVariantRepository } from '../../domain/repositories/variant.repository.interface';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { ProductVariantResponseDto } from '../dto/product-response.dto';

@Injectable()
export class CreateVariantUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(INJECTION_TOKENS.VARIANT_REPOSITORY)
    private readonly variantRepository: IVariantRepository,
  ) {}

  async execute(productId: string, dto: CreateVariantDto): Promise<ProductVariantResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = await this.variantRepository.create({
      productId,
      combination: dto.combination,
      sku: dto.sku,
      priceAdjustment: dto.priceAdjustment ?? 0,
      stock: dto.stock,
      image: dto.image,
      isAvailable: dto.isAvailable ?? true,
    });

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
