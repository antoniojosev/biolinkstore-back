import { Product } from '../entities/product.entity';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(storeId: string, slug: string): Promise<Product | null>;
  findByStoreId(storeId: string, params?: ProductFilterParams): Promise<PaginatedResult<Product>>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
  checkSlugExists(storeId: string, slug: string): Promise<boolean>;
}

export interface ProductFilterParams extends PaginationParams {
  categoryId?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  search?: string;
}

export interface CreateProductData {
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  compareAtPrice?: number;
  prices?: any;
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
    optionsMeta?: any;
    sortOrder: number;
  }>;
  categoryIds?: string[];
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  basePrice?: number;
  compareAtPrice?: number;
  prices?: any;
  images?: string[];
  videos?: string[];
  stock?: number;
  sku?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  sortOrder?: number;
  categoryIds?: string[];
}
