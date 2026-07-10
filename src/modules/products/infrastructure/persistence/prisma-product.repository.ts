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
        realEstateData: true,
        serviceData: true,
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
        realEstateData: true,
        serviceData: true,
      },
    });

    return product ? ProductMapper.toDomain(product) : null;
  }

  async findByStoreId(
    storeId: string,
    params: ProductFilterParams = {},
  ): Promise<PaginatedResult<Product>> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const sortBy = params.sortBy || 'sortOrder';
    const sortOrder = params.sortOrder || 'asc';
    const { categoryId, search } = params;
    const isVisible = params.isVisible !== undefined ? String(params.isVisible) === 'true' : undefined;
    const isFeatured = params.isFeatured !== undefined ? String(params.isFeatured) === 'true' : undefined;
    const isOnSale = params.isOnSale !== undefined ? String(params.isOnSale) === 'true' : undefined;

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

    // Real estate niche filter — implies realEstateData IS NOT NULL
    const { bedrooms, bathrooms, area_min, area_max, listingType } = params;
    const hasRealEstateFilter =
      bedrooms !== undefined ||
      bathrooms !== undefined ||
      area_min !== undefined ||
      area_max !== undefined ||
      listingType !== undefined;

    if (hasRealEstateFilter) {
      const realEstateWhere: any = {};
      if (bedrooms !== undefined) realEstateWhere.bedrooms = bedrooms;
      if (bathrooms !== undefined) realEstateWhere.bathrooms = bathrooms;
      if (area_min !== undefined || area_max !== undefined) {
        realEstateWhere.area = {};
        if (area_min !== undefined) realEstateWhere.area.gte = area_min;
        if (area_max !== undefined) realEstateWhere.area.lte = area_max;
      }
      if (listingType !== undefined) realEstateWhere.listingType = listingType;
      where.realEstateData = { is: realEstateWhere };
    }

    // Services niche filter — implies serviceData IS NOT NULL
    const { modality, duration_min, duration_max } = params;
    const hasServiceFilter =
      modality !== undefined || duration_min !== undefined || duration_max !== undefined;

    if (hasServiceFilter) {
      const serviceWhere: any = {};
      if (modality !== undefined) serviceWhere.modality = modality;
      if (duration_min !== undefined || duration_max !== undefined) {
        serviceWhere.duration = {};
        if (duration_min !== undefined) serviceWhere.duration.gte = duration_min;
        if (duration_max !== undefined) serviceWhere.duration.lte = duration_max;
      }
      where.serviceData = { is: serviceWhere };
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
          realEstateData: true,
          serviceData: true,
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
        tagline: data.tagline,
        description: data.description,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        priceCurrency: data.priceCurrency ?? 'USD',
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
        realEstateData: data.realEstateData
          ? {
              create: {
                bedrooms: data.realEstateData.bedrooms ?? null,
                bathrooms: data.realEstateData.bathrooms ?? null,
                area: data.realEstateData.area ?? null,
                listingType: data.realEstateData.listingType ?? null,
              },
            }
          : undefined,
        serviceData: data.serviceData
          ? {
              create: {
                duration: data.serviceData.duration ?? null,
                modality: data.serviceData.modality ?? null,
                coverage: data.serviceData.coverage ?? null,
              },
            }
          : undefined,
      },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        categories: true,
        realEstateData: true,
        serviceData: true,
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

    // Same replace-all pattern as categories: attributes have no stable id from
    // the client (options/optionsMeta can change shape), so re-create is simpler
    // and safer than diffing. Variants (separate model) are untouched here.
    const attributeUpdate = data.attributes
      ? {
          attributes: {
            deleteMany: {},
            create: data.attributes,
          },
        }
      : {};

    const realEstateUpdate = data.realEstateData
      ? {
          realEstateData: {
            upsert: {
              create: {
                bedrooms: data.realEstateData.bedrooms ?? null,
                bathrooms: data.realEstateData.bathrooms ?? null,
                area: data.realEstateData.area ?? null,
                listingType: data.realEstateData.listingType ?? null,
              },
              update: {
                bedrooms: data.realEstateData.bedrooms,
                bathrooms: data.realEstateData.bathrooms,
                area: data.realEstateData.area,
                listingType: data.realEstateData.listingType,
              },
            },
          },
        }
      : {};

    const serviceUpdate = data.serviceData
      ? {
          serviceData: {
            upsert: {
              create: {
                duration: data.serviceData.duration ?? null,
                modality: data.serviceData.modality ?? null,
                coverage: data.serviceData.coverage ?? null,
              },
              update: {
                duration: data.serviceData.duration,
                modality: data.serviceData.modality,
                coverage: data.serviceData.coverage,
              },
            },
          },
        }
      : {};

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        tagline: data.tagline,
        description: data.description,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        priceCurrency: data.priceCurrency,
        images: data.images,
        videos: data.videos,
        stock: data.stock,
        sku: data.sku,
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
        isOnSale: data.isOnSale,
        sortOrder: data.sortOrder,
        ...categoryUpdate,
        ...attributeUpdate,
        ...realEstateUpdate,
        ...serviceUpdate,
      },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        categories: true,
        realEstateData: true,
        serviceData: true,
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

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }
}
