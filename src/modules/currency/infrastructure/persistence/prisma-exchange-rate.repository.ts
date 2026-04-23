import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { ExchangeRate as PrismaExchangeRate } from '@prisma/client';
import {
  IExchangeRateRepository,
  UpsertExchangeRateData,
} from '../../domain/repositories/exchange-rate.repository.interface';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';

@Injectable()
export class PrismaExchangeRateRepository implements IExchangeRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string): Promise<ExchangeRate | null> {
    const record = await this.prisma.exchangeRate.findUnique({ where: { code } });
    return record ? this.toDomain(record) : null;
  }

  async upsert(data: UpsertExchangeRateData): Promise<ExchangeRate> {
    const record = await this.prisma.exchangeRate.upsert({
      where: { code: data.code },
      create: {
        code: data.code,
        rate: data.rate,
        source: data.source,
        fetchedAt: data.fetchedAt,
      },
      update: {
        rate: data.rate,
        source: data.source,
        fetchedAt: data.fetchedAt,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: PrismaExchangeRate): ExchangeRate {
    return new ExchangeRate({
      id: record.id,
      code: record.code,
      rate: Number(record.rate),
      source: record.source,
      fetchedAt: record.fetchedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
