export class Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  prices: any;
  images: string[];
  videos: string[];
  stock: number | null;
  sku: string | null;
  isVisible: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  sortOrder: number;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  categoryIds?: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}

export class ProductAttribute {
  id: string;
  productId: string;
  name: string;
  options: string[];
  sortOrder: number;

  constructor(partial: Partial<ProductAttribute>) {
    Object.assign(this, partial);
  }
}

export class ProductVariant {
  id: string;
  productId: string;
  combination: any;
  sku: string | null;
  priceAdjustment: number;
  stock: number | null;
  image: string | null;
  isAvailable: boolean;

  constructor(partial: Partial<ProductVariant>) {
    Object.assign(this, partial);
  }
}
