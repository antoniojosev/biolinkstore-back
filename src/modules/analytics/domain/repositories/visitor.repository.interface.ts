import { VisitorEntity } from '../entities/visitor.entity';

export interface UpsertVisitorData {
  storeId: string;
  visitorId: string;
  userAgent?: string;
  ip?: string;
}

export interface IVisitorRepository {
  upsert(data: UpsertVisitorData): Promise<VisitorEntity>;
  findByStoreAndVisitorId(storeId: string, visitorId: string): Promise<VisitorEntity | null>;
  countByStoreId(storeId: string, since?: Date): Promise<number>;
}
