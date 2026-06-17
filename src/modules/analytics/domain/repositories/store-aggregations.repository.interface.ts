import { StoreEventType } from '@prisma/client';

export interface PeriodRange {
  from: Date;
  to: Date;
}

export interface ViewsAggregate {
  total: number;
  unique: number;
}

export interface EventCountsAggregate {
  productViews: number;
  addToCarts: number;
  whatsappClicks: number;
  socialClicks: number;
  categoryClicks: number;
  sectionViews: number;
}

export interface SummaryAggregate {
  views: ViewsAggregate;
  events: EventCountsAggregate;
}

export interface TopProductRow {
  productId: string;
  views: number;
  addToCarts: number;
  whatsappClicks: number;
}

export interface FunnelAggregate {
  storeViews: number;
  productViews: number;
  addToCarts: number;
  whatsappClicks: number;
}

export interface SourceRow {
  /** Already-normalized referrer host (e.g. instagram.com, direct, other). */
  domain: string;
  visits: number;
}

/**
 * Aggregation port for the dashboard. Lives in the domain so the use-case
 * remains free of Prisma. The Prisma adapter implements raw SQL / groupBy as
 * needed for performance.
 */
export interface IStoreAggregationsRepository {
  countViews(storeId: string, range: PeriodRange): Promise<ViewsAggregate>;
  countEventsByType(
    storeId: string,
    range: PeriodRange,
  ): Promise<Record<StoreEventType, number>>;
  topProducts(
    storeId: string,
    range: PeriodRange,
    limit: number,
  ): Promise<TopProductRow[]>;
  funnel(storeId: string, range: PeriodRange): Promise<FunnelAggregate>;
  sources(storeId: string, range: PeriodRange): Promise<SourceRow[]>;
  /** Used to enrich top-products with product names. */
  resolveProductNames(productIds: string[]): Promise<Map<string, string>>;
}
