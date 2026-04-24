import { StoreDomainStatus } from '@prisma/client';

export class StoreDomain {
  id: string;
  storeId: string;
  domain: string;
  verificationToken: string;
  status: StoreDomainStatus;
  verifiedAt: Date | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StoreDomain>) {
    Object.assign(this, partial);
  }
}
