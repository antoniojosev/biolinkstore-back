import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IProductRepository, ProductFilterParams } from '@/modules/products/domain/repositories/product.repository.interface';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { PublicProductResponseDto } from '../dto/public-product-response.dto';

@Injectable()
export class GetPublicProductsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    slug: string,
    params: ProductFilterParams,
  ): Promise<PaginatedResult<PublicProductResponseDto>> {
    // Verify store exists
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Force visible products only for public view
    const publicParams = {
      ...params,
      isVisible: true,
    };

    const result = await this.productRepository.findByStoreId(store.id, publicParams);

    // Map to public response (hide sensitive data like stock if needed)
    const publicProducts = result.data.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice,
      images: product.images,
      videos: product.videos,
      stock: store.stockEnabled ? product.stock : null, // Hide stock if disabled
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      attributes: product.attributes?.map((attr) => ({
        id: attr.id,
        name: attr.name,
        options: attr.options,
        sortOrder: attr.sortOrder,
      })),
      variants: product.variants?.map((variant) => ({
        id: variant.id,
        combination: variant.combination,
        sku: variant.sku,
        priceAdjustment: variant.priceAdjustment,
        stock: store.stockEnabled ? variant.stock : null,
        image: variant.image,
        isAvailable: variant.isAvailable,
      })),
      categories: product.categoryIds?.map((id) => ({
        id,
        name: '', // Would need to fetch category names if needed
        slug: '',
      })),
    }));

    return {
      data: publicProducts,
      meta: result.meta,
    };
  }
}
