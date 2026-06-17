import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';

export enum CustomRateModeDto {
  MANUAL = 'MANUAL',
  FORMULA = 'FORMULA',
  API = 'API',
}

export class CreateCustomRateDto {
  @ApiProperty({ example: 'Paralelo' })
  @IsString()
  @Length(1, 60)
  label: string;

  @ApiProperty({ example: 'USD', description: 'Moneda base equivalente (USD, EUR, VES)' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'baseCurrency debe ser ISO 4217 (3 letras mayusculas)' })
  baseCurrency: string;

  @ApiProperty({ enum: CustomRateModeDto })
  @IsEnum(CustomRateModeDto)
  mode: CustomRateModeDto;

  @ApiPropertyOptional({ example: 50.25, description: 'Valor en VES (requerido para MANUAL)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valueVes?: number;

  @ApiPropertyOptional({
    example: 'USD_BCV + 0.5',
    description: 'Formula (requerido para FORMULA). Solo +-*/ y codes de tasas oficiales.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formula?: string;

  @ApiPropertyOptional({ description: 'URL fuente JSON (requerido para API)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUrl?: string;

  @ApiPropertyOptional({
    description: 'Path dentro del JSON (requerido para API). Ej: "monitors.usd.price"',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourcePath?: string;
}

export class UpdateCustomRateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 60)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  baseCurrency?: string;

  @ApiPropertyOptional({ enum: CustomRateModeDto })
  @IsOptional()
  @IsEnum(CustomRateModeDto)
  mode?: CustomRateModeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  valueVes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formula?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourcePath?: string;
}

export class CustomRateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  baseCurrency: string;

  @ApiProperty({ enum: CustomRateModeDto })
  mode: CustomRateModeDto;

  @ApiPropertyOptional({ nullable: true })
  valueVes: number | null;

  @ApiPropertyOptional({ nullable: true })
  formula: string | null;

  @ApiPropertyOptional({ nullable: true })
  sourceUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  sourcePath: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Valor actual resuelto (calculado o fetcheado). Null si no se pudo resolver.',
  })
  resolvedValue: number | null;

  @ApiPropertyOptional({ nullable: true })
  resolvedAt: Date | null;
}
