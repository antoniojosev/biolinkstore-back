import {
  Product as PrismaProduct,
  ProductAttribute as PrismaAttribute,
  ProductVariant as PrismaVariant,
  ProductRealEstateData as PrismaRealEstateData,
  CategoriesOnProducts,
} from '@prisma/client';
import { Product, ProductAttribute, ProductVariant } from '../../domain/entities/product.entity';
import {
  ProductRealEstateData,
  RealEstateListingType,
} from '../../domain/entities/product-real-estate-data.entity';
import { ProductResponseDto, ProductAttributeResponseDto, ProductVariantResponseDto } from '../dto/product-response.dto';

type ProductWithRelations = PrismaProduct & {
  attributes?: PrismaAttribute[];
  variants?: PrismaVariant[];
  categories?: CategoriesOnProducts[];
  realEstateData?: PrismaRealEstateData | null;
};

export class ProductMapper {
  static toDomain(prismaProduct: ProductWithRelations): Product {
    return new Product({
      id: prismaProduct.id,
      storeId: prismaProduct.storeId,
      name: prismaProduct.name,
      slug: prismaProduct.slug,
      tagline: prismaProduct.tagline,
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
        type: attr.type,
        role: attr.role,
        optionsMeta: attr.optionsMeta,
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
      realEstateData: prismaProduct.realEstateData
        ? new ProductRealEstateData({
            id: prismaProduct.realEstateData.id,
            productId: prismaProduct.realEstateData.productId,
            bedrooms: prismaProduct.realEstateData.bedrooms,
            bathrooms: prismaProduct.realEstateData.bathrooms,
            area: prismaProduct.realEstateData.area
              ? Number(prismaProduct.realEstateData.area)
              : null,
            listingType: prismaProduct.realEstateData.listingType as RealEstateListingType | null,
            createdAt: prismaProduct.realEstateData.createdAt,
            updatedAt: prismaProduct.realEstateData.updatedAt,
          })
        : prismaProduct.realEstateData === null
          ? null
          : undefined,
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
      tagline: product.tagline,
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
        type: attr.type,
        role: attr.role,
        optionsMeta: attr.optionsMeta,
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
      realEstateData: product.realEstateData
        ? {
            id: product.realEstateData.id,
            bedrooms: product.realEstateData.bedrooms,
            bathrooms: product.realEstateData.bathrooms,
            area: product.realEstateData.area,
            listingType: product.realEstateData.listingType,
          }
        : product.realEstateData === null
          ? null
          : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
