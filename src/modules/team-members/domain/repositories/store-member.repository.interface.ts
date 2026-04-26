import { StoreMemberRole } from '@prisma/client';
import { StoreMember } from '../entities/store-member.entity';

export interface IStoreMemberRepository {
  findByStoreId(storeId: string): Promise<StoreMember[]>;
  findByStoreAndUser(storeId: string, userId: string): Promise<StoreMember | null>;
  findById(id: string): Promise<StoreMember | null>;
  countByStoreId(storeId: string): Promise<number>;
  countOwnersByStoreId(storeId: string): Promise<number>;
  create(data: CreateStoreMemberData): Promise<StoreMember>;
  updateRole(id: string, role: StoreMemberRole): Promise<StoreMember>;
  delete(id: string): Promise<void>;
}

export interface CreateStoreMemberData {
  storeId: string;
  userId: string;
  role: StoreMemberRole;
  invitedBy?: string | null;
}
