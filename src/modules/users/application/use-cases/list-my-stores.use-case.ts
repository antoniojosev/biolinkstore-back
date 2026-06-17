import { Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

export interface MyStoreListItem {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  isActive: boolean;
  plan: Plan | null;
}

@Injectable()
export class ListMyStoresUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<MyStoreListItem[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activeStoreId: true },
    });

    const stores = await this.prisma.store.findMany({
      where: { ownerId: userId },
      include: { subscription: true },
      orderBy: { createdAt: 'asc' },
    });

    return stores.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      logo: s.logo,
      isActive: user?.activeStoreId === s.id,
      plan: s.subscription?.plan ?? null,
    }));
  }
}
