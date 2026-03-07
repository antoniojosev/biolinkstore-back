import { IsString, IsArray, IsOptional, IsBoolean, IsHexColor, IsJSON, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  stockEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showBranding?: boolean;
}
