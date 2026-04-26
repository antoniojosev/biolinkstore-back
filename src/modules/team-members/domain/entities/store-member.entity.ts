import { StoreMemberRole } from '@prisma/client';

export class StoreMember {
  id: string;
  storeId: string;
  userId: string;
  role: StoreMemberRole;
  invitedBy: string | null;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };

  constructor(partial: Partial<StoreMember>) {
    Object.assign(this, partial);
  }
}
