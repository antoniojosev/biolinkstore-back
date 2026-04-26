import { StoreMemberRole } from '@prisma/client';
import { StoreInvitation } from '../entities/store-invitation.entity';

export interface IStoreInvitationRepository {
  findByToken(token: string): Promise<StoreInvitation | null>;
  findById(id: string): Promise<StoreInvitation | null>;
  findPendingByEmail(email: string): Promise<StoreInvitation[]>;
  findPendingByStoreAndEmail(storeId: string, email: string): Promise<StoreInvitation | null>;
  create(data: CreateStoreInvitationData): Promise<StoreInvitation>;
  markAccepted(id: string): Promise<StoreInvitation>;
  markDeclined(id: string): Promise<StoreInvitation>;
  delete(id: string): Promise<void>;
}

export interface CreateStoreInvitationData {
  storeId: string;
  email: string;
  role: StoreMemberRole;
  token: string;
  invitedBy: string;
  expiresAt: Date;
}
