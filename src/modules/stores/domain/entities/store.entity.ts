import { Plan, SubscriptionStatus } from '@prisma/client';

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
  address: string | null;
  businessHours: any;

  checkoutConfig: any;
  currencyConfig: any;
  stockEnabled: boolean;
  showBranding: boolean;

  customDomain: string | null;
  domainVerified: boolean;

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
