import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { INJECTION_TOKENS } from '../constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { PLAN_FEATURES } from '../constants/plans';

export const REQUIRED_PLAN_FEATURE = 'requiredPlanFeature';

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<keyof typeof PLAN_FEATURES.FREE>(
      REQUIRED_PLAN_FEATURE,
      context.getHandler(),
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const storeId = request.storeId || request.params.storeId;

    if (!storeId) {
      throw new ForbiddenException('Store ID is required');
    }

    const store = await this.storeRepository.findByIdWithSubscription(storeId);

    if (!store || !store.subscription) {
      throw new ForbiddenException('Store or subscription not found');
    }

    const planFeatures = PLAN_FEATURES[store.subscription.plan];
    const hasFeature = planFeatures[requiredFeature];

    if (!hasFeature) {
      throw new ForbiddenException(
        `This feature requires a higher plan. Current plan: ${store.subscription.plan}`,
      );
    }

    return true;
  }
}
