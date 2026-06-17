import { ForbiddenException } from '@nestjs/common';
import { Plan } from '@prisma/client';

export const TEAM_LIMITS: Record<Plan, number> = {
  FREE: 1,
  PRO: 3,
  BUSINESS: Infinity,
};

export function validateTeamLimit(plan: Plan, currentMemberCount: number): void {
  const limit = TEAM_LIMITS[plan];
  if (currentMemberCount >= limit) {
    if (plan === 'FREE') {
      throw new ForbiddenException(
        'Plan FREE permite 1 miembro (solo el dueno). Upgrade a PRO para invitar.',
      );
    }
    if (plan === 'PRO') {
      throw new ForbiddenException(
        'Plan PRO permite 3 miembros. Upgrade a BUSINESS para mas.',
      );
    }
  }
}
