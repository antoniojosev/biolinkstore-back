import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductMapper } from '../mappers/product.mapper';
import { generateSlug } from '@/common/utils/slug.util';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(productId: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // If name changed, generate new slug
    let slug = dto.name ? generateSlug(dto.name) : undefined;
    if (slug && slug !== existingProduct.slug) {
      let counter = 1;
      let tempSlug = slug;
      while (await this.productRepository.checkSlugExists(existingProduct.storeId, tempSlug)) {
        tempSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = tempSlug;
    } else {
      slug = undefined;
    }

    const product = await this.productRepository.update(productId, {
      ...dto,
      slug,
    });

    return ProductMapper.toResponse(product);
  }
}
