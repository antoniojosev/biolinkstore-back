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

  @ApiProperty()
  address: string | null;

  @ApiProperty()
  businessHours: any;

  @ApiProperty()
  showBranding: boolean;

  @ApiProperty({ required: false })
  currencyConfig: any;

  @ApiProperty({
    description: 'Tasa resuelta para conversiones (AUTO=BCV en tiempo real, MANUAL=tasa fija). Null si no hay tasa.',
    required: false,
    nullable: true,
  })
  exchangeRate: number | null;

  @ApiProperty({ required: false, nullable: true })
  exchangeRateSource: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'USD_BCV' })
  exchangeRateCode: string | null;
}
