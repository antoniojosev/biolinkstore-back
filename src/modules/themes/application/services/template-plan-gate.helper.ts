import { Plan } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

/**
 * Plan gating para templates. BE-127 expone `resolveEffectivePlan` en stores module
 * pero no está disponible en la base de este branch (BE-120a parte de pre-BE-127),
 * así que replicamos la lógica acotada al uso de templates.
 *
 * Regla:
 *   - Plan efectivo del store = plan de su Subscription si existe; si no, FREE.
 *   - Templates con planRequired=FREE => todos pueden.
 *   - Templates con planRequired=PRO => PRO o BUSINESS.
 *   - Templates con planRequired=BUSINESS => solo BUSINESS.
 */

const PLAN_LEVEL: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
};

export async function resolveStorePlan(
  prisma: PrismaService,
  storeId: string,
): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({
    where: { storeId },
    select: { plan: true },
  });
  return subscription?.plan ?? Plan.FREE;
}

export function planSatisfiesRequirement(
  storePlan: Plan,
  required: Plan,
): boolean {
  return PLAN_LEVEL[storePlan] >= PLAN_LEVEL[required];
}
