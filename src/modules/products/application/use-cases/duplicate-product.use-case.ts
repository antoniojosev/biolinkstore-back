import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductMapper } from '../mappers/product.mapper';
import { enforceProductLimit } from '../validate-plan-limits.util';

@Injectable()
export class DuplicateProductUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(productId: string): Promise<ProductResponseDto> {
    const originalProduct = await this.productRepository.findById(productId);
    if (!originalProduct) {
      throw new NotFoundException('Product not found');
    }

    const store = await this.storeRepository.findByIdWithSubscription(
      originalProduct.storeId,
    );
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const currentCount = await this.productRepository.countByStoreId(
      originalProduct.storeId,
    );
    enforceProductLimit(store.subscription?.plan, currentCount);

    // Generate unique slug for duplicated product
    const baseSlug = `${originalProduct.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;

    while (await this.productRepository.checkSlugExists(originalProduct.storeId, slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create duplicate
    const duplicatedProduct = await this.productRepository.create({
      storeId: originalProduct.storeId,
      name: `${originalProduct.name} (Copy)`,
      slug,
      description: originalProduct.description || undefined,
      basePrice: originalProduct.basePrice,
      compareAtPrice: originalProduct.compareAtPrice || undefined,
      prices: originalProduct.prices,
      images: originalProduct.images,
      videos: originalProduct.videos,
      stock: originalProduct.stock || undefined,
      sku: originalProduct.sku ? `${originalProduct.sku}-COPY` : undefined,
      isVisible: false, // Duplicated products start as hidden
      isFeatured: false,
      isOnSale: originalProduct.isOnSale,
      attributes: originalProduct.attributes?.map((attr) => ({
        name: attr.name,
        options: attr.options,
        type: attr.type ?? 'text',
        optionsMeta: attr.optionsMeta ?? null,
        sortOrder: attr.sortOrder,
      })),
      categoryIds: originalProduct.categoryIds,
    });

    return ProductMapper.toResponse(duplicatedProduct);
  }
}
