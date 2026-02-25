import { ApiProperty } from '@nestjs/swagger';

export class PublicCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  image: string | null;

  @ApiProperty()
  productCount: number;
}
