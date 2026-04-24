import { StoreView } from '../entities/store-view.entity';

export interface CreateStoreViewData {
  storeId: string;
  sessionId: string;
  referrer?: string | null;
  country?: string | null;
  device?: string | null;
  scrollDepth?: number | null;
  timeOnPage?: number | null;
}

export interface StoreViewAggregates {
  totalViews: number;
  uniqueSessions: number;
  avgScrollDepth: number | null;
  avgTimeOnPage: number | null;
}

export interface IStoreViewRepository {
  create(data: CreateStoreViewData): Promise<StoreView>;
  aggregate(storeId: string, from?: Date, to?: Date): Promise<StoreViewAggregates>;
}
