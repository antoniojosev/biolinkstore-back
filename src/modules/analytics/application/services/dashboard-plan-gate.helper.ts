import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';

/**
 * Endpoints for the dashboard analytics surface (BE-126).
 * - SUMMARY / TOP_PRODUCTS: available on every plan (FREE included).
 * - FUNNEL / SOURCES: PRO and BUSINESS only.
 */
export type AnalyticsEndpoint = 'summary' | 'top-products' | 'funnel' | 'sources';

const FREE_ENDPOINTS: ReadonlySet<AnalyticsEndpoint> = new Set(['summary', 'top-products']);

@Injectable()
export class DashboardPlanGate {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async assertAllowed(storeId: string, endpoint: AnalyticsEndpoint): Promise<Plan> {
    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const plan = store.subscription?.plan ?? Plan.FREE;
    if (plan === Plan.PRO || plan === Plan.BUSINESS) return plan;
    if (FREE_ENDPOINTS.has(endpoint)) return plan;

    throw new ForbiddenException(
      `Analytics endpoint "${endpoint}" requires PRO or BUSINESS plan.`,
    );
  }
}
