import { IsString, IsOptional, IsBoolean, IsNumber, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Ropa' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Categoría de ropa y accesorios', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({
    example: 'cat-parent-id',
    required: false,
    nullable: true,
    description: 'Id de la categoria padre (misma tienda). Null para categoria raiz.',
  })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}
