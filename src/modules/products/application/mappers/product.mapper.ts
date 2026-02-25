import {
  Product as PrismaProduct,
  ProductAttribute as PrismaAttribute,
  ProductVariant as PrismaVariant,
  CategoriesOnProducts,
} from '@prisma/client';
import { Product, ProductAttribute, ProductVariant } from '../../domain/entities/product.entity';
import { ProductResponseDto, ProductAttributeResponseDto, ProductVariantResponseDto } from '../dto/product-response.dto';

type ProductWithRelations = PrismaProduct & {
  attributes?: PrismaAttribute[];
  variants?: PrismaVariant[];
  categories?: CategoriesOnProducts[];
};

export class ProductMapper {
  static toDomain(prismaProduct: ProductWithRelations): Product {
    return new Product({
      id: prismaProduct.id,
      storeId: prismaProduct.storeId,
      name: prismaProduct.name,
      slug: prismaProduct.slug,
      description: prismaProduct.description,
      basePrice: Number(prismaProduct.basePrice),
      compareAtPrice: prismaProduct.compareAtPrice ? Number(prismaProduct.compareAtPrice) : null,
      prices: prismaProduct.prices,
      images: prismaProduct.images,
      videos: prismaProduct.videos,
      stock: prismaProduct.stock,
      sku: prismaProduct.sku,
      isVisible: prismaProduct.isVisible,
      isFeatured: prismaProduct.isFeatured,
      isOnSale: prismaProduct.isOnSale,
      sortOrder: prismaProduct.sortOrder,
      attributes: prismaProduct.attributes?.map((attr) => new ProductAttribute({
        id: attr.id,
        productId: attr.productId,
        name: attr.name,
        options: attr.options,
        sortOrder: attr.sortOrder,
      })),
      variants: prismaProduct.variants?.map((variant) => new ProductVariant({
        id: variant.id,
        productId: variant.productId,
        combination: variant.combination,
        sku: variant.sku,
        priceAdjustment: Number(variant.priceAdjustment),
        stock: variant.stock,
        image: variant.image,
        isAvailable: variant.isAvailable,
      })),
      categoryIds: prismaProduct.categories?.map((cat) => cat.categoryId),
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    });
  }

  static toResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      storeId: product.storeId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice,
      prices: product.prices,
      images: product.images,
      videos: product.videos,
      stock: product.stock,
      sku: product.sku,
      isVisible: product.isVisible,
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      sortOrder: product.sortOrder,
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
        stock: variant.stock,
        image: variant.image,
        isAvailable: variant.isAvailable,
      })),
      categoryIds: product.categoryIds,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
