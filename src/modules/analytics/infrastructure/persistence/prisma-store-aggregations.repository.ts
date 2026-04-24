import { Injectable } from '@nestjs/common';
import { Prisma, StoreEventType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IStoreAggregationsRepository,
  PeriodRange,
  ViewsAggregate,
  TopProductRow,
  FunnelAggregate,
  SourceRow,
} from '../../domain/repositories/store-aggregations.repository.interface';

@Injectable()
export class PrismaStoreAggregationsRepository implements IStoreAggregationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countViews(storeId: string, range: PeriodRange): Promise<ViewsAggregate> {
    const where: Prisma.StoreViewWhereInput = {
      storeId,
      createdAt: { gte: range.from, lte: range.to },
    };

    const [total, distinctRows] = await Promise.all([
      this.prisma.storeView.count({ where }),
      this.prisma.storeView.findMany({
        where,
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),
    ]);

    return { total, unique: distinctRows.length };
  }

  async countEventsByType(
    storeId: string,
    range: PeriodRange,
  ): Promise<Record<StoreEventType, number>> {
    const groups = await this.prisma.storeEvent.groupBy({
      by: ['type'],
      where: {
        storeId,
        timestamp: { gte: range.from, lte: range.to },
      },
      _count: { _all: true },
    });

    const result: Record<StoreEventType, number> = {
      PRODUCT_VIEW: 0,
      ADD_TO_CART: 0,
      WHATSAPP_CLICK: 0,
      SOCIAL_CLICK: 0,
      CATEGORY_CLICK: 0,
      SECTION_VIEW: 0,
    };
    for (const g of groups) {
      result[g.type] = g._count._all;
    }
    return result;
  }

  /**
   * Top products by mixed event signal. Single groupBy query over events with
   * non-null targetId that are product-related, then aggregate per-product
   * counts in memory and let the use-case apply scoring weights.
   */
  async topProducts(
    storeId: string,
    range: PeriodRange,
    limit: number,
  ): Promise<TopProductRow[]> {
    const safeLimit = Math.max(1, Math.min(limit, 100));

    const groups = await this.prisma.storeEvent.groupBy({
      by: ['targetId', 'type'],
      where: {
        storeId,
        timestamp: { gte: range.from, lte: range.to },
        type: {
          in: [
            StoreEventType.PRODUCT_VIEW,
            StoreEventType.ADD_TO_CART,
            StoreEventType.WHATSAPP_CLICK,
          ],
        },
        targetId: { not: null },
      },
      _count: { _all: true },
    });

    const byProduct = new Map<string, TopProductRow>();
    for (const g of groups) {
      const productId = g.targetId;
      if (!productId) continue;
      const row =
        byProduct.get(productId) ??
        ({ productId, views: 0, addToCarts: 0, whatsappClicks: 0 } as TopProductRow);
      switch (g.type) {
        case StoreEventType.PRODUCT_VIEW:
          row.views += g._count._all;
          break;
        case StoreEventType.ADD_TO_CART:
          row.addToCarts += g._count._all;
          break;
        case StoreEventType.WHATSAPP_CLICK:
          row.whatsappClicks += g._count._all;
          break;
        default:
          break;
      }
      byProduct.set(productId, row);
    }

    // Sorting + clamping is done by the use-case (it owns the scoring weights),
    // but we already cap the universe to keep the response small.
    return [...byProduct.values()].slice(0, Math.max(safeLimit * 4, safeLimit));
  }

  async funnel(storeId: string, range: PeriodRange): Promise<FunnelAggregate> {
    const where = { storeId, timestamp: { gte: range.from, lte: range.to } } as const;

    const [storeViews, productViews, addToCarts, whatsappClicks] = await Promise.all([
      this.prisma.storeView.count({
        where: { storeId, createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.storeEvent.count({ where: { ...where, type: StoreEventType.PRODUCT_VIEW } }),
      this.prisma.storeEvent.count({ where: { ...where, type: StoreEventType.ADD_TO_CART } }),
      this.prisma.storeEvent.count({ where: { ...where, type: StoreEventType.WHATSAPP_CLICK } }),
    ]);

    return { storeViews, productViews, addToCarts, whatsappClicks };
  }

  /**
   * Returns raw referrer rows (one per visit). Source consolidation lives in
   * the application layer so that the bucketing logic is testable in isolation
   * and easy to evolve without a migration.
   */
  async sources(storeId: string, range: PeriodRange): Promise<SourceRow[]> {
    const groups = await this.prisma.storeView.groupBy({
      by: ['referrer'],
      where: { storeId, createdAt: { gte: range.from, lte: range.to } },
      _count: { _all: true },
    });

    return groups.map((g) => ({ domain: g.referrer ?? '', visits: g._count._all }));
  }

  async resolveProductNames(productIds: string[]): Promise<Map<string, string>> {
    if (productIds.length === 0) return new Map();
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    return new Map(products.map((p) => [p.id, p.name]));
  }
}
