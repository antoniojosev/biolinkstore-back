import { AnalyticsCacheService } from './analytics-cache.service';

describe('AnalyticsCacheService', () => {
  let cache: AnalyticsCacheService;

  beforeEach(() => {
    cache = new AnalyticsCacheService();
  });

  it('returns null when key is missing', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('round-trips a value within TTL', () => {
    cache.set('k', { foo: 'bar' });
    expect(cache.get('k')).toEqual({ foo: 'bar' });
  });

  it('expires entries past their TTL', () => {
    jest.useFakeTimers();
    try {
      cache.set('k', 'v', 1000);
      jest.advanceTimersByTime(500);
      expect(cache.get('k')).toBe('v');
      jest.advanceTimersByTime(700);
      expect(cache.get('k')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('reuses cached value via getOrSet', async () => {
    const loader = jest.fn().mockResolvedValue('fresh');
    const first = await cache.getOrSet('k', loader);
    const second = await cache.getOrSet('k', loader);
    expect(first).toBe('fresh');
    expect(second).toBe('fresh');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('builds composite keys consistently', () => {
    expect(cache.buildKey('s1', 'summary', '30d')).toBe('s1:summary:30d');
    expect(cache.buildKey('s1', 'top-products', '30d', 'l10')).toBe('s1:top-products:30d:l10');
  });
});
