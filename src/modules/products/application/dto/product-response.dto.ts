import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductAttributeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  options: string[];

  @ApiProperty()
  type: string;

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

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  compareAtPrice: number | null;

  @ApiProperty()
  prices: any;

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
