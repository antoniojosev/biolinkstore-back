import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

@Injectable()
export class ActivateUserStoreUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, storeId: string): Promise<{ activeStoreId: string }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, ownerId: true },
    });

    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { activeStoreId: storeId },
      select: { activeStoreId: true },
    });

    return { activeStoreId: updated.activeStoreId! };
  }
}
