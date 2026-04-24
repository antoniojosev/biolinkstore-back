import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IStoreHoursRepository,
  StoreHoursUpsertData,
} from '../../domain/repositories/store-hours.repository.interface';
import { StoreHours } from '../../domain/entities/store-hours.entity';

@Injectable()
export class PrismaStoreHoursRepository implements IStoreHoursRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStoreId(storeId: string): Promise<StoreHours[]> {
    const rows = await this.prisma.storeHours.findMany({
      where: { storeId },
      orderBy: { dayOfWeek: 'asc' },
    });
    return rows.map((r) => new StoreHours(r));
  }

  async upsertMany(storeId: string, entries: StoreHoursUpsertData[]): Promise<StoreHours[]> {
    await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.storeHours.upsert({
          where: {
            storeId_dayOfWeek: { storeId, dayOfWeek: entry.dayOfWeek },
          },
          create: {
            storeId,
            dayOfWeek: entry.dayOfWeek,
            openTime: entry.openTime,
            closeTime: entry.closeTime,
            closed: entry.closed,
          },
          update: {
            openTime: entry.openTime,
            closeTime: entry.closeTime,
            closed: entry.closed,
          },
        }),
      ),
    );

    return this.findByStoreId(storeId);
  }
}
