import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IStoreViewRepository } from '../../domain/repositories/store-view.repository.interface';
import { StoreAnalyticsResponseDto } from '../dto/track-view.dto';

@Injectable()
export class GetStoreAnalyticsUseCase {
  /**
   * Plans that can see detailed scroll/time metrics. FREE sees basic counts only.
   */
  private static readonly DETAILED_PLANS: Plan[] = [Plan.PRO, Plan.BUSINESS];

  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_VIEW_REPOSITORY)
    private readonly viewRepository: IStoreViewRepository,
  ) {}

  async execute(storeId: string, from?: Date, to?: Date): Promise<StoreAnalyticsResponseDto> {
    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const aggregates = await this.viewRepository.aggregate(storeId, from, to);

    const plan = store.subscription?.plan ?? Plan.FREE;
    const canSeeDetailed = GetStoreAnalyticsUseCase.DETAILED_PLANS.includes(plan);

    return {
      totalViews: aggregates.totalViews,
      uniqueSessions: aggregates.uniqueSessions,
      avgScrollDepth: canSeeDetailed ? aggregates.avgScrollDepth : null,
      avgTimeOnPage: canSeeDetailed ? aggregates.avgTimeOnPage : null,
    };
  }
}
