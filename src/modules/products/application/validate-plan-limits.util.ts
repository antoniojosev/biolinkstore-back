import { ForbiddenException } from '@nestjs/common';

type Plan = 'FREE' | 'PRO' | 'BUSINESS';

export const PLAN_PRODUCT_LIMITS: Record<Plan, number> = {
  FREE: 10,
  PRO: 100,
  BUSINESS: Number.POSITIVE_INFINITY,
};

export function enforceProductLimit(
  plan: Plan | undefined,
  currentCount: number,
): void {
  const effectivePlan: Plan = plan ?? 'FREE';
  const limit = PLAN_PRODUCT_LIMITS[effectivePlan];
  if (currentCount >= limit) {
    throw new ForbiddenException(
      `Plan ${effectivePlan} permite hasta ${limit} productos. Mejora de plan para agregar mas.`,
    );
  }
}
