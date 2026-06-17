import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export enum PaymentMethodTypeDto {
  PAGO_MOVIL = 'PAGO_MOVIL',
  ZELLE = 'ZELLE',
  BINANCE = 'BINANCE',
  TRANSFER = 'TRANSFER',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

export class CreatePaymentMethodDto {
  @ApiProperty({ enum: PaymentMethodTypeDto })
  @IsEnum(PaymentMethodTypeDto)
  type: PaymentMethodTypeDto;

  @ApiProperty({ example: 'PagoMovil Banesco', maxLength: 80 })
  @IsString()
  @Length(1, 80)
  label: string;

  @ApiProperty({
    description:
      'Datos especificos del metodo. Shape por tipo: ' +
      'PAGO_MOVIL { phone, idNumber, bank }, ' +
      'ZELLE { email, holderName }, ' +
      'BINANCE { binanceId, email? }, ' +
      'TRANSFER { bank, accountNumber, accountType, idNumber, holderName }, ' +
      'CASH { currency }, ' +
      'OTHER { data }',
    example: { phone: '04241234567', idNumber: 'V12345678', bank: '0134' },
  })
  @IsObject()
  details: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ enum: PaymentMethodTypeDto })
  @IsOptional()
  @IsEnum(PaymentMethodTypeDto)
  type?: PaymentMethodTypeDto;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class PaymentMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PaymentMethodTypeDto })
  type: PaymentMethodTypeDto;

  @ApiProperty()
  label: string;

  @ApiProperty()
  details: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true })
  instructions: string | null;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
