import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreEventType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListStoreEventsQueryDto {
  @ApiPropertyOptional({ description: 'ISO date (defaults to now-30d).' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date (defaults to now).' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: StoreEventType })
  @IsOptional()
  @IsEnum(StoreEventType)
  type?: StoreEventType;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ description: 'Opaque cursor returned by previous page.' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  cursor?: string;
}

export class StoreEventItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: StoreEventType })
  type: StoreEventType;

  @ApiProperty({ nullable: true })
  targetId: string | null;

  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ nullable: true })
  sessionId: string | null;

  @ApiProperty({ nullable: true })
  referrer: string | null;

  @ApiProperty({ nullable: true })
  userAgent: string | null;

  @ApiProperty()
  timestamp: string;
}

export class ListStoreEventsResponseDto {
  @ApiProperty({ type: [StoreEventItemDto] })
  data: StoreEventItemDto[];

  @ApiProperty({ nullable: true })
  nextCursor: string | null;
}
