import { ApiProperty } from '@nestjs/swagger';
import { Plan, SubscriptionStatus } from '@prisma/client';

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

  @ApiProperty()
  address: string | null;

  @ApiProperty()
  businessHours: any;

  @ApiProperty()
  checkoutConfig: any;

  @ApiProperty()
  currencyConfig: any;

  @ApiProperty()
  stockEnabled: boolean;

  @ApiProperty()
  showBranding: boolean;

  @ApiProperty()
  customDomain: string | null;

  @ApiProperty()
  domainVerified: boolean;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ type: SubscriptionDto, required: false })
  subscription?: SubscriptionDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
