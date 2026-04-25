import { Injectable } from '@nestjs/common';
import { Prisma, StoreTheme as PrismaStoreTheme } from '@prisma/client';
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

  async findByStoreIdOrCreate(
    storeId: string,
    defaults: {
      activeTemplate: string;
      draftsByTemplate: Record<string, unknown>;
    },
  ): Promise<StoreTheme> {
    const row = await this.prisma.storeTheme.upsert({
      where: { storeId },
      update: {},
      create: {
        storeId,
        activeTemplate: defaults.activeTemplate,
        draftsByTemplate: defaults.draftsByTemplate as Prisma.InputJsonValue,
      },
    });
    return toDomain(row);
  }

  async updateDraftTokens(
    storeId: string,
    _templateKey: string,
    draftsByTemplate: Record<string, unknown>,
  ): Promise<StoreTheme> {
    const row = await this.prisma.storeTheme.update({
      where: { storeId },
      data: {
        draftsByTemplate: draftsByTemplate as Prisma.InputJsonValue,
      },
    });
    return toDomain(row);
  }

  async updateDraftSections(
    storeId: string,
    _templateKey: string,
    draftsByTemplate: Record<string, unknown>,
  ): Promise<StoreTheme> {
    const row = await this.prisma.storeTheme.update({
      where: { storeId },
      data: {
        draftsByTemplate: draftsByTemplate as Prisma.InputJsonValue,
      },
    });
    return toDomain(row);
  }

  async updateDraftsByTemplateAndActive(
    storeId: string,
    draftsByTemplate: Record<string, unknown>,
    activeTemplate: string,
  ): Promise<StoreTheme> {
    const row = await this.prisma.storeTheme.update({
      where: { storeId },
      data: {
        draftsByTemplate: draftsByTemplate as Prisma.InputJsonValue,
        activeTemplate,
      },
    });
    return toDomain(row);
  }
}
