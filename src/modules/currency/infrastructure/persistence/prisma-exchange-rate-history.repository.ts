import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IExchangeRateHistoryRepository,
  CreateExchangeRateHistoryData,
  ListExchangeRateHistoryParams,
} from '../../domain/repositories/exchange-rate-history.repository.interface';
import { ExchangeRateHistory } from '../../domain/entities/exchange-rate-history.entity';

@Injectable()
export class PrismaExchangeRateHistoryRepository implements IExchangeRateHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateExchangeRateHistoryData): Promise<ExchangeRateHistory> {
    const row = await this.prisma.exchangeRateHistory.create({
      data: {
        storeId: data.storeId,
        rate: data.rate,
        source: data.source,
        changedBy: data.changedBy ?? null,
        effectiveFrom: data.effectiveFrom ?? new Date(),
      },
    });
    return new ExchangeRateHistory({ ...row, rate: Number(row.rate) });
  }

  async findLatestForStore(storeId: string): Promise<ExchangeRateHistory | null> {
    const row = await this.prisma.exchangeRateHistory.findFirst({
      where: { storeId },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row ? new ExchangeRateHistory({ ...row, rate: Number(row.rate) }) : null;
  }

  async list(
    storeId: string,
    params: ListExchangeRateHistoryParams = {},
  ): Promise<ExchangeRateHistory[]> {
    const { from, to, limit = 50 } = params;
    const rows = await this.prisma.exchangeRateHistory.findMany({
      where: {
        storeId,
        ...(from || to
          ? {
              effectiveFrom: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { effectiveFrom: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });
    return rows.map((r) => new ExchangeRateHistory({ ...r, rate: Number(r.rate) }));
  }
}
