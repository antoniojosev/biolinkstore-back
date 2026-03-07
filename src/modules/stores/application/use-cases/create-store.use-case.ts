import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { SlugGeneratorService } from '../../domain/services/slug-generator.service';
import { CreateStoreDto } from '../dto/create-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreMapper } from '../mappers/store.mapper';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Plan, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class CreateStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly slugGeneratorService: SlugGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: CreateStoreDto): Promise<StoreResponseDto> {
    // Use username as slug if provided, otherwise generate from name
    const slug = dto.username ?? await this.slugGeneratorService.generateUniqueSlug(dto.name);

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
}
