import { ApiProperty } from '@nestjs/swagger';

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
}
