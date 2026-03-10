import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackLandingVisitDto {
  @ApiProperty({ example: 'abc-123-uuid' })
  @IsString()
  fingerprint: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
