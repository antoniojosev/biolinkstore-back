import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsIn,
  MaxLength,
  ValidateNested,
  Validate,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductAttributeOptionsMetaConstraint } from './validators/attribute-options-meta.validator';
import { CreateProductRealEstateDataDto } from './create-product-real-estate-data.dto';
import { CreateProductServiceDataDto } from './create-product-service-data.dto';

export const ATTRIBUTE_TYPES = ['text', 'color', 'size', 'multi-select', 'number'] as const;
export const ATTRIBUTE_ROLES = [
  'variant',
  'ingredient-included',
  'ingredient-extra',
  'spec',
  'dietary',
  'availability',
] as const;

export class ProductAttributeDto {
  @ApiProperty({ example: 'Talla' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['S', 'M', 'L', 'XL'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  options: string[];

  @ApiProperty({ example: 'text', enum: ATTRIBUTE_TYPES, required: false })
  @IsOptional()
  @IsIn(ATTRIBUTE_TYPES as unknown as string[])
  type?: string;

  @ApiProperty({ example: 'variant', enum: ATTRIBUTE_ROLES, required: false })
  @IsOptional()
  @IsIn(ATTRIBUTE_ROLES as unknown as string[])
  role?: string;

  @ApiProperty({
    description:
      'Variant: { [option]: { hex, images } }. Multi-select/ingredients: { [option]: { priceDelta: number, default?: boolean } }',
    required: false,
  })
  @IsOptional()
  @IsObject()
  @Validate(ProductAttributeOptionsMetaConstraint)
  optionsMeta?: Record<string, any>;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Camiseta Básica' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Doble carne · cheddar', required: false, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  tagline?: string;

  @ApiProperty({ example: 'Camiseta de algodón 100%', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 19.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 29.99, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ example: ['https://example.com/image1.jpg'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: ['https://example.com/video1.mp4'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 'SHIRT-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @ApiProperty({ type: [ProductAttributeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiProperty({ example: ['cat-id-1', 'cat-id-2'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({ type: CreateProductRealEstateDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductRealEstateDataDto)
  realEstateData?: CreateProductRealEstateDataDto;

  @ApiProperty({ type: CreateProductServiceDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductServiceDataDto)
  serviceData?: CreateProductServiceDataDto;
}
