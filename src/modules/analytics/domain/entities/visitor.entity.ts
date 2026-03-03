export class VisitorEntity {
  id: string;
  storeId: string;
  visitorId: string;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  visitCount: number;
  firstVisit: Date;
  lastVisit: Date;

  constructor(partial: Partial<VisitorEntity>) {
    Object.assign(this, partial);
  }
}
