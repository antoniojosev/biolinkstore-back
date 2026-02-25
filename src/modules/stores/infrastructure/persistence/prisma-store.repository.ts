import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IStoreRepository,
  CreateStoreData,
  UpdateStoreData,
} from '../../domain/repositories/store.repository.interface';
import { Store } from '../../domain/entities/store.entity';
import { StoreMapper } from '../../application/mappers/store.mapper';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';
import { createPaginatedResult, calculateSkip } from '@/common/utils/pagination.util';

@Injectable()
export class PrismaStoreRepository implements IStoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
      where: { id },
    });
    return store ? StoreMapper.toDomain(store) : null;
  }

  async findByIdWithSubscription(id: string): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { subscription: true },
    });
    return store ? StoreMapper.toDomain(store) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: { subscription: true },
    });
    return store ? StoreMapper.toDomain(store) : null;
  }

  async findByOwnerId(
    ownerId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<Store>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where: { ownerId },
        include: { subscription: true },
        skip: calculateSkip(page, limit),
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.store.count({
        where: { ownerId },
      }),
    ]);

    const domainStores = stores.map((store) => StoreMapper.toDomain(store));

    return createPaginatedResult(domainStores, total, { page, limit });
  }

  async create(data: CreateStoreData): Promise<Store> {
    const store = await this.prisma.store.create({
      data,
      include: { subscription: true },
    });
    return StoreMapper.toDomain(store);
  }

  async update(id: string, data: UpdateStoreData): Promise<Store> {
    const store = await this.prisma.store.update({
      where: { id },
      data,
      include: { subscription: true },
    });
    return StoreMapper.toDomain(store);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.store.delete({
      where: { id },
    });
  }

  async checkSlugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.store.count({
      where: { slug },
    });
    return count > 0;
  }
}
