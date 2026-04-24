import { Injectable } from '@nestjs/common';
import { Prisma, StoreEvent as PrismaStoreEvent } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IStoreEventRepository,
  CreateStoreEventData,
  ListStoreEventsParams,
  ListStoreEventsResult,
} from '../../domain/repositories/store-event.repository.interface';
import { StoreEvent } from '../../domain/entities/store-event.entity';

@Injectable()
export class PrismaStoreEventRepository implements IStoreEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStoreEventData): Promise<StoreEvent> {
    const row = await this.prisma.storeEvent.create({
      data: {
        storeId: data.storeId,
        type: data.type,
        targetId: data.targetId ?? null,
        metadata:
          data.metadata === undefined || data.metadata === null
            ? Prisma.JsonNull
            : (data.metadata as Prisma.InputJsonValue),
        sessionId: data.sessionId ?? null,
        referrer: data.referrer ?? null,
        userAgent: data.userAgent ?? null,
      },
    });

    return PrismaStoreEventRepository.toDomain(row);
  }

  async list(params: ListStoreEventsParams): Promise<ListStoreEventsResult> {
    const limit = Math.max(1, Math.min(params.limit ?? 50, 200));
    const cursor = decodeCursor(params.cursor);

    const where: Prisma.StoreEventWhereInput = {
      storeId: params.storeId,
      ...(params.type ? { type: params.type } : {}),
      ...(params.from || params.to
        ? {
            timestamp: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
      ...(cursor
        ? {
            OR: [
              { timestamp: { lt: cursor.timestamp } },
              { timestamp: cursor.timestamp, id: { lt: cursor.id } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.storeEvent.findMany({
      where,
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return {
      data: page.map(PrismaStoreEventRepository.toDomain),
      nextCursor: hasMore && last ? encodeCursor(last.timestamp, last.id) : null,
    };
  }

  private static toDomain(row: PrismaStoreEvent): StoreEvent {
    return new StoreEvent({
      id: row.id,
      storeId: row.storeId,
      type: row.type,
      targetId: row.targetId,
      metadata:
        row.metadata === null || row.metadata === undefined
          ? null
          : (row.metadata as Record<string, unknown>),
      sessionId: row.sessionId,
      referrer: row.referrer,
      userAgent: row.userAgent,
      timestamp: row.timestamp,
    });
  }
}

interface DecodedCursor {
  timestamp: Date;
  id: string;
}

function encodeCursor(timestamp: Date, id: string): string {
  const raw = `${timestamp.toISOString()}|${id}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

function decodeCursor(cursor?: string): DecodedCursor | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const sep = raw.lastIndexOf('|');
    if (sep <= 0) return null;
    const ts = new Date(raw.slice(0, sep));
    const id = raw.slice(sep + 1);
    if (Number.isNaN(ts.getTime()) || !id) return null;
    return { timestamp: ts, id };
  } catch {
    return null;
  }
}
