import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * BE-126: lazy in-memory LRU cache for dashboard aggregations.
 * Same shape as the OG image cache (BE-116): bounded size, TTL-based,
 * recency tracked by re-inserting the key on hit. No background refresh —
 * stale entries are recomputed inline on the next read.
 */
@Injectable()
export class AnalyticsCacheService {
  private static readonly MAX_ENTRIES = 500;
  private static readonly DEFAULT_TTL_MS = 5 * 60 * 1000;

  private readonly store = new Map<string, CacheEntry<unknown>>();

  /** Convenience builder so endpoints share the same key shape. */
  buildKey(storeId: string, endpoint: string, period: string, suffix?: string): string {
    return suffix
      ? `${storeId}:${endpoint}:${period}:${suffix}`
      : `${storeId}:${endpoint}:${period}`;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // refresh LRU ordering
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = AnalyticsCacheService.DEFAULT_TTL_MS): void {
    if (this.store.size >= AnalyticsCacheService.MAX_ENTRIES) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Cache-aside helper: if the entry exists and is fresh, return it.
   * Otherwise compute via `loader` and store the result.
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs: number = AnalyticsCacheService.DEFAULT_TTL_MS,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await loader();
    this.set(key, fresh, ttlMs);
    return fresh;
  }
}
