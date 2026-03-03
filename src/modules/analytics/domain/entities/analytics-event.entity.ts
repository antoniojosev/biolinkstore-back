import { EventType } from '@prisma/client';

export class AnalyticsEventEntity {
  id: string;
  storeId: string;
  visitorId: string | null;
  productId: string | null;
  type: EventType;
  metadata: any;
  createdAt: Date;

  constructor(partial: Partial<AnalyticsEventEntity>) {
    Object.assign(this, partial);
  }
}
