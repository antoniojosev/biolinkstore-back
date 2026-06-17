import { IsInt, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  REAL_ESTATE_LISTING_TYPES,
  RealEstateListingTypeDto,
} from './create-product-real-estate-data.dto';

export class UpdateProductRealEstateDataDto {
  @ApiProperty({ example: 3, required: false, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number | null;

  @ApiProperty({ example: 2, required: false, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number | null;

  @ApiProperty({ example: 120.5, required: false, minimum: 0, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number | null;

  @ApiProperty({
    example: 'SALE',
    required: false,
    enum: REAL_ESTATE_LISTING_TYPES,
    nullable: true,
  })
  @IsOptional()
  @IsIn(REAL_ESTATE_LISTING_TYPES as unknown as string[])
  listingType?: RealEstateListingTypeDto | null;
}
