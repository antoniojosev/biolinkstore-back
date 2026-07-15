import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { InstagramImport } from '../../domain/entities/instagram-import.entity';
import {
  CreateInstagramImportData,
  IInstagramImportRepository,
  UpdateInstagramImportData,
} from '../../domain/repositories/instagram-import.repository.interface';

@Injectable()
export class PrismaInstagramImportRepository implements IInstagramImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInstagramImportData): Promise<InstagramImport> {
    const row = await this.prisma.instagramImport.create({
      data: { storeId: data.storeId, handle: data.handle },
    });
    return new InstagramImport(row);
  }

  async findById(id: string): Promise<InstagramImport | null> {
    const row = await this.prisma.instagramImport.findUnique({ where: { id } });
    return row ? new InstagramImport(row) : null;
  }

  async findLatestByStoreId(storeId: string): Promise<InstagramImport | null> {
    const row = await this.prisma.instagramImport.findFirst({
      where: { storeId },
      orderBy: { requestedAt: 'desc' },
    });
    return row ? new InstagramImport(row) : null;
  }

  async findActiveByStoreId(storeId: string): Promise<InstagramImport | null> {
    const row = await this.prisma.instagramImport.findFirst({
      where: { storeId, status: { in: ['RUNNING', 'PROCESSING'] } },
      orderBy: { requestedAt: 'desc' },
    });
    return row ? new InstagramImport(row) : null;
  }

  async update(id: string, data: UpdateInstagramImportData): Promise<InstagramImport> {
    const row = await this.prisma.instagramImport.update({
      where: { id },
      data,
    });
    return new InstagramImport(row);
  }

  async findCreatedProducts(
    importId: string,
  ): Promise<Array<{ id: string; name: string; images: string[]; basePrice: number }>> {
    const products = await this.prisma.product.findMany({
      where: { instagramImportId: importId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, images: true, basePrice: true },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      images: p.images,
      basePrice: Number(p.basePrice),
    }));
  }
}
