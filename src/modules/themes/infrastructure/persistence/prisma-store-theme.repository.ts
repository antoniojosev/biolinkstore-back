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

  async publish(
    storeId: string,
    params: {
      publishedTemplate: string;
      publishedTree: unknown;
      publishedTokens: unknown;
      rollbackTemplate: string | null;
      rollbackTree: unknown | null;
      rollbackTokens: unknown | null;
      publishedAt: Date;
      version: number;
    },
  ): Promise<StoreTheme> {
    // Una sola operación update toca todos los campos a la vez, lo que es
    // atómico por sí mismo a nivel de fila en Postgres. Envolvemos en
    // $transaction de todas formas para honrar el contrato del repo
    // (snapshot + promoción explícitamente atómicos) y dejar espacio si más
    // adelante necesitamos lecturas consistentes pre-update.
    const row = await this.prisma.$transaction(async (tx) => {
      return tx.storeTheme.update({
        where: { storeId },
        data: {
          publishedTemplate: params.publishedTemplate,
          publishedTree: params.publishedTree as Prisma.InputJsonValue,
          publishedTokens: params.publishedTokens as Prisma.InputJsonValue,
          rollbackTemplate: params.rollbackTemplate,
          rollbackTree:
            params.rollbackTree === null
              ? Prisma.JsonNull
              : (params.rollbackTree as Prisma.InputJsonValue),
          rollbackTokens:
            params.rollbackTokens === null
              ? Prisma.JsonNull
              : (params.rollbackTokens as Prisma.InputJsonValue),
          publishedAt: params.publishedAt,
          version: params.version,
        },
      });
    });
    return toDomain(row);
  }

  async swapRollback(
    storeId: string,
    params: {
      publishedTemplate: string;
      publishedTree: unknown;
      publishedTokens: unknown;
      rollbackTemplate: string | null;
      rollbackTree: unknown | null;
      rollbackTokens: unknown | null;
      publishedAt: Date;
    },
  ): Promise<StoreTheme> {
    const row = await this.prisma.$transaction(async (tx) => {
      return tx.storeTheme.update({
        where: { storeId },
        data: {
          publishedTemplate: params.publishedTemplate,
          publishedTree: params.publishedTree as Prisma.InputJsonValue,
          publishedTokens: params.publishedTokens as Prisma.InputJsonValue,
          rollbackTemplate: params.rollbackTemplate,
          rollbackTree:
            params.rollbackTree === null
              ? Prisma.JsonNull
              : (params.rollbackTree as Prisma.InputJsonValue),
          rollbackTokens:
            params.rollbackTokens === null
              ? Prisma.JsonNull
              : (params.rollbackTokens as Prisma.InputJsonValue),
          publishedAt: params.publishedAt,
        },
      });
    });
    return toDomain(row);
  }
}
