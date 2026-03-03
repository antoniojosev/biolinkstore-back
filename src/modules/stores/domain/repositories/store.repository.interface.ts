import { Store } from '../entities/store.entity';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';

export interface IStoreRepository {
  findById(id: string): Promise<Store | null>;
  findByIdWithSubscription(id: string): Promise<Store | null>;
  findBySlug(slug: string): Promise<Store | null>;
  findByOwnerId(ownerId: string, params?: PaginationParams): Promise<PaginatedResult<Store>>;
  create(data: CreateStoreData): Promise<Store>;
  update(id: string, data: UpdateStoreData): Promise<Store>;
  delete(id: string): Promise<void>;
  checkSlugExists(slug: string): Promise<boolean>;
}

export interface CreateStoreData {
  slug: string;
  name: string;
  description?: string;
  primaryColor?: string;
  whatsappNumbers: string[];
  instagramHandle?: string;
  ownerId: string;
}

export interface UpdateStoreData {
  slug?: string;
  name?: string;
  description?: string;
  logo?: string;
  favicon?: string;
  banner?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  template?: string;
  whatsappNumbers?: string[];
  instagramHandle?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  email?: string;
  address?: string;
  businessHours?: any;
  checkoutConfig?: any;
  currencyConfig?: any;
  stockEnabled?: boolean;
  showBranding?: boolean;
}
