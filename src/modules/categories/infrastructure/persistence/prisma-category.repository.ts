import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CategoryMapper } from '../../application/mappers/category.mapper';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';
import { createPaginatedResult, calculateSkip } from '@/common/utils/pagination.util';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return category ? CategoryMapper.toDomain(category) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: {
        storeId_slug: {
          storeId,
          slug,
        },
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return category ? CategoryMapper.toDomain(category) : null;
  }

  async findByStoreId(
    storeId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<Category>> {
    const { page = 1, limit = 10, sortBy = 'sortOrder', sortOrder = 'asc' } = params;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where: { storeId },
        include: {
          _count: {
            select: { products: true },
          },
        },
        skip: calculateSkip(page, limit),
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.category.count({
        where: { storeId },
      }),
    ]);

    const domainCategories = categories.map((category) => CategoryMapper.toDomain(category));

    return createPaginatedResult(domainCategories, total, { page, limit });
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const category = await this.prisma.category.create({
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toDomain(category);
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const category = await this.prisma.category.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toDomain(category);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  async checkSlugExists(storeId: string, slug: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: {
        storeId,
        slug,
      },
    });
    return count > 0;
  }
}
