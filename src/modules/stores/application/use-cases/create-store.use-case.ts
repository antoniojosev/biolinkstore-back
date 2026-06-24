import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { CreateStoreDto } from '../dto/create-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreMapper } from '../mappers/store.mapper';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Plan, StoreMemberRole, SubscriptionStatus } from '@prisma/client';
import { resolveEffectivePlan, validateStoreLimit } from './store-limit.helper';

@Injectable()
export class CreateStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: CreateStoreDto): Promise<StoreResponseDto> {
    // BE-127: Plan gate — FREE=1, PRO=3, BUSINESS=ilimitado.
    await this.enforceStoreLimit(userId);

    // Use username as slug if provided, otherwise a random temp value
    const slug = dto.username ?? randomUUID().replace(/-/g, '').slice(0, 16);

    // Create store with subscription in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create store
      const store = await tx.store.create({
        data: {
          slug,
          username: dto.username,
          name: dto.name,
          description: dto.description,
          whatsappNumbers: dto.whatsappNumbers ?? [],
          instagramHandle: dto.instagramHandle,
          ownerId: userId,
        },
        include: {
          subscription: true,
        },
      });

      // Create default FREE subscription
      await tx.subscription.create({
        data: {
          storeId: store.id,
          plan: Plan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // BE-131: owner is also the first StoreMember with OWNER role.
      // Without this row the store-members guard rejects the creator (403).
      await tx.storeMember.create({
        data: {
          storeId: store.id,
          userId,
          role: StoreMemberRole.OWNER,
          invitedBy: null,
        },
      });

      // Refetch store with subscription
      const storeWithSubscription = await tx.store.findUnique({
        where: { id: store.id },
        include: { subscription: true },
      });

      return storeWithSubscription!;
    });

    const store = StoreMapper.toDomain(result);
    return StoreMapper.toResponse(store);
  }

  private async enforceStoreLimit(userId: string): Promise<void> {
    const existingStores = await this.prisma.store.findMany({
      where: { ownerId: userId },
      include: { subscription: true },
    });

    const plan = resolveEffectivePlan(
      existingStores.map((s) => s.subscription?.plan ?? null),
    );

    validateStoreLimit(plan, existingStores.length);
  }
}
