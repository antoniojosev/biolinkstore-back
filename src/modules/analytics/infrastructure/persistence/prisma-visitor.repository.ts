import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IVisitorRepository, UpsertVisitorData } from '../../domain/repositories/visitor.repository.interface';
import { VisitorEntity } from '../../domain/entities/visitor.entity';

@Injectable()
export class PrismaVisitorRepository implements IVisitorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertVisitorData): Promise<VisitorEntity> {
    const visitor = await this.prisma.visitor.upsert({
      where: {
        storeId_visitorId: {
          storeId: data.storeId,
          visitorId: data.visitorId,
        },
      },
      create: {
        storeId: data.storeId,
        visitorId: data.visitorId,
        userAgent: data.userAgent,
        visitCount: 1,
      },
      update: {
        userAgent: data.userAgent,
        visitCount: { increment: 1 },
        lastVisit: new Date(),
      },
    });

    return new VisitorEntity(visitor);
  }

  async findByStoreAndVisitorId(storeId: string, visitorId: string): Promise<VisitorEntity | null> {
    const visitor = await this.prisma.visitor.findUnique({
      where: {
        storeId_visitorId: { storeId, visitorId },
      },
    });

    return visitor ? new VisitorEntity(visitor) : null;
  }

  async countByStoreId(storeId: string, since?: Date): Promise<number> {
    return this.prisma.visitor.count({
      where: {
        storeId,
        ...(since ? { lastVisit: { gte: since } } : {}),
      },
    });
  }
}
