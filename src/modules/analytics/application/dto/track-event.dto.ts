import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '@prisma/client';

export class TrackEventDto {
  @ApiProperty({ enum: EventType, example: 'PAGE_VIEW' })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({ example: 'abc-123-visitor-id' })
  @IsString()
  visitorId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
