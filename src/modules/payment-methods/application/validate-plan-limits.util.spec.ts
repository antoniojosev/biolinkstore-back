import { ForbiddenException } from '@nestjs/common';
import {
  FREE_MAX_PAYMENT_METHODS,
  enforcePaymentMethodPlanLimit,
} from './validate-plan-limits.util';

describe('enforcePaymentMethodPlanLimit', () => {
  it('exposes FREE limit as a named constant (=1)', () => {
    expect(FREE_MAX_PAYMENT_METHODS).toBe(1);
  });

  it('allows FREE store to create its first payment method (count=0)', () => {
    expect(() => enforcePaymentMethodPlanLimit('FREE', 0)).not.toThrow();
  });

  it('blocks FREE store at exactly the limit (count=FREE_MAX)', () => {
    expect(() => enforcePaymentMethodPlanLimit('FREE', FREE_MAX_PAYMENT_METHODS)).toThrow(
      ForbiddenException,
    );
  });

  it('blocks FREE store above the limit', () => {
    expect(() => enforcePaymentMethodPlanLimit('FREE', 5)).toThrow(ForbiddenException);
  });

  it('error message mentions the limit and points users to PRO', () => {
    try {
      enforcePaymentMethodPlanLimit('FREE', 1);
      fail('expected ForbiddenException');
    } catch (err) {
      const message = (err as ForbiddenException).message;
      expect(message).toMatch(/FREE/);
      expect(message.toLowerCase()).toMatch(/pro/);
    }
  });

  it.each([
    ['PRO', 0],
    ['PRO', 50],
    ['PRO', 9999],
    ['BUSINESS', 0],
    ['BUSINESS', 50],
    ['BUSINESS', 9999],
  ])('does not gate %s plan (count=%i)', (plan, count) => {
    expect(() => enforcePaymentMethodPlanLimit(plan as 'PRO' | 'BUSINESS', count)).not.toThrow();
  });
});
