import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  ILandingVisitorRepository,
  UpsertLandingVisitorData,
} from '../../domain/repositories/landing-visitor.repository.interface';
import { LandingVisitor } from '../../domain/entities/landing-visitor.entity';

@Injectable()
export class PrismaLandingVisitorRepository implements ILandingVisitorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertLandingVisitorData): Promise<LandingVisitor> {
    return this.prisma.landingVisitor.upsert({
      where: { fingerprint: data.fingerprint },
      create: {
        fingerprint: data.fingerprint,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        referrer: data.referrer ?? null,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
      },
      update: {
        ip: data.ip ?? undefined,
        userAgent: data.userAgent ?? undefined,
        referrer: data.referrer ?? undefined,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
        visitCount: { increment: 1 },
        lastVisit: new Date(),
      },
    });
  }

  async linkToUser(fingerprint: string, userId: string): Promise<void> {
    await this.prisma.landingVisitor.updateMany({
      where: { fingerprint },
      data: { userId },
    });
  }
}
