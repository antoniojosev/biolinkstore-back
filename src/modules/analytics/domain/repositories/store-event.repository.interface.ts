import { StoreEventType } from '@prisma/client';
import { StoreEvent } from '../entities/store-event.entity';

export interface CreateStoreEventData {
  storeId: string;
  type: StoreEventType;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  sessionId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
}

export interface ListStoreEventsParams {
  storeId: string;
  from?: Date;
  to?: Date;
  type?: StoreEventType;
  /** Pagination cursor — opaque, encodes the last seen (timestamp,id). */
  cursor?: string;
  /** Max page size, clamped by the use-case. */
  limit?: number;
}

export interface ListStoreEventsResult {
  data: StoreEvent[];
  nextCursor: string | null;
}

export interface IStoreEventRepository {
  create(data: CreateStoreEventData): Promise<StoreEvent>;
  list(params: ListStoreEventsParams): Promise<ListStoreEventsResult>;
}
