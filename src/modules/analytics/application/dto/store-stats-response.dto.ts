import { ApiProperty } from '@nestjs/swagger';

export class ViewsByCategoryDto {
  @ApiProperty()
  categoryName: string;

  @ApiProperty()
  views: number;
}

export class VisitsByDayDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  count: number;
}

export class ViewsByProductDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  views: number;
}

export class StoreStatsResponseDto {
  @ApiProperty()
  totalQuotes: number;

  @ApiProperty()
  uniqueVisitors: number;

  @ApiProperty()
  productViews: number;

  @ApiProperty()
  newQuotesCount: number;

  @ApiProperty({ type: [ViewsByCategoryDto] })
  viewsByCategory: ViewsByCategoryDto[];

  @ApiProperty({ type: [VisitsByDayDto] })
  visitsByDay: VisitsByDayDto[];

  @ApiProperty({ type: [ViewsByProductDto] })
  viewsByProduct: ViewsByProductDto[];
}
