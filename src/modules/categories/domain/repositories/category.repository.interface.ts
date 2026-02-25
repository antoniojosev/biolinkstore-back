import { Category } from '../entities/category.entity';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(storeId: string, slug: string): Promise<Category | null>;
  findByStoreId(storeId: string, params?: PaginationParams): Promise<PaginatedResult<Category>>;
  create(data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
  checkSlugExists(storeId: string, slug: string): Promise<boolean>;
}

export interface CreateCategoryData {
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  isVisible?: boolean;
  sortOrder?: number;
}
