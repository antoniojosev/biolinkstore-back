import { ForbiddenException } from '@nestjs/common';

export const FREE_MAX_PAYMENT_METHODS = 1;

type Plan = 'FREE' | 'PRO' | 'BUSINESS';

export function enforcePaymentMethodPlanLimit(plan: Plan, currentCount: number): void {
  if (plan === 'FREE' && currentCount >= FREE_MAX_PAYMENT_METHODS) {
    throw new ForbiddenException(
      `Plan FREE permite solo ${FREE_MAX_PAYMENT_METHODS} metodo de pago. Mejora a Pro para metodos ilimitados.`,
    );
  }
}
