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

  @ApiProperty()
  role: string;

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

export class PublicProductRealEstateDataDto {
  @ApiProperty({ nullable: true })
  bedrooms: number | null;

  @ApiProperty({ nullable: true })
  bathrooms: number | null;

  @ApiProperty({ nullable: true })
  area: number | null;

  @ApiProperty({ nullable: true, enum: ['SALE', 'RENT'] })
  listingType: 'SALE' | 'RENT' | null;
}

export class PublicProductServiceDataDto {
  @ApiProperty({ nullable: true })
  duration: number | null;

  @ApiProperty({ nullable: true, enum: ['IN_PERSON', 'ONLINE', 'HYBRID'] })
  modality: 'IN_PERSON' | 'ONLINE' | 'HYBRID' | null;

  @ApiProperty({ nullable: true })
  coverage: string | null;
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
  isFeatured: boolean;

  @ApiProperty()
  isOnSale: boolean;

  @ApiProperty({ type: [PublicProductAttributeDto], required: false })
  attributes?: PublicProductAttributeDto[];

  @ApiProperty({ type: [PublicProductVariantDto], required: false })
  variants?: PublicProductVariantDto[];

  @ApiProperty({ type: [PublicCategoryDto], required: false })
  categories?: PublicCategoryDto[];

  @ApiProperty({ type: PublicProductRealEstateDataDto, required: false, nullable: true })
  realEstateData?: PublicProductRealEstateDataDto | null;

  @ApiProperty({ type: PublicProductServiceDataDto, required: false, nullable: true })
  serviceData?: PublicProductServiceDataDto | null;
}
