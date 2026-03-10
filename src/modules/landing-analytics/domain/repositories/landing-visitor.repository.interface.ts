import { LandingVisitor } from '../entities/landing-visitor.entity';

export interface UpsertLandingVisitorData {
  fingerprint: string;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ILandingVisitorRepository {
  upsert(data: UpsertLandingVisitorData): Promise<LandingVisitor>;
  linkToUser(fingerprint: string, userId: string): Promise<void>;
}
