import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
  ArrayMinSize,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'product-id' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'variant-id', required: false })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'Juan Pérez', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ example: 'juan@example.com', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: 'Calle 123, Ciudad', required: false })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ example: 'Entregar entre 2pm y 5pm', required: false })
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiProperty({ enum: ['WHATSAPP', 'INSTAGRAM'] })
  @IsEnum(['WHATSAPP', 'INSTAGRAM'])
  channel: 'WHATSAPP' | 'INSTAGRAM';

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiProperty({ example: 'visitor-uuid', required: false })
  @IsOptional()
  @IsString()
  visitorId?: string;
}
