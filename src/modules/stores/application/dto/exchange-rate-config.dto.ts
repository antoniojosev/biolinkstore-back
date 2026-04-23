import { ApiProperty } from '@nestjs/swagger';
import { ExchangeRateMode } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateExchangeRateConfigDto {
  @ApiProperty({ enum: ExchangeRateMode })
  @IsEnum(ExchangeRateMode)
  mode: ExchangeRateMode;

  @ApiProperty({ example: 'USD_BCV' })
  @IsString()
  code: string;

  @ApiProperty({ required: false, nullable: true, example: 40.5 })
  @ValidateIf((o) => o.mode === 'MANUAL')
  @IsNumber()
  @Min(0.00000001)
  @IsOptional()
  customRate?: number | null;
}

export class ExchangeRateConfigResponseDto {
  @ApiProperty({ enum: ExchangeRateMode })
  mode: ExchangeRateMode;

  @ApiProperty({ example: 'USD_BCV' })
  code: string;

  @ApiProperty({ required: false, nullable: true, example: 40.5 })
  customRate: number | null;

  @ApiProperty({
    description: 'Tasa resuelta actual (BCV si AUTO, customRate si MANUAL). Null si no se pudo resolver.',
    required: false,
    nullable: true,
  })
  resolvedRate: number | null;

  @ApiProperty({ required: false, nullable: true })
  resolvedSource: string | null;

  @ApiProperty({
    description: 'FREE usa solo AUTO. PRO/BUSINESS pueden fijar manual.',
  })
  canUseManual: boolean;
}
