import { StoreDomainStatus } from '@prisma/client';
import { StoreDomain } from '../entities/store-domain.entity';

export interface CreateStoreDomainData {
  storeId: string;
  domain: string;
  verificationToken: string;
}

export interface UpdateStoreDomainData {
  domain?: string;
  verificationToken?: string;
  status?: StoreDomainStatus;
  verifiedAt?: Date | null;
  lastCheckedAt?: Date | null;
}

export interface IStoreDomainRepository {
  findByStoreId(storeId: string): Promise<StoreDomain | null>;
  findByDomain(domain: string): Promise<StoreDomain | null>;
  findVerifiedByDomain(domain: string): Promise<StoreDomain | null>;
  create(data: CreateStoreDomainData): Promise<StoreDomain>;
  update(id: string, data: UpdateStoreDomainData): Promise<StoreDomain>;
  deleteByStoreId(storeId: string): Promise<void>;
}
