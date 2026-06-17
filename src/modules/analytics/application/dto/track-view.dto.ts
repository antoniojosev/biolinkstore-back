import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackViewDto {
  @ApiProperty({ example: 'session-abc-123' })
  @IsString()
  @MaxLength(128)
  sessionId: string;

  @ApiProperty({ required: false, example: 'https://instagram.com' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;

  @ApiProperty({ required: false, example: 'VE' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  country?: string;

  @ApiProperty({ required: false, example: 'mobile' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  device?: string;

  @ApiProperty({ required: false, example: 75, description: 'Percentage 0-100' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scrollDepth?: number;

  @ApiProperty({ required: false, example: 42, description: 'Seconds on page' })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeOnPage?: number;
}

export class StoreAnalyticsResponseDto {
  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  uniqueSessions: number;

  @ApiProperty({
    nullable: true,
    description: 'Plan-gated: null for FREE plans',
  })
  avgScrollDepth: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Plan-gated: null for FREE plans',
  })
  avgTimeOnPage: number | null;
}
