import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductRealEstateDataResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  bedrooms: number | null;

  @ApiProperty({ nullable: true })
  bathrooms: number | null;

  @ApiProperty({ nullable: true })
  area: number | null;

  @ApiProperty({ nullable: true, enum: ['SALE', 'RENT'] })
  listingType: 'SALE' | 'RENT' | null;
}

export class ProductServiceDataResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  duration: number | null;

  @ApiProperty({ nullable: true, enum: ['IN_PERSON', 'ONLINE', 'HYBRID'] })
  modality: 'IN_PERSON' | 'ONLINE' | 'HYBRID' | null;

  @ApiProperty({ nullable: true })
  coverage: string | null;
}

export class ProductAttributeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  options: string[];

  @ApiProperty()
  type: string;

  @ApiProperty({ example: 'variant' })
  role: string;

  @ApiProperty({ required: false })
  optionsMeta: any;

  @ApiProperty()
  sortOrder: number;
}

export class ProductVariantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  combination: any;

  @ApiProperty()
  sku: string | null;

  @ApiProperty()
  priceAdjustment: number;

  @ApiProperty()
  stock: number | null;

  @ApiProperty()
  image: string | null;

  @ApiProperty()
  isAvailable: boolean;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false, nullable: true })
  tagline: string | null;

  @ApiProperty()
  description: string | null;

  @ApiProperty({ required: false, nullable: true })
  tagline: string | null;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  compareAtPrice: number | null;

  @ApiProperty({ example: 'USD', enum: ['USD', 'EUR', 'VES'] })
  priceCurrency: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ type: [String] })
  videos: string[];

  @ApiProperty()
  stock: number | null;

  @ApiProperty()
  sku: string | null;

  @ApiProperty()
  isVisible: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isOnSale: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: [ProductAttributeResponseDto], required: false })
  attributes?: ProductAttributeResponseDto[];

  @ApiProperty({ type: [ProductVariantResponseDto], required: false })
  variants?: ProductVariantResponseDto[];

  @ApiProperty({ type: [String], required: false })
  categoryIds?: string[];

  @ApiProperty({ type: ProductRealEstateDataResponseDto, required: false, nullable: true })
  realEstateData?: ProductRealEstateDataResponseDto | null;

  @ApiProperty({ type: ProductServiceDataResponseDto, required: false, nullable: true })
  serviceData?: ProductServiceDataResponseDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
