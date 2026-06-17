import { ExchangeRateMode, Plan, StoreCtaType, SubscriptionStatus } from '@prisma/client';

export interface StoreSocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  whatsapp?: string;
  twitter?: string;
}

export interface StoreCta {
  type: StoreCtaType;
  label: string | null;
  url: string | null;
}

export class Store {
  id: string;
  slug: string;
  username: string | null;
  name: string;
  description: string | null;

  logo: string | null;
  favicon: string | null;
  banner: string | null;

  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  font: string;
  template: string;

  whatsappNumbers: string[];
  instagramHandle: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  socialLinks: StoreSocialLinks | null;
  businessHours: any;

  checkoutConfig: any;
  currencyConfig: any;
  whatsappTemplate: string | null;
  stockEnabled: boolean;
  showBranding: boolean;

  customDomain: string | null;
  domainVerified: boolean;

  ctaType: StoreCtaType;
  ctaLabel: string | null;
  ctaUrl: string | null;

  ownerId: string;

  subscription?: {
    plan: Plan;
    status: SubscriptionStatus;
  };

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Store>) {
    Object.assign(this, partial);
  }
}
