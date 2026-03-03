import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { PLAN_FEATURES } from '@/common/constants/plans';
import { Plan } from '@prisma/client';
import { StoreCountsResponseDto } from '../dto/store-counts-response.dto';

@Injectable()
export class GetStoreCountsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(storeId: string): Promise<StoreCountsResponseDto> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { subscription: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const plan: Plan = store.subscription?.plan ?? Plan.FREE;
    const features = PLAN_FEATURES[plan];

    const [productCount, categoryCount] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.category.count({ where: { storeId } }),
    ]);

    return {
      productCount,
      categoryCount,
      maxProducts: features.maxProducts,
      maxCategories: features.maxCategories,
      plan,
    };
  }
}
