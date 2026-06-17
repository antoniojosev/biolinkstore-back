import { StoreEventType } from '@prisma/client';

export class StoreEvent {
  id: string;
  storeId: string;
  type: StoreEventType;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  sessionId: string | null;
  referrer: string | null;
  userAgent: string | null;
  timestamp: Date;

  constructor(partial: Partial<StoreEvent>) {
    Object.assign(this, partial);
  }
}
