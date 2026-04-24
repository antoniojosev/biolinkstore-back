import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { generateSlug } from '@/common/utils/slug.util';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductMapper } from '../mappers/product.mapper';
import { enforceProductLimit } from '../validate-plan-limits.util';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(storeId: string, dto: CreateProductDto): Promise<ProductResponseDto> {
    // Plan limit gating
    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const currentCount = await this.productRepository.countByStoreId(storeId);
    enforceProductLimit(store.subscription?.plan, currentCount);

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
      tagline: dto.tagline ?? null,
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
        type: attr.type ?? 'text',
        role: attr.role ?? 'variant',
        optionsMeta: attr.optionsMeta ?? null,
        sortOrder: attr.sortOrder ?? index,
      })),
      categoryIds: dto.categoryIds,
      realEstateData: dto.realEstateData
        ? {
            bedrooms: dto.realEstateData.bedrooms ?? null,
            bathrooms: dto.realEstateData.bathrooms ?? null,
            area: dto.realEstateData.area ?? null,
            listingType: dto.realEstateData.listingType ?? null,
          }
        : undefined,
    });

    return ProductMapper.toResponse(product);
  }
}
