import { SocialPlatform } from '@prisma/client';
import { StoreSocialLink } from '../entities/store-social-link.entity';

export interface CreateStoreSocialLinkData {
  storeId: string;
  platform: SocialPlatform;
  url: string;
  label?: string | null;
  sortOrder?: number;
  visible?: boolean;
}

export interface UpdateStoreSocialLinkData {
  platform?: SocialPlatform;
  url?: string;
  label?: string | null;
  sortOrder?: number;
  visible?: boolean;
}

export interface IStoreSocialLinkRepository {
  findById(id: string): Promise<StoreSocialLink | null>;
  findByStoreId(storeId: string): Promise<StoreSocialLink[]>;
  countByStoreId(storeId: string): Promise<number>;
  create(data: CreateStoreSocialLinkData): Promise<StoreSocialLink>;
  createMany(rows: CreateStoreSocialLinkData[]): Promise<void>;
  update(id: string, data: UpdateStoreSocialLinkData): Promise<StoreSocialLink>;
  delete(id: string): Promise<void>;
  /** Atomic batch reorder: takes [{id, sortOrder}] and sets each row in a tx. */
  reorder(storeId: string, items: Array<{ id: string; sortOrder: number }>): Promise<void>;
}
