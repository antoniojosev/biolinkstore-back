import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Rate, StoreCustomRate, CustomRateMode } from '../../domain/entities/rate.entity';
import {
  IRateRepository,
  CreateCustomRateData,
  UpdateCustomRateData,
} from '../../domain/repositories/rate.repository.interface';

@Injectable()
export class PrismaRateRepository implements IRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOfficialByCode(code: string): Promise<Rate | null> {
    const rate = await this.prisma.rate.findUnique({
      where: { code },
      include: {
        snapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!rate) return null;
    const latest = rate.snapshots[0];
    return new Rate({
      code: rate.code,
      label: rate.label,
      baseCurrency: rate.baseCurrency,
      sourceUrl: rate.sourceUrl,
      sourcePath: rate.sourcePath,
      isActive: rate.isActive,
      lastValue: latest ? Number(latest.valueVes) : null,
      lastFetchedAt: latest?.fetchedAt ?? null,
    });
  }

  async findAllActiveOfficial(): Promise<Rate[]> {
    const rates = await this.prisma.rate.findMany({
      where: { isActive: true },
      include: {
        snapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    });
    return rates.map((r) => {
      const latest = r.snapshots[0];
      return new Rate({
        code: r.code,
        label: r.label,
        baseCurrency: r.baseCurrency,
        sourceUrl: r.sourceUrl,
        sourcePath: r.sourcePath,
        isActive: r.isActive,
        lastValue: latest ? Number(latest.valueVes) : null,
        lastFetchedAt: latest?.fetchedAt ?? null,
      });
    });
  }

  async saveOfficialSnapshot(code: string, value: number): Promise<void> {
    await this.prisma.rateSnapshot.create({
      data: { rateCode: code, valueVes: value },
    });
  }

  async findCustomById(id: string): Promise<StoreCustomRate | null> {
    const r = await this.prisma.storeCustomRate.findUnique({ where: { id } });
    return r ? this.toCustom(r) : null;
  }

  async findCustomsByStore(storeId: string): Promise<StoreCustomRate[]> {
    const list = await this.prisma.storeCustomRate.findMany({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
    });
    return list.map((r) => this.toCustom(r));
  }

  async createCustom(data: CreateCustomRateData): Promise<StoreCustomRate> {
    const r = await this.prisma.storeCustomRate.create({
      data: {
        storeId: data.storeId,
        label: data.label,
        baseCurrency: data.baseCurrency,
        mode: data.mode,
        valueVes: data.valueVes ?? null,
        formula: data.formula ?? null,
        sourceUrl: data.sourceUrl ?? null,
        sourcePath: data.sourcePath ?? null,
      },
    });
    return this.toCustom(r);
  }

  async updateCustom(id: string, data: UpdateCustomRateData): Promise<StoreCustomRate> {
    const r = await this.prisma.storeCustomRate.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.baseCurrency !== undefined ? { baseCurrency: data.baseCurrency } : {}),
        ...(data.mode !== undefined ? { mode: data.mode } : {}),
        ...(data.valueVes !== undefined ? { valueVes: data.valueVes } : {}),
        ...(data.formula !== undefined ? { formula: data.formula } : {}),
        ...(data.sourceUrl !== undefined ? { sourceUrl: data.sourceUrl } : {}),
        ...(data.sourcePath !== undefined ? { sourcePath: data.sourcePath } : {}),
      },
    });
    return this.toCustom(r);
  }

  async deleteCustom(id: string): Promise<void> {
    await this.prisma.storeCustomRate.delete({ where: { id } });
  }

  async updateCustomFetch(id: string, value: number): Promise<void> {
    await this.prisma.storeCustomRate.update({
      where: { id },
      data: { lastValue: value, lastFetchedAt: new Date() },
    });
  }

  private toCustom(r: {
    id: string;
    storeId: string;
    label: string;
    baseCurrency: string;
    mode: string;
    valueVes: unknown;
    formula: string | null;
    sourceUrl: string | null;
    sourcePath: string | null;
    lastValue: unknown;
    lastFetchedAt: Date | null;
  }): StoreCustomRate {
    return new StoreCustomRate({
      id: r.id,
      storeId: r.storeId,
      label: r.label,
      baseCurrency: r.baseCurrency,
      mode: r.mode as CustomRateMode,
      valueVes: r.valueVes != null ? Number(r.valueVes) : null,
      formula: r.formula,
      sourceUrl: r.sourceUrl,
      sourcePath: r.sourcePath,
      lastValue: r.lastValue != null ? Number(r.lastValue) : null,
      lastFetchedAt: r.lastFetchedAt,
    });
  }
}
