import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IStoreViewRepository,
  CreateStoreViewData,
  StoreViewAggregates,
} from '../../domain/repositories/store-view.repository.interface';
import { StoreView } from '../../domain/entities/store-view.entity';

@Injectable()
export class PrismaStoreViewRepository implements IStoreViewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStoreViewData): Promise<StoreView> {
    const row = await this.prisma.storeView.create({
      data: {
        storeId: data.storeId,
        sessionId: data.sessionId,
        referrer: data.referrer ?? null,
        country: data.country ?? null,
        device: data.device ?? null,
        scrollDepth: data.scrollDepth ?? null,
        timeOnPage: data.timeOnPage ?? null,
      },
    });
    return new StoreView(row);
  }

  async aggregate(storeId: string, from?: Date, to?: Date): Promise<StoreViewAggregates> {
    const where = {
      storeId,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [totalViews, aggregates, uniqueSessionsResult] = await Promise.all([
      this.prisma.storeView.count({ where }),
      this.prisma.storeView.aggregate({
        where,
        _avg: { scrollDepth: true, timeOnPage: true },
      }),
      this.prisma.storeView.findMany({
        where,
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),
    ]);

    return {
      totalViews,
      uniqueSessions: uniqueSessionsResult.length,
      avgScrollDepth:
        aggregates._avg.scrollDepth === null ? null : Number(aggregates._avg.scrollDepth),
      avgTimeOnPage:
        aggregates._avg.timeOnPage === null ? null : Number(aggregates._avg.timeOnPage),
    };
  }
}
