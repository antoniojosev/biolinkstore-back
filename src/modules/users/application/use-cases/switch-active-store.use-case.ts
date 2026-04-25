import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { SwitchStoreResponseDto } from '../dto/switch-store-response.dto';

/**
 * BE-127 — Cambia el store activo del user.
 *
 * Reglas:
 *  - Store debe existir (404).
 *  - Store debe pertenecer al user autenticado (403).
 *  - Persiste `User.activeStoreId` y devuelve el store con flag `isActive=true`.
 */
@Injectable()
export class SwitchActiveStoreUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, storeId: string): Promise<SwitchStoreResponseDto> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { subscription: true },
    });

    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeStoreId: storeId },
    });

    return {
      activeStoreId: storeId,
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
        logo: store.logo,
        plan: store.subscription?.plan ?? null,
        isActive: true,
      },
    };
  }
}
