import { ApiProperty } from '@nestjs/swagger';

export class PublicProductAttributeDto {
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

export class PublicProductVariantDto {
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

export class PublicCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class PublicProductResponseDto {
  @ApiProperty()
  id: string;

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

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ type: [String] })
  videos: string[];

  @ApiProperty()
  stock: number | null;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isOnSale: boolean;

  @ApiProperty({ type: [PublicProductAttributeDto], required: false })
  attributes?: PublicProductAttributeDto[];

  @ApiProperty({ type: [PublicProductVariantDto], required: false })
  variants?: PublicProductVariantDto[];

  @ApiProperty({ type: [PublicCategoryDto], required: false })
  categories?: PublicCategoryDto[];
}
