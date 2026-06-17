import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SocialPlatform } from '@prisma/client';

export class StoreSocialLinkResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: SocialPlatform })
  platform: SocialPlatform;

  @ApiProperty()
  url: string;

  @ApiProperty({ required: false, nullable: true })
  label: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  visible: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateStoreSocialLinkDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @ApiProperty({ description: 'Public URL for the platform profile.' })
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true })
  url!: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 60 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(60)
  label?: string | null;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateStoreSocialLinkDto {
  @ApiProperty({ required: false, enum: SocialPlatform })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true })
  url?: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 60 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(60)
  label?: string | null;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class ReorderItemDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderStoreSocialLinksDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
