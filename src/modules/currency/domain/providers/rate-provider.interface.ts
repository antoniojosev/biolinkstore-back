export interface RateFetchResult {
  rate: number;
  source: string;
}

export interface IRateProvider {
  supports(code: string): boolean;
  fetch(code: string): Promise<RateFetchResult>;
}
