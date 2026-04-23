export class ExchangeRate {
  id: string;
  code: string;
  rate: number;
  source: string;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ExchangeRate>) {
    Object.assign(this, partial);
  }

  isStale(ttlMs: number, now: Date = new Date()): boolean {
    return now.getTime() - this.fetchedAt.getTime() > ttlMs;
  }
}
