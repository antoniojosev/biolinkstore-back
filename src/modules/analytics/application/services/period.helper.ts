import { BadRequestException } from '@nestjs/common';

export type PeriodKey = '7d' | '30d' | '90d';

const VALID_PERIODS: ReadonlySet<PeriodKey> = new Set(['7d', '30d', '90d']);
const PERIOD_DAYS: Record<PeriodKey, number> = { '7d': 7, '30d': 30, '90d': 90 };

export interface PeriodWindow {
  key: PeriodKey;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
}

export function parsePeriod(raw: string | undefined, fallback: PeriodKey = '30d'): PeriodKey {
  const value = (raw ?? fallback) as PeriodKey;
  if (!VALID_PERIODS.has(value)) {
    throw new BadRequestException(`period must be one of: ${[...VALID_PERIODS].join(', ')}`);
  }
  return value;
}

export function buildWindow(period: PeriodKey, now: Date = new Date()): PeriodWindow {
  const days = PERIOD_DAYS[period];
  const ms = days * 24 * 60 * 60 * 1000;
  const to = now;
  const from = new Date(to.getTime() - ms);
  const prevTo = new Date(from.getTime());
  const prevFrom = new Date(prevTo.getTime() - ms);
  return { key: period, from, to, prevFrom, prevTo };
}

/** Percentage delta with safe handling of zero baseline. */
export function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}
