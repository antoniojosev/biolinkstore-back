export class LandingVisitor {
  id: string;
  fingerprint: string;
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  metadata: any;
  userId: string | null;
  visitCount: number;
  firstVisit: Date;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
}
