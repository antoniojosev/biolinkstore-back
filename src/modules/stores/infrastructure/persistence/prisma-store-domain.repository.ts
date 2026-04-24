import { Injectable } from '@nestjs/common';
import { StoreDomainStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  CreateStoreDomainData,
  IStoreDomainRepository,
  UpdateStoreDomainData,
} from '../../domain/repositories/store-domain.repository.interface';
import { StoreDomain } from '../../domain/entities/store-domain.entity';

@Injectable()
export class PrismaStoreDomainRepository implements IStoreDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStoreId(storeId: string): Promise<StoreDomain | null> {
    const row = await this.prisma.storeDomain.findUnique({ where: { storeId } });
    return row ? new StoreDomain(row) : null;
  }

  async findByDomain(domain: string): Promise<StoreDomain | null> {
    const row = await this.prisma.storeDomain.findUnique({ where: { domain } });
    return row ? new StoreDomain(row) : null;
  }

  async findVerifiedByDomain(domain: string): Promise<StoreDomain | null> {
    const row = await this.prisma.storeDomain.findFirst({
      where: { domain, status: StoreDomainStatus.VERIFIED },
    });
    return row ? new StoreDomain(row) : null;
  }

  async create(data: CreateStoreDomainData): Promise<StoreDomain> {
    const row = await this.prisma.storeDomain.create({
      data: {
        storeId: data.storeId,
        domain: data.domain,
        verificationToken: data.verificationToken,
      },
    });
    return new StoreDomain(row);
  }

  async update(id: string, data: UpdateStoreDomainData): Promise<StoreDomain> {
    const row = await this.prisma.storeDomain.update({
      where: { id },
      data: {
        ...(data.domain !== undefined ? { domain: data.domain } : {}),
        ...(data.verificationToken !== undefined ? { verificationToken: data.verificationToken } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.verifiedAt !== undefined ? { verifiedAt: data.verifiedAt } : {}),
        ...(data.lastCheckedAt !== undefined ? { lastCheckedAt: data.lastCheckedAt } : {}),
      },
    });
    return new StoreDomain(row);
  }

  async deleteByStoreId(storeId: string): Promise<void> {
    await this.prisma.storeDomain.delete({ where: { storeId } }).catch(() => {
      // idempotent: ignore P2025 (record not found)
    });
  }
}
