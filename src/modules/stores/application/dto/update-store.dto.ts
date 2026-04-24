import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsHexColor,
  IsEmail,
  IsNumber,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SocialLinksDto } from './social-links.dto';

export class UpdateStoreDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  favicon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  font?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  whatsappNumbers?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '+584141234567', description: 'Phone in E.164 format' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be in E.164 format (e.g. +584141234567)' })
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, type: SocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  stockEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showBranding?: boolean;

  // BE-123: structured about + location
  @ApiProperty({ required: false, nullable: true, maxLength: 120 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(120)
  aboutShort?: string | null;

  @ApiProperty({ required: false, nullable: true, maxLength: 2000 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  aboutLong?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 10.213, minimum: -90, maximum: 90 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 7 }, { message: 'locationLat must be a number with ≤7 decimals' })
  @Min(-90)
  @Max(90)
  locationLat?: number | null;

  @ApiProperty({ required: false, nullable: true, example: -64.682, minimum: -180, maximum: 180 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 7 }, { message: 'locationLng must be a number with ≤7 decimals' })
  @Min(-180)
  @Max(180)
  locationLng?: number | null;

  @ApiProperty({ required: false, nullable: true, maxLength: 120 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(120)
  locationLabel?: string | null;
}
