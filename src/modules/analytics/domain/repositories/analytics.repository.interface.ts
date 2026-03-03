import { EventType } from '@prisma/client';
import { AnalyticsEventEntity } from '../entities/analytics-event.entity';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';

export interface CreateEventData {
  storeId: string;
  visitorId?: string;
  productId?: string;
  type: EventType;
  metadata?: Record<string, any>;
}

export interface AnalyticsFilterParams extends PaginationParams {
  type?: EventType;
  from?: Date;
  to?: Date;
}

export interface IAnalyticsRepository {
  create(data: CreateEventData): Promise<AnalyticsEventEntity>;
  findByStoreId(storeId: string, params?: AnalyticsFilterParams): Promise<PaginatedResult<AnalyticsEventEntity>>;
  countByType(storeId: string, type: EventType, from?: Date, to?: Date): Promise<number>;
  countUniqueVisitors(storeId: string, from?: Date, to?: Date): Promise<number>;
  getVisitsByDay(storeId: string, from: Date, to: Date): Promise<Array<{ date: string; count: number }>>;
  getViewsByCategory(storeId: string, from?: Date, to?: Date): Promise<Array<{ categoryName: string; views: number }>>;
  getViewsByProduct(storeId: string, from?: Date, to?: Date): Promise<Array<{ productId: string; productName: string; views: number }>>;
}
