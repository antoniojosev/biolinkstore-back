import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IProductRepository } from '@/modules/products/domain/repositories/product.repository.interface';
import { PublicProductResponseDto } from '../dto/public-product-response.dto';

@Injectable()
export class GetPublicProductUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(storeSlug: string, productSlug: string): Promise<PublicProductResponseDto> {
    // Verify store exists
    const store = await this.storeRepository.findBySlug(storeSlug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Find product by slug
    const product = await this.productRepository.findBySlug(store.id, productSlug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is visible
    if (!product.isVisible) {
      throw new NotFoundException('Product not found');
    }

    // Return public product data
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice,
      images: product.images,
      videos: product.videos,
      stock: store.stockEnabled ? product.stock : null,
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      attributes: product.attributes?.map((attr) => ({
        id: attr.id,
        name: attr.name,
        options: attr.options,
        type: attr.type ?? 'text',
        optionsMeta: attr.optionsMeta ?? null,
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
        name: '',
        slug: '',
      })),
    };
  }
}
