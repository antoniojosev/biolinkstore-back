import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  IVariantRepository,
  CreateVariantData,
  UpdateVariantData,
} from '../../domain/repositories/variant.repository.interface';
import { ProductVariant } from '../../domain/entities/product.entity';

@Injectable()
export class PrismaVariantRepository implements IVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductVariant | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
    });

    return variant
      ? new ProductVariant({
          id: variant.id,
          productId: variant.productId,
          combination: variant.combination,
          sku: variant.sku,
          priceAdjustment: Number(variant.priceAdjustment),
          stock: variant.stock,
          image: variant.image,
          isAvailable: variant.isAvailable,
        })
      : null;
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
    });

    return variants.map(
      (variant) =>
        new ProductVariant({
          id: variant.id,
          productId: variant.productId,
          combination: variant.combination,
          sku: variant.sku,
          priceAdjustment: Number(variant.priceAdjustment),
          stock: variant.stock,
          image: variant.image,
          isAvailable: variant.isAvailable,
        }),
    );
  }

  async create(data: CreateVariantData): Promise<ProductVariant> {
    const variant = await this.prisma.productVariant.create({
      data: {
        productId: data.productId,
        combination: data.combination,
        sku: data.sku,
        priceAdjustment: data.priceAdjustment ?? 0,
        stock: data.stock,
        image: data.image,
        isAvailable: data.isAvailable ?? true,
      },
    });

    return new ProductVariant({
      id: variant.id,
      productId: variant.productId,
      combination: variant.combination,
      sku: variant.sku,
      priceAdjustment: Number(variant.priceAdjustment),
      stock: variant.stock,
      image: variant.image,
      isAvailable: variant.isAvailable,
    });
  }

  async update(id: string, data: UpdateVariantData): Promise<ProductVariant> {
    const variant = await this.prisma.productVariant.update({
      where: { id },
      data: {
        combination: data.combination,
        sku: data.sku,
        priceAdjustment: data.priceAdjustment,
        stock: data.stock,
        image: data.image,
        isAvailable: data.isAvailable,
      },
    });

    return new ProductVariant({
      id: variant.id,
      productId: variant.productId,
      combination: variant.combination,
      sku: variant.sku,
      priceAdjustment: Number(variant.priceAdjustment),
      stock: variant.stock,
      image: variant.image,
      isAvailable: variant.isAvailable,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productVariant.delete({
      where: { id },
    });
  }

  async deleteByProductId(productId: string): Promise<void> {
    await this.prisma.productVariant.deleteMany({
      where: { productId },
    });
  }
}
