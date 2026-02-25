import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IProductRepository,
  CreateProductData,
  UpdateProductData,
  ProductFilterParams,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductMapper } from '../../application/mappers/product.mapper';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { createPaginatedResult, calculateSkip } from '@/common/utils/pagination.util';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        categories: true,
      },
    });

    return product ? ProductMapper.toDomain(product) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: {
        storeId_slug: {
          storeId,
          slug,
        },
      },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        categories: true,
      },
    });

    return product ? ProductMapper.toDomain(product) : null;
  }

  async findByStoreId(
    storeId: string,
    params: ProductFilterParams = {},
  ): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      categoryId,
      isVisible,
      isFeatured,
      isOnSale,
      search,
    } = params;

    // Build where clause
    const where: any = { storeId };

    if (categoryId) {
      where.categories = {
        some: {
          categoryId,
        },
      };
    }

    if (isVisible !== undefined) {
      where.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (isOnSale !== undefined) {
      where.isOnSale = isOnSale;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          attributes: {
            orderBy: { sortOrder: 'asc' },
          },
          variants: true,
          categories: true,
        },
        skip: calculateSkip(page, limit),
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    const domainProducts = products.map((product) => ProductMapper.toDomain(product));

    return createPaginatedResult(domainProducts, total, { page, limit });
  }

  async create(data: CreateProductData): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        prices: data.prices,
        images: data.images || [],
        videos: data.videos || [],
        stock: data.stock,
        sku: data.sku,
        isVisible: data.isVisible ?? true,
        isFeatured: data.isFeatured ?? false,
        isOnSale: data.isOnSale ?? false,
        sortOrder: data.sortOrder ?? 0,
        attributes: data.attributes
          ? {
              create: data.attributes,
            }
          : undefined,
        categories: data.categoryIds
          ? {
              create: data.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
      },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        categories: true,
      },
    });

    return ProductMapper.toDomain(product);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    // If categoryIds are provided, update the relationship
    const categoryUpdate = data.categoryIds
      ? {
          categories: {
            deleteMany: {},
            create: data.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
        }
      : {};

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        prices: data.prices,
        images: data.images,
        videos: data.videos,
        stock: data.stock,
        sku: data.sku,
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
        isOnSale: data.isOnSale,
        sortOrder: data.sortOrder,
        ...categoryUpdate,
      },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        categories: true,
      },
    });

    return ProductMapper.toDomain(product);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async checkSlugExists(storeId: string, slug: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: {
        storeId,
        slug,
      },
    });
    return count > 0;
  }
}
