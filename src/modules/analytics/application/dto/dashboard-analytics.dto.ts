import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const PERIOD_VALUES = ['7d', '30d', '90d'] as const;
export type PeriodValue = (typeof PERIOD_VALUES)[number];

export class PeriodQueryDto {
  @ApiPropertyOptional({ enum: PERIOD_VALUES, default: '30d' })
  @IsOptional()
  @IsIn(PERIOD_VALUES as unknown as string[])
  period?: PeriodValue;
}

export class TopProductsQueryDto extends PeriodQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------

export class SummaryViewsDto {
  @ApiProperty() total: number;
  @ApiProperty() unique: number;
}

export class SummaryEventsDto {
  @ApiProperty() productViews: number;
  @ApiProperty() addToCarts: number;
  @ApiProperty() whatsappClicks: number;
  @ApiProperty() socialClicks: number;
  @ApiProperty() categoryClicks: number;
}

export class SummaryPrevPeriodDto {
  @ApiProperty({ type: SummaryViewsDto }) views: SummaryViewsDto;
  @ApiProperty({ type: SummaryEventsDto }) events: SummaryEventsDto;
}

export class SummaryTrendDto {
  @ApiProperty({ description: 'Percent change in total views vs previous period.' })
  viewsChangePct: number;

  @ApiProperty({ description: 'Percent change in WhatsApp clicks vs previous period.' })
  whatsappChangePct: number;
}

export class SummaryResponseDto {
  @ApiProperty({ enum: PERIOD_VALUES }) period: PeriodValue;
  @ApiProperty() from: string;
  @ApiProperty() to: string;
  @ApiProperty({ type: SummaryViewsDto }) views: SummaryViewsDto;
  @ApiProperty({ type: SummaryEventsDto }) events: SummaryEventsDto;
  @ApiProperty({ description: 'whatsappClicks / total views, 0 when no views.' })
  conversionRate: number;
  @ApiProperty({ type: SummaryPrevPeriodDto }) prevPeriod: SummaryPrevPeriodDto;
  @ApiProperty({ type: SummaryTrendDto }) trend: SummaryTrendDto;
}

// ---------------------------------------------------------------------------
// top products
// ---------------------------------------------------------------------------

export class TopProductDto {
  @ApiProperty() productId: string;
  @ApiProperty({ nullable: true }) name: string | null;
  @ApiProperty() views: number;
  @ApiProperty() addToCarts: number;
  @ApiProperty() whatsappClicks: number;
  @ApiProperty({ description: 'views*1 + addToCarts*3 + whatsappClicks*5' })
  score: number;
}

export class TopProductsResponseDto {
  @ApiProperty({ enum: PERIOD_VALUES }) period: PeriodValue;
  @ApiProperty({ type: [TopProductDto] }) data: TopProductDto[];
}

// ---------------------------------------------------------------------------
// funnel
// ---------------------------------------------------------------------------

export class FunnelStepDto {
  @ApiProperty() name: string;
  @ApiProperty() count: number;
  @ApiPropertyOptional({
    description: 'Ratio vs previous step (count[i] / count[i-1]). Null on the first step.',
  })
  rateFromPrev?: number | null;
}

export class FunnelResponseDto {
  @ApiProperty({ enum: PERIOD_VALUES }) period: PeriodValue;
  @ApiProperty({ type: [FunnelStepDto] }) steps: FunnelStepDto[];
  @ApiProperty({ description: 'whatsappClicks / storeViews. 0 when no views.' })
  overallConversion: number;
}

// ---------------------------------------------------------------------------
// sources
// ---------------------------------------------------------------------------

export class SourceItemDto {
  @ApiProperty() domain: string;
  @ApiProperty() visits: number;
  @ApiProperty({ description: 'Integer percentage 0-100, sums approx 100.' })
  pct: number;
}

export class SourcesResponseDto {
  @ApiProperty({ enum: PERIOD_VALUES }) period: PeriodValue;
  @ApiProperty({ type: [SourceItemDto] }) sources: SourceItemDto[];
}
