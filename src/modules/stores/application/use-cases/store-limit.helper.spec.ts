import { ForbiddenException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import {
  STORE_LIMITS,
  resolveEffectivePlan,
  validateStoreLimit,
} from './store-limit.helper';

describe('store-limit.helper (BE-127)', () => {
  describe('STORE_LIMITS', () => {
    it('FREE=1, PRO=3, BUSINESS=Infinity', () => {
      expect(STORE_LIMITS[Plan.FREE]).toBe(1);
      expect(STORE_LIMITS[Plan.PRO]).toBe(3);
      expect(STORE_LIMITS[Plan.BUSINESS]).toBe(Number.POSITIVE_INFINITY);
    });
  });

  describe('resolveEffectivePlan', () => {
    it('lista vacia -> FREE', () => {
      expect(resolveEffectivePlan([])).toBe(Plan.FREE);
    });

    it('todos null -> FREE', () => {
      expect(resolveEffectivePlan([null, null, undefined])).toBe(Plan.FREE);
    });

    it('mix FREE+PRO -> PRO', () => {
      expect(resolveEffectivePlan([Plan.FREE, Plan.PRO, Plan.FREE])).toBe(Plan.PRO);
    });

    it('mix con BUSINESS -> BUSINESS', () => {
      expect(
        resolveEffectivePlan([Plan.FREE, Plan.PRO, Plan.BUSINESS]),
      ).toBe(Plan.BUSINESS);
    });

    it('solo BUSINESS -> BUSINESS', () => {
      expect(resolveEffectivePlan([Plan.BUSINESS])).toBe(Plan.BUSINESS);
    });
  });

  describe('validateStoreLimit', () => {
    it('FREE con 0 stores no lanza', () => {
      expect(() => validateStoreLimit(Plan.FREE, 0)).not.toThrow();
    });

    it('FREE con 1 store lanza con mensaje PRO', () => {
      expect(() => validateStoreLimit(Plan.FREE, 1)).toThrow(ForbiddenException);
      try {
        validateStoreLimit(Plan.FREE, 1);
      } catch (e: any) {
        expect(e.message).toMatch(/PRO/);
      }
    });

    it('PRO con 2 stores no lanza', () => {
      expect(() => validateStoreLimit(Plan.PRO, 2)).not.toThrow();
    });

    it('PRO con 3 stores lanza con mensaje BUSINESS', () => {
      expect(() => validateStoreLimit(Plan.PRO, 3)).toThrow(ForbiddenException);
      try {
        validateStoreLimit(Plan.PRO, 3);
      } catch (e: any) {
        expect(e.message).toMatch(/BUSINESS/);
      }
    });

    it('BUSINESS con 1000 stores no lanza', () => {
      expect(() => validateStoreLimit(Plan.BUSINESS, 1000)).not.toThrow();
    });
  });
});
