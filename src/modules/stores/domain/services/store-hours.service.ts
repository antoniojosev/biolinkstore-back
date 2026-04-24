import { Injectable } from '@nestjs/common';
import { StoreHours } from '../entities/store-hours.entity';

/**
 * Utilities for reasoning about store operating hours.
 * Defaults to America/Caracas (UTC-4, no DST).
 */
@Injectable()
export class StoreHoursService {
  static readonly DEFAULT_TIMEZONE = 'America/Caracas';

  /**
   * Build a default week (all days closed=false, 09:00-18:00).
   * Used when a store has never set its hours (lazy create).
   */
  buildDefaults(): Array<Pick<StoreHours, 'dayOfWeek' | 'openTime' | 'closeTime' | 'closed'>> {
    return Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: day,
      openTime: '09:00',
      closeTime: '18:00',
      closed: day === 0, // Sunday closed by default
    }));
  }

  /**
   * Returns true if the store is currently open according to its hours,
   * evaluated at `now` (defaults to current time) in the given timezone.
   */
  isStoreOpenNow(
    hours: StoreHours[],
    timezone: string = StoreHoursService.DEFAULT_TIMEZONE,
    now: Date = new Date(),
  ): boolean {
    if (!hours || hours.length === 0) return false;

    const { dayOfWeek, minutesOfDay } = this.getLocalDayAndMinutes(now, timezone);
    const today = hours.find((h) => h.dayOfWeek === dayOfWeek);

    if (!today || today.closed) return false;

    const open = this.parseMinutes(today.openTime);
    const close = this.parseMinutes(today.closeTime);

    if (open === null || close === null) return false;

    // Handle overnight hours (e.g., 18:00-02:00): close wraps to next day.
    if (close <= open) {
      return minutesOfDay >= open || minutesOfDay < close;
    }

    return minutesOfDay >= open && minutesOfDay < close;
  }

  private parseMinutes(hhmm: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  private getLocalDayAndMinutes(
    date: Date,
    timezone: string,
  ): { dayOfWeek: number; minutesOfDay: number } {
    // Use Intl to get weekday and time components in target timezone.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const weekdayRaw = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
    const hourRaw = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minuteRaw = parts.find((p) => p.type === 'minute')?.value ?? '00';

    const dayOfWeek = weekdayMap[weekdayRaw] ?? 0;
    const hour = Number(hourRaw) % 24; // Intl can return "24" at midnight in some locales
    const minute = Number(minuteRaw);

    return { dayOfWeek, minutesOfDay: hour * 60 + minute };
  }
}
