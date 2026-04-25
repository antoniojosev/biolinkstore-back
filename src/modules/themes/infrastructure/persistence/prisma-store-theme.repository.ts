import { Injectable } from '@nestjs/common';
import { StoreTheme as PrismaStoreTheme } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { StoreTheme } from '../../domain/entities/store-theme.entity';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';

function toDomain(row: PrismaStoreTheme): StoreTheme {
  return new StoreTheme({
    id: row.id,
    storeId: row.storeId,
    activeTemplate: row.activeTemplate,
    publishedTemplate: row.publishedTemplate,
    rollbackTemplate: row.rollbackTemplate,
    draftsByTemplate: row.draftsByTemplate,
    publishedTree: row.publishedTree,
    publishedTokens: row.publishedTokens,
    rollbackTree: row.rollbackTree,
    rollbackTokens: row.rollbackTokens,
    version: row.version,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaStoreThemeRepository implements IStoreThemeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStoreId(storeId: string): Promise<StoreTheme | null> {
    const row = await this.prisma.storeTheme.findUnique({ where: { storeId } });
    return row ? toDomain(row) : null;
  }
}
