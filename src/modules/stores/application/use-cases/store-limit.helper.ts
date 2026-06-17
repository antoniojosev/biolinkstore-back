import { ForbiddenException } from '@nestjs/common';
import { Plan } from '@prisma/client';

/**
 * BE-127 — Multi-store plan gating.
 *
 * Limites por plan:
 *  - FREE: 1 tienda
 *  - PRO: 3 tiendas
 *  - BUSINESS: ilimitado
 *
 * Plan efectivo del user = plan mas alto entre los stores que ya posee.
 * Si no posee ningun store, se asume FREE (sera FREE en su default subscription
 * apenas cree la primera tienda).
 */
export const STORE_LIMITS: Record<Plan, number> = {
  FREE: 1,
  PRO: 3,
  BUSINESS: Number.POSITIVE_INFINITY,
};

const PLAN_RANK: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
};

/**
 * Devuelve el plan mas alto observado entre las suscripciones del user.
 * FREE como fallback cuando no hay stores aun.
 */
export function resolveEffectivePlan(
  subscriptionPlans: Array<Plan | null | undefined>,
): Plan {
  let best: Plan = Plan.FREE;
  for (const plan of subscriptionPlans) {
    if (!plan) continue;
    if (PLAN_RANK[plan] > PLAN_RANK[best]) best = plan;
  }
  return best;
}

/**
 * Lanza ForbiddenException si la creacion de una nueva tienda excede el limite del plan.
 * Mensaje incluye sugerencia de upgrade especifica al plan actual.
 */
export function validateStoreLimit(
  plan: Plan,
  currentCount: number,
): void {
  const limit = STORE_LIMITS[plan];
  if (currentCount < limit) return;

  if (plan === Plan.FREE) {
    throw new ForbiddenException(
      'Plan FREE permite 1 tienda. Upgrade a PRO para crear hasta 3 tiendas.',
    );
  }
  if (plan === Plan.PRO) {
    throw new ForbiddenException(
      'Plan PRO permite 3 tiendas. Upgrade a BUSINESS para tiendas ilimitadas.',
    );
  }
  // BUSINESS no deberia llegar aqui (limit = Infinity).
  throw new ForbiddenException('Limite de tiendas alcanzado para tu plan actual.');
}
