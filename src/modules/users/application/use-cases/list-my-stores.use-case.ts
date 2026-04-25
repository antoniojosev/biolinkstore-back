import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { ListMyStoresResponseDto } from '../dto/list-my-stores-response.dto';
import { StoreItemDto } from '../dto/store-item.dto';

/**
 * BE-127 — Lista las tiendas del user con flag `isActive` y `activeStoreId`.
 *
 * Comportamiento `activeStoreId`:
 *  - Si `User.activeStoreId` apunta a un store que el user posee, se usa.
 *  - Si esta NULL pero el user tiene tiendas, se promueve la primera por
 *    `createdAt` y se persiste `User.activeStoreId` (auto-heal).
 *  - Si no tiene tiendas, devuelve `activeStoreId: null` y lista vacia.
 *  - Si `activeStoreId` apunta a un store que ya no existe (race con DELETE),
 *    el FK ON DELETE SET NULL deja el campo en NULL — caemos al caso anterior.
 *  - Si apunta a un store que el user ya no posee (no deberia pasar — el user
 *    es el unico owner), se trata como NULL y se promueve la primera.
 */
export interface MyStoreListItem extends StoreItemDto {}

@Injectable()
export class ListMyStoresUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<ListMyStoresResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activeStoreId: true },
    });

    const stores = await this.prisma.store.findMany({
      where: { ownerId: userId },
      include: { subscription: true },
      orderBy: { createdAt: 'asc' },
    });

    if (stores.length === 0) {
      return { stores: [], activeStoreId: null };
    }

    const ownedIds = new Set(stores.map((s) => s.id));
    let activeStoreId = user?.activeStoreId ?? null;

    if (!activeStoreId || !ownedIds.has(activeStoreId)) {
      // Auto-heal: el user tiene tiendas pero ninguna activa explicita.
      activeStoreId = stores[0].id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { activeStoreId },
      });
    }

    const items: StoreItemDto[] = stores.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      logo: s.logo,
      plan: s.subscription?.plan ?? null,
      isActive: s.id === activeStoreId,
    }));

    return { stores: items, activeStoreId };
  }
}
