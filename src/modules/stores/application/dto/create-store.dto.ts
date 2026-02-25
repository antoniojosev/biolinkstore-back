import { IsString, IsArray, IsOptional, MinLength, MaxLength, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'My Amazing Store' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Tienda de ropa y accesorios', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: ['+1234567890'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  whatsappNumbers: string[];

  @ApiProperty({ example: '@mystore', required: false })
  @IsOptional()
  @IsString()
  instagramHandle?: string;
}
