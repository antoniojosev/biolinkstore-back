import { BadRequestException } from '@nestjs/common';
import { buildWindow, parsePeriod, pctChange } from './period.helper';

describe('period.helper', () => {
  describe('parsePeriod', () => {
    it('returns the value when valid', () => {
      expect(parsePeriod('7d')).toBe('7d');
      expect(parsePeriod('30d')).toBe('30d');
      expect(parsePeriod('90d')).toBe('90d');
    });

    it('falls back to default when undefined', () => {
      expect(parsePeriod(undefined)).toBe('30d');
    });

    it('rejects unknown values', () => {
      expect(() => parsePeriod('365d')).toThrow(BadRequestException);
      expect(() => parsePeriod('abc')).toThrow(BadRequestException);
    });
  });

  describe('buildWindow', () => {
    it('builds 30d window with prev period of equal length', () => {
      const now = new Date('2026-04-24T12:00:00Z');
      const window = buildWindow('30d', now);

      const ms30d = 30 * 24 * 60 * 60 * 1000;
      expect(window.to.getTime()).toBe(now.getTime());
      expect(window.from.getTime()).toBe(now.getTime() - ms30d);
      expect(window.prevTo.getTime()).toBe(window.from.getTime());
      expect(window.prevFrom.getTime()).toBe(window.from.getTime() - ms30d);
    });

    it('uses 7-day window for 7d', () => {
      const now = new Date('2026-04-24T00:00:00Z');
      const window = buildWindow('7d', now);
      const ms7d = 7 * 24 * 60 * 60 * 1000;
      expect(window.from.getTime()).toBe(now.getTime() - ms7d);
    });
  });

  describe('pctChange', () => {
    it('returns 0 when both are zero', () => {
      expect(pctChange(0, 0)).toBe(0);
    });

    it('returns 100 when previous is zero and current positive', () => {
      expect(pctChange(10, 0)).toBe(100);
    });

    it('returns positive delta correctly', () => {
      expect(pctChange(150, 100)).toBe(50);
    });

    it('returns negative delta correctly', () => {
      expect(pctChange(80, 100)).toBe(-20);
    });

    it('rounds to 2 decimals', () => {
      expect(pctChange(33, 100)).toBe(-67);
      expect(pctChange(123, 100)).toBe(23);
    });
  });
});
