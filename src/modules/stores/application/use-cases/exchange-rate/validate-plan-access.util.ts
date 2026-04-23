import { ForbiddenException } from '@nestjs/common';

type Plan = 'FREE' | 'PRO' | 'BUSINESS';

export function enforceManualRateAccess(plan: Plan | undefined): void {
  if (!plan || plan === 'FREE') {
    throw new ForbiddenException(
      'Plan FREE solo admite tasa automatica (BCV). Mejora a Pro para fijar tasa manual.',
    );
  }
}
