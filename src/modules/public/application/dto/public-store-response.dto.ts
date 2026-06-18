import { ApiProperty } from '@nestjs/swagger';
import { SocialPlatform, StoreCtaType } from '@prisma/client';

export class PublicStoreCtaDto {
  @ApiProperty({ enum: StoreCtaType, example: 'WHATSAPP' })
  type: StoreCtaType;

  @ApiProperty({ required: false, nullable: true })
  label: string | null;

  @ApiProperty({ required: false, nullable: true })
  url: string | null;
}

export class PublicStoreSocialDto {
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
}

export class PublicStoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  logo: string | null;

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
  showBranding: boolean;

  @ApiProperty({
    required: false,
    description: 'Configuracion de moneda. Para tasas resueltas, consultar GET /public/:slug/rates.',
  })
  currencyConfig: any;

  @ApiProperty({
    description: '7-day operating hours (0=Sunday, 6=Saturday)',
    required: false,
    nullable: true,
    example: [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', closed: true },
    ],
  })
  hours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    closed: boolean;
  }> | null;

  @ApiProperty({ description: 'Whether store is currently open (America/Caracas)', example: true })
  isOpenNow: boolean;

  @ApiProperty({
    type: PublicStoreCtaDto,
    description: 'Configurable primary CTA (BE-121). Storefront resolves URL based on type.',
  })
  cta: PublicStoreCtaDto;

  // BE-123: structured info
  @ApiProperty({ required: false, nullable: true, maxLength: 120 })
  aboutShort: string | null;

  @ApiProperty({ required: false, nullable: true })
  aboutLong: string | null;

  @ApiProperty({ required: false, nullable: true, example: 10.213 })
  locationLat: number | null;

  @ApiProperty({ required: false, nullable: true, example: -64.682 })
  locationLng: number | null;

  @ApiProperty({ required: false, nullable: true, maxLength: 120 })
  locationLabel: string | null;

  @ApiProperty({
    type: [PublicStoreSocialDto],
    description: 'BE-124: visible social links sorted by sortOrder. Lazy-migrated from legacy JSON on first read.',
  })
  socials: PublicStoreSocialDto[];

  @ApiProperty({
    enum: ['FREE', 'PRO', 'BUSINESS'],
    default: 'FREE',
    description: 'Plan de la tienda. Util para que el storefront ajuste branding/features client-side.',
  })
  plan: 'FREE' | 'PRO' | 'BUSINESS';
}
