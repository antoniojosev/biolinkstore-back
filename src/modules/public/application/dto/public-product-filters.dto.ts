import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const toBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};
import {
  REAL_ESTATE_LISTING_TYPES,
  RealEstateListingTypeDto,
} from '@/modules/products/application/dto/create-product-real-estate-data.dto';
import {
  SERVICE_MODALITIES,
  ServiceModalityDto,
} from '@/modules/products/application/dto/create-product-service-data.dto';

/**
 * Query DTO for the public products endpoint.
 *
 * Mirrors the base `ProductFilterParams` (pagination + search + visibility flags)
 * and adds niche filters (real estate + services) wired into the nested
 * relations `realEstateData` / `serviceData`.
 *
 * Naming: keeps snake_case for `area_min/max` and `duration_min/max` since those
 * are the public API contract; scalar/enum filters follow the existing camelCase
 * convention already used by this module (`categoryId`, `isFeatured`, ...).
 */
export class PublicProductFiltersDto {
  // --- Pagination / sorting ---
  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  // --- Generic product filters ---
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isOnSale?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  search?: string;

  // --- Real estate niche ---
  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, description: 'Minimum area' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area_min?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, description: 'Maximum area' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area_max?: number;

  @ApiPropertyOptional({ enum: REAL_ESTATE_LISTING_TYPES })
  @IsOptional()
  @IsIn(REAL_ESTATE_LISTING_TYPES as unknown as string[])
  listingType?: RealEstateListingTypeDto;

  // --- Services niche ---
  @ApiPropertyOptional({ enum: SERVICE_MODALITIES })
  @IsOptional()
  @IsIn(SERVICE_MODALITIES as unknown as string[])
  modality?: ServiceModalityDto;

  @ApiPropertyOptional({ type: Number, minimum: 0, description: 'Minimum duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration_min?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, description: 'Maximum duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration_max?: number;
}
