import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  CreateStoreSocialLinkData,
  IStoreSocialLinkRepository,
  UpdateStoreSocialLinkData,
} from '../../domain/repositories/store-social-link.repository.interface';
import { StoreSocialLink } from '../../domain/entities/store-social-link.entity';

@Injectable()
export class PrismaStoreSocialLinkRepository implements IStoreSocialLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<StoreSocialLink | null> {
    const row = await this.prisma.storeSocialLink.findUnique({ where: { id } });
    return row ? new StoreSocialLink(row) : null;
  }

  async findByStoreId(storeId: string): Promise<StoreSocialLink[]> {
    const rows = await this.prisma.storeSocialLink.findMany({
      where: { storeId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => new StoreSocialLink(r));
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.storeSocialLink.count({ where: { storeId } });
  }

  async create(data: CreateStoreSocialLinkData): Promise<StoreSocialLink> {
    const row = await this.prisma.storeSocialLink.create({
      data: {
        storeId: data.storeId,
        platform: data.platform,
        url: data.url,
        label: data.label ?? null,
        sortOrder: data.sortOrder ?? 0,
        visible: data.visible ?? true,
      },
    });
    return new StoreSocialLink(row);
  }

  async createMany(rows: CreateStoreSocialLinkData[]): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.storeSocialLink.createMany({
      data: rows.map((r) => ({
        storeId: r.storeId,
        platform: r.platform,
        url: r.url,
        label: r.label ?? null,
        sortOrder: r.sortOrder ?? 0,
        visible: r.visible ?? true,
      })),
      skipDuplicates: true,
    });
  }

  async update(id: string, data: UpdateStoreSocialLinkData): Promise<StoreSocialLink> {
    const row = await this.prisma.storeSocialLink.update({
      where: { id },
      data: {
        ...(data.platform !== undefined ? { platform: data.platform } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.visible !== undefined ? { visible: data.visible } : {}),
      },
    });
    return new StoreSocialLink(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storeSocialLink.delete({ where: { id } });
  }

  async reorder(storeId: string, items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    if (items.length === 0) return;
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.storeSocialLink.updateMany({
          where: { id: item.id, storeId },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }
}
