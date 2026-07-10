import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsHexColor,
  IsEmail,
  IsEnum,
  IsNumber,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StoreCtaType } from '@prisma/client';
import { SocialLinksDto } from './social-links.dto';

const TEL_OR_E164_REGEX = /^(?:tel:)?\+?[1-9]\d{7,14}$/;
const HTTP_URL_REGEX = /^https?:\/\/[^\s]+$/i;

@ValidatorConstraint({ name: 'CtaUrlConsistency', async: false })
export class CtaUrlConsistencyValidator implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { ctaType?: StoreCtaType; ctaUrl?: string | null };
    if (obj.ctaType === undefined) return true; // not setting cta this update
    if (obj.ctaType === StoreCtaType.EXTERNAL_LINK) {
      if (typeof value !== 'string' || !HTTP_URL_REGEX.test(value)) return false;
      return true;
    }
    if (obj.ctaType === StoreCtaType.CALL) {
      if (value === null || value === undefined) return false;
      if (typeof value !== 'string' || !TEL_OR_E164_REGEX.test(value)) return false;
      return true;
    }
    // WHATSAPP / NONE → ctaUrl is ignored, accept any value (including null/undefined)
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = args.object as { ctaType?: StoreCtaType };
    if (obj.ctaType === StoreCtaType.EXTERNAL_LINK) {
      return 'ctaUrl is required and must be http(s)://... when ctaType=EXTERNAL_LINK';
    }
    if (obj.ctaType === StoreCtaType.CALL) {
      return 'ctaUrl must be tel:+E.164 or +E.164 when ctaType=CALL';
    }
    return 'ctaUrl invalid';
  }
}

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

  @ApiProperty({
    required: false,
    description: 'true = marca que el owner pidio importar su catalogo desde Instagram (guarda la fecha); false = limpia el pedido.',
  })
  @IsOptional()
  @IsBoolean()
  requestInstagramImport?: boolean;

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

  // BE-121: configurable CTA
  @ApiProperty({
    required: false,
    enum: StoreCtaType,
    description: 'Primary CTA type. WHATSAPP = use whatsappNumbers; EXTERNAL_LINK = ctaUrl required; CALL = ctaUrl must be tel:/E.164; NONE = hide CTA.',
  })
  @IsOptional()
  @IsEnum(StoreCtaType)
  ctaType?: StoreCtaType;

  @ApiProperty({ required: false, nullable: true, maxLength: 60 })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(60)
  ctaLabel?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Required when ctaType=EXTERNAL_LINK (http(s)://...). For ctaType=CALL must be tel:+E.164 or plain E.164.',
  })
  @IsOptional()
  @Validate(CtaUrlConsistencyValidator)
  ctaUrl?: string | null;

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
