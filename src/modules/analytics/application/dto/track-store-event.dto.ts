import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreEventType } from '@prisma/client';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class TrackStoreEventDto {
  @ApiProperty({ enum: StoreEventType, example: StoreEventType.PRODUCT_VIEW })
  @IsEnum(StoreEventType, { message: 'type must be a valid StoreEventType' })
  type: StoreEventType;

  @ApiPropertyOptional({
    description:
      'Optional reference id (productId, categoryId, socialId, sectionKey, etc.).',
    example: 'clu1xy3yz0001abcd',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Free-form metadata (kept under 4 KB).',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  // class-validator does not enforce JSON size, the use-case caps payload manually.
  @ValidateIf((_, value) => value !== null)
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Stable session id from the storefront client (anonymous).',
    example: 'session-abc-123',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;
}

export class TrackStoreEventResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiPropertyOptional({
    description:
      'When true the event was filtered out by plan gating (FREE) but the request was accepted.',
    example: false,
  })
  ignored?: boolean;
}
