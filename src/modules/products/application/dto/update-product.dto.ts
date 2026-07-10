import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductAttributeDto } from './create-product.dto';
import { UpdateProductRealEstateDataDto } from './update-product-real-estate-data.dto';
import { UpdateProductServiceDataDto } from './update-product-service-data.dto';

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, maxLength: 80, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  tagline?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({
    required: false,
    enum: ['USD', 'EUR', 'VES'],
    description: 'Moneda en la que el vendedor define el basePrice.',
  })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'EUR', 'VES'])
  priceCurrency?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({
    type: [ProductAttributeDto],
    required: false,
    description: 'Reemplaza todos los atributos existentes (mismo patron que categoryIds).',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiProperty({ type: UpdateProductRealEstateDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProductRealEstateDataDto)
  realEstateData?: UpdateProductRealEstateDataDto;

  @ApiProperty({ type: UpdateProductServiceDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProductServiceDataDto)
  serviceData?: UpdateProductServiceDataDto;
}
