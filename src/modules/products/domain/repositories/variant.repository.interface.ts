import { ProductVariant } from '../entities/product.entity';

export interface IVariantRepository {
  findById(id: string): Promise<ProductVariant | null>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  create(data: CreateVariantData): Promise<ProductVariant>;
  update(id: string, data: UpdateVariantData): Promise<ProductVariant>;
  delete(id: string): Promise<void>;
  deleteByProductId(productId: string): Promise<void>;
}

export interface CreateVariantData {
  productId: string;
  combination: any;
  sku?: string;
  priceAdjustment?: number;
  stock?: number;
  image?: string;
  isAvailable?: boolean;
}

export interface UpdateVariantData {
  combination?: any;
  sku?: string;
  priceAdjustment?: number;
  stock?: number;
  image?: string;
  isAvailable?: boolean;
}
