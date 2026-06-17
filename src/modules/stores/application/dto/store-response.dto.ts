import { ApiProperty } from '@nestjs/swagger';
import { ExchangeRateMode, Plan, StoreCtaType, SubscriptionStatus } from '@prisma/client';

export class StoreCtaDto {
  @ApiProperty({ enum: StoreCtaType, example: 'WHATSAPP' })
  type: StoreCtaType;

  @ApiProperty({ required: false, nullable: true })
  label: string | null;

  @ApiProperty({ required: false, nullable: true })
  url: string | null;
}

export class SubscriptionDto {
  @ApiProperty({ enum: Plan })
  plan: Plan;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;
}

export class StoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false, nullable: true })
  username: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  logo: string | null;

  @ApiProperty()
  favicon: string | null;

  @ApiProperty()
  banner: string | null;

  @ApiProperty()
  primaryColor: string;

  @ApiProperty()
  secondaryColor: string;

  @ApiProperty()
  backgroundColor: string;

  @ApiProperty()
  textColor: string;

  @ApiProperty()
  font: string;

  @ApiProperty()
  template: string;

  @ApiProperty({ type: [String] })
  whatsappNumbers: string[];

  @ApiProperty()
  instagramHandle: string | null;

  @ApiProperty()
  facebookUrl: string | null;

  @ApiProperty()
  tiktokUrl: string | null;

  @ApiProperty()
  email: string | null;

  @ApiProperty({ required: false, nullable: true })
  phone: string | null;

  @ApiProperty()
  address: string | null;

  @ApiProperty({ required: false, nullable: true })
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    whatsapp?: string;
    twitter?: string;
  } | null;

  @ApiProperty()
  businessHours: any;

  @ApiProperty()
  checkoutConfig: any;

  @ApiProperty()
  currencyConfig: any;

  @ApiProperty({ required: false, nullable: true })
  whatsappTemplate: string | null;

  @ApiProperty()
  stockEnabled: boolean;

  @ApiProperty()
  showBranding: boolean;

  @ApiProperty()
  customDomain: string | null;

  @ApiProperty()
  domainVerified: boolean;

  @ApiProperty({ type: StoreCtaDto, description: 'Configurable primary CTA (BE-121)' })
  cta: StoreCtaDto;

  @ApiProperty({ required: false, nullable: true, maxLength: 120, description: 'BE-123: short about (≤120)' })
  aboutShort: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'BE-123: long about (≤2000)' })
  aboutLong: string | null;

  @ApiProperty({ required: false, nullable: true, example: 10.213 })
  locationLat: number | null;

  @ApiProperty({ required: false, nullable: true, example: -64.682 })
  locationLng: number | null;

  @ApiProperty({ required: false, nullable: true, maxLength: 120 })
  locationLabel: string | null;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ type: SubscriptionDto, required: false })
  subscription?: SubscriptionDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
