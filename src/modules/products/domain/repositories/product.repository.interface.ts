import { Product } from '../entities/product.entity';
import { RealEstateListingType } from '../entities/product-real-estate-data.entity';
import { ServiceModality } from '../entities/product-service-data.entity';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(storeId: string, slug: string): Promise<Product | null>;
  findByStoreId(storeId: string, params?: ProductFilterParams): Promise<PaginatedResult<Product>>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
  checkSlugExists(storeId: string, slug: string): Promise<boolean>;
  countByStoreId(storeId: string): Promise<number>;
}

export interface ProductFilterParams extends PaginationParams {
  categoryId?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  search?: string;
  // Real estate niche filters (nested on realEstateData relation)
  bedrooms?: number;
  bathrooms?: number;
  area_min?: number;
  area_max?: number;
  listingType?: RealEstateListingType;
  // Services niche filters (nested on serviceData relation)
  modality?: ServiceModality;
  duration_min?: number;
  duration_max?: number;
}

export interface CreateProductData {
  storeId: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string;
  basePrice: number;
  compareAtPrice?: number;
  priceCurrency?: string;
  images?: string[];
  videos?: string[];
  stock?: number;
  sku?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  sortOrder?: number;
  attributes?: Array<{
    name: string;
    options: string[];
    type: string;
    role?: string;
    optionsMeta?: any;
    sortOrder: number;
  }>;
  categoryIds?: string[];
  realEstateData?: RealEstateDataInput;
  serviceData?: ServiceDataInput;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  tagline?: string | null;
  description?: string;
  basePrice?: number;
  compareAtPrice?: number;
  priceCurrency?: string;
  images?: string[];
  videos?: string[];
  stock?: number;
  sku?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  sortOrder?: number;
  attributes?: Array<{
    name: string;
    options: string[];
    type: string;
    role?: string;
    optionsMeta?: any;
    sortOrder: number;
  }>;
  categoryIds?: string[];
  realEstateData?: RealEstateDataInput;
  serviceData?: ServiceDataInput;
  instagramImportId?: string;
}

export interface RealEstateDataInput {
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  listingType?: RealEstateListingType | null;
}

export interface ServiceDataInput {
  duration?: number | null;
  modality?: ServiceModality | null;
  coverage?: string | null;
}
