import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { generateSlug } from '@/common/utils/slug.util';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(storeId: string, dto: CreateProductDto): Promise<ProductResponseDto> {
    // Generate unique slug
    const baseSlug = generateSlug(dto.name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.productRepository.checkSlugExists(storeId, slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create product with attributes
    const product = await this.productRepository.create({
      storeId,
      name: dto.name,
      slug,
      description: dto.description,
      basePrice: dto.basePrice,
      compareAtPrice: dto.compareAtPrice,
      images: dto.images || [],
      videos: dto.videos || [],
      stock: dto.stock,
      sku: dto.sku,
      isVisible: dto.isVisible ?? true,
      isFeatured: dto.isFeatured ?? false,
      isOnSale: dto.isOnSale ?? false,
      attributes: dto.attributes?.map((attr, index) => ({
        name: attr.name,
        options: attr.options,
        sortOrder: attr.sortOrder ?? index,
      })),
      categoryIds: dto.categoryIds,
    });

    return ProductMapper.toResponse(product);
  }
}
