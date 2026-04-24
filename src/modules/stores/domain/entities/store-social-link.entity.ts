import { SocialPlatform } from '@prisma/client';

export class StoreSocialLink {
  id: string;
  storeId: string;
  platform: SocialPlatform;
  url: string;
  label: string | null;
  sortOrder: number;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StoreSocialLink>) {
    Object.assign(this, partial);
  }
}
