import { IsInt, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const REAL_ESTATE_LISTING_TYPES = ['SALE', 'RENT'] as const;
export type RealEstateListingTypeDto = (typeof REAL_ESTATE_LISTING_TYPES)[number];

export class CreateProductRealEstateDataDto {
  @ApiProperty({ example: 3, required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({ example: 2, required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({ example: 120.5, required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @ApiProperty({
    example: 'SALE',
    required: false,
    enum: REAL_ESTATE_LISTING_TYPES,
  })
  @IsOptional()
  @IsIn(REAL_ESTATE_LISTING_TYPES as unknown as string[])
  listingType?: RealEstateListingTypeDto;
}
