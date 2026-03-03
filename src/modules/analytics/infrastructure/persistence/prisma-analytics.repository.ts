import { Injectable } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IAnalyticsRepository,
  CreateEventData,
  AnalyticsFilterParams,
} from '../../domain/repositories/analytics.repository.interface';
import { AnalyticsEventEntity } from '../../domain/entities/analytics-event.entity';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { createPaginatedResult, calculateSkip } from '@/common/utils/pagination.util';

@Injectable()
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEventData): Promise<AnalyticsEventEntity> {
    const event = await this.prisma.analyticsEvent.create({
      data: {
        storeId: data.storeId,
        visitorId: data.visitorId,
        productId: data.productId,
        type: data.type,
        metadata: data.metadata ?? undefined,
      },
    });

    return new AnalyticsEventEntity(event);
  }

  async findByStoreId(
    storeId: string,
    params: AnalyticsFilterParams = {},
  ): Promise<PaginatedResult<AnalyticsEventEntity>> {
    const { page = 1, limit = 20, sortOrder = 'desc', type, from, to } = params;

    const where: any = { storeId };
    if (type) where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [events, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        skip: calculateSkip(page, limit),
        take: limit,
        orderBy: { createdAt: sortOrder },
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return createPaginatedResult(
      events.map((e) => new AnalyticsEventEntity(e)),
      total,
      { page, limit },
    );
  }

  async countByType(storeId: string, type: EventType, from?: Date, to?: Date): Promise<number> {
    const where: any = { storeId, type };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }
    return this.prisma.analyticsEvent.count({ where });
  }

  async countUniqueVisitors(storeId: string, from?: Date, to?: Date): Promise<number> {
    const where: any = { storeId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const result = await this.prisma.analyticsEvent.groupBy({
      by: ['visitorId'],
      where: { ...where, visitorId: { not: null } },
    });

    return result.length;
  }

  async getVisitsByDay(
    storeId: string,
    from: Date,
    to: Date,
  ): Promise<Array<{ date: string; count: number }>> {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        storeId,
        type: 'PAGE_VIEW',
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true },
    });

    const dayMap = new Map<string, number>();
    for (const event of events) {
      const day = event.createdAt.toISOString().split('T')[0];
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }

    // Fill missing days with 0
    const result: Array<{ date: string; count: number }> = [];
    const current = new Date(from);
    while (current <= to) {
      const dayStr = current.toISOString().split('T')[0];
      result.push({ date: dayStr, count: dayMap.get(dayStr) || 0 });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  async getViewsByCategory(
    storeId: string,
    from?: Date,
    to?: Date,
  ): Promise<Array<{ categoryName: string; views: number }>> {
    const where: any = {
      storeId,
      type: 'PRODUCT_VIEW' as EventType,
      productId: { not: null },
    };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        product: {
          select: {
            categories: {
              select: {
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const catMap = new Map<string, number>();
    for (const event of events) {
      const cats = event.product?.categories ?? [];
      if (cats.length === 0) {
        catMap.set('Sin categoría', (catMap.get('Sin categoría') || 0) + 1);
      } else {
        for (const c of cats) {
          const name = c.category.name;
          catMap.set(name, (catMap.get(name) || 0) + 1);
        }
      }
    }

    return Array.from(catMap.entries())
      .map(([categoryName, views]) => ({ categoryName, views }))
      .sort((a, b) => b.views - a.views);
  }

  async getViewsByProduct(
    storeId: string,
    from?: Date,
    to?: Date,
  ): Promise<Array<{ productId: string; productName: string; views: number }>> {
    const where: any = {
      storeId,
      type: 'PRODUCT_VIEW' as EventType,
      productId: { not: null },
    };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        productId: true,
        product: {
          select: { name: true },
        },
      },
    });

    const productMap = new Map<string, { name: string; views: number }>();
    for (const event of events) {
      if (!event.productId || !event.product) continue;
      const existing = productMap.get(event.productId);
      if (existing) {
        existing.views++;
      } else {
        productMap.set(event.productId, { name: event.product.name, views: 1 });
      }
    }

    return Array.from(productMap.entries())
      .map(([productId, { name, views }]) => ({ productId, productName: name, views }))
      .sort((a, b) => b.views - a.views);
  }
}
