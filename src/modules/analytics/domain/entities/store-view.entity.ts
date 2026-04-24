export class StoreView {
  id: string;
  storeId: string;
  sessionId: string;
  referrer: string | null;
  country: string | null;
  device: string | null;
  scrollDepth: number | null;
  timeOnPage: number | null;
  createdAt: Date;

  constructor(partial: Partial<StoreView>) {
    Object.assign(this, partial);
  }
}
