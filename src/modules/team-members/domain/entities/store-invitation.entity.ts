import { StoreMemberRole } from '@prisma/client';

export class StoreInvitation {
  id: string;
  storeId: string;
  email: string;
  role: StoreMemberRole;
  token: string;
  invitedBy: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  store?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  inviter?: {
    id: string;
    name: string | null;
    email: string;
  };

  constructor(partial: Partial<StoreInvitation>) {
    Object.assign(this, partial);
  }

  isPending(): boolean {
    return this.acceptedAt === null && this.declinedAt === null && this.expiresAt > new Date();
  }
}
