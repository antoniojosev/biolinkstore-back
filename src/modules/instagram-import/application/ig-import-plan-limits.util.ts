type Plan = 'FREE' | 'PRO' | 'BUSINESS';

/** Cuantos posts recientes se piden a Apify segun el plan de la tienda. */
export const IG_IMPORT_POST_LIMITS: Record<Plan, number> = {
  FREE: 30,
  PRO: 100,
  BUSINESS: 200,
};

export function getIgImportPostLimit(plan: Plan | undefined): number {
  return IG_IMPORT_POST_LIMITS[plan ?? 'FREE'];
}
