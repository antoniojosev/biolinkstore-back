import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { CreateStoreUseCase } from '@/modules/stores/application/use-cases/create-store.use-case';
import { CreateStoreDto } from '@/modules/stores/application/dto/create-store.dto';
import { StoreResponseDto } from '@/modules/stores/application/dto/store-response.dto';
import {
  resolveEffectivePlan,
  validateStoreLimit,
} from '@/modules/stores/application/use-cases/store-limit.helper';

/**
 * BE-127 — Crea una tienda adicional para el user actual y la marca como activa.
 *
 * Plan gating:
 *  - FREE: 1 tienda
 *  - PRO: 3 tiendas
 *  - BUSINESS: ilimitado
 *
 * Notas:
 *  - El plan-gate se ejecuta una segunda vez en `CreateStoreUseCase`. Lo
 *    duplicamos aqui para fail-fast antes de la transaccion y para que el
 *    mensaje de error sea consistente con la regla de "tiendas adicionales".
 *  - Setea `User.activeStoreId` al recien creado: UX de "acabo de crear,
 *    quiero editarla".
 */
export interface CreateAdditionalStoreResponse {
  store: StoreResponseDto;
  activeStoreId: string;
}

@Injectable()
export class CreateAdditionalStoreUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createStoreUseCase: CreateStoreUseCase,
  ) {}

  async execute(
    userId: string,
    dto: CreateStoreDto,
  ): Promise<CreateAdditionalStoreResponse> {
    // Pre-check plan limit antes de transaccion (mensaje preciso).
    const existing = await this.prisma.store.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        subscription: { select: { plan: true } },
      },
    });

    const plan = resolveEffectivePlan(
      existing.map((s) => s.subscription?.plan ?? null),
    );
    validateStoreLimit(plan, existing.length);

    // Crea la tienda + subscription FREE default (delegado).
    const store = await this.createStoreUseCase.execute(userId, dto);

    // Setear como activa automaticamente — UX inmediata.
    await this.prisma.user.update({
      where: { id: userId },
      data: { activeStoreId: store.id },
    });

    return { store, activeStoreId: store.id };
  }
}
