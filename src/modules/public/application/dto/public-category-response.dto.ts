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

  @ApiProperty({ required: false, nullable: true })
  parentId: string | null;

  @ApiProperty()
  productCount: number;

  @ApiProperty({
    required: false,
    type: () => [PublicCategoryResponseDto],
    description: 'Child categories (only populated when ?tree=true)',
  })
  children?: PublicCategoryResponseDto[];
}
