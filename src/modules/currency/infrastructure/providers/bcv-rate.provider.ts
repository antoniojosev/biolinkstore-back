import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  IRateProvider,
  RateFetchResult,
} from '../../domain/providers/rate-provider.interface';

const BCV_URL = 'https://www.bcv.org.ve/';

const CODE_TO_SELECTOR: Record<string, string> = {
  USD_BCV: 'dolar',
  EUR_BCV: 'euro',
};

@Injectable()
export class BcvRateProvider implements IRateProvider {
  private readonly logger = new Logger(BcvRateProvider.name);

  supports(code: string): boolean {
    return code in CODE_TO_SELECTOR;
  }

  async fetch(code: string): Promise<RateFetchResult> {
    const selector = CODE_TO_SELECTOR[code];
    if (!selector) {
      throw new ServiceUnavailableException(`Unsupported rate code ${code}`);
    }

    const html = await this.fetchHtml(BCV_URL);
    const rate = this.extractRate(html, selector);
    if (rate === null) {
      throw new ServiceUnavailableException(`BCV rate ${code} not found in response`);
    }

    return { rate, source: BCV_URL };
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ByLink/1.0 (+https://bylink.app)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        throw new ServiceUnavailableException(`BCV responded ${res.status}`);
      }
      return await res.text();
    } catch (err) {
      this.logger.error(`BCV fetch failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('BCV unreachable');
    }
  }

  private extractRate(html: string, selector: string): number | null {
    const blockRe = new RegExp(
      `<div[^>]+id=["']${selector}["'][\\s\\S]*?<strong>\\s*([\\d.,]+)\\s*</strong>`,
      'i',
    );
    const match = blockRe.exec(html);
    if (!match) return null;
    const normalized = match[1].replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}
