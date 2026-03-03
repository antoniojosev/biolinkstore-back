import { ApiProperty } from '@nestjs/swagger';

export class StoreCountsResponseDto {
  @ApiProperty()
  productCount: number;

  @ApiProperty()
  categoryCount: number;

  @ApiProperty({ description: '-1 means unlimited' })
  maxProducts: number;

  @ApiProperty({ description: '-1 means unlimited' })
  maxCategories: number;

  @ApiProperty({ enum: ['FREE', 'PRO', 'BUSINESS'] })
  plan: string;
}
