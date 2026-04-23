import { Inject, Injectable, Logger } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IRateRepository } from '../../domain/repositories/rate.repository.interface';
import { Rate, StoreCustomRate } from '../../domain/entities/rate.entity';
import { FormulaParserService } from '../../domain/services/formula-parser.service';

const STALE_MS = 4 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

export type ResolvedRate = {
  code: string;
  label: string;
  baseCurrency: string;
  valueVes: number;
  fetchedAt: Date;
};

@Injectable()
export class RateResolverService {
  private readonly logger = new Logger(RateResolverService.name);

  constructor(
    @Inject(INJECTION_TOKENS.RATE_REPOSITORY)
    private readonly repo: IRateRepository,
    private readonly parser: FormulaParserService,
  ) {}

  /**
   * Retorna el valor actual de una tasa oficial. Si el ultimo snapshot tiene
   * mas de 4h y la tasa tiene sourceUrl, intenta refrescar desde el origen.
   * Si el fetch falla, retorna el ultimo valor disponible.
   */
  async resolveOfficial(code: string): Promise<ResolvedRate | null> {
    const rate = await this.repo.findOfficialByCode(code);
    if (!rate || !rate.isActive) return null;
    const fresh = await this.maybeRefreshOfficial(rate);
    if (fresh == null) return null;
    return {
      code: rate.code,
      label: rate.label,
      baseCurrency: rate.baseCurrency,
      valueVes: fresh.value,
      fetchedAt: fresh.fetchedAt,
    };
  }

  async resolveAllOfficial(): Promise<ResolvedRate[]> {
    const rates = await this.repo.findAllActiveOfficial();
    const out: ResolvedRate[] = [];
    for (const r of rates) {
      const fresh = await this.maybeRefreshOfficial(r);
      if (fresh == null) continue;
      out.push({
        code: r.code,
        label: r.label,
        baseCurrency: r.baseCurrency,
        valueVes: fresh.value,
        fetchedAt: fresh.fetchedAt,
      });
    }
    return out;
  }

  /**
   * Resuelve una custom rate segun su modo:
   *   MANUAL  — retorna valueVes tal cual
   *   FORMULA — evalua contra tasas oficiales resueltas
   *   API     — fetch lazy (>4h) a sourceUrl/sourcePath
   */
  async resolveCustom(custom: StoreCustomRate): Promise<ResolvedRate | null> {
    if (custom.mode === 'MANUAL') {
      if (custom.valueVes == null) return null;
      return this.asResolved(custom, custom.valueVes, custom.lastFetchedAt ?? new Date());
    }
    if (custom.mode === 'FORMULA') {
      if (!custom.formula) return null;
      try {
        const refs = this.parser.refs(custom.formula);
        const vars = new Map<string, number>();
        for (const ref of refs) {
          const offi = await this.resolveOfficial(ref);
          if (!offi) {
            this.logger.warn(`Custom rate ${custom.id} referencia tasa inexistente: ${ref}`);
            return null;
          }
          vars.set(ref, offi.valueVes);
        }
        const value = this.parser.evaluate(custom.formula, vars);
        return this.asResolved(custom, value, new Date());
      } catch (err) {
        this.logger.warn(`Custom rate ${custom.id} formula invalida: ${(err as Error).message}`);
        return null;
      }
    }
    if (custom.mode === 'API') {
      if (!custom.sourceUrl || !custom.sourcePath) return null;
      const fresh = await this.maybeRefreshCustomApi(custom);
      if (fresh == null) return null;
      return this.asResolved(custom, fresh.value, fresh.fetchedAt);
    }
    return null;
  }

  private asResolved(custom: StoreCustomRate, value: number, at: Date): ResolvedRate {
    return {
      code: `CUSTOM_${custom.id}`,
      label: custom.label,
      baseCurrency: custom.baseCurrency,
      valueVes: value,
      fetchedAt: at,
    };
  }

  private isStale(at: Date | null): boolean {
    if (!at) return true;
    return Date.now() - at.getTime() > STALE_MS;
  }

  private async maybeRefreshOfficial(
    rate: Rate,
  ): Promise<{ value: number; fetchedAt: Date } | null> {
    const stale = this.isStale(rate.lastFetchedAt);
    if (!stale && rate.lastValue != null && rate.lastFetchedAt != null) {
      return { value: rate.lastValue, fetchedAt: rate.lastFetchedAt };
    }
    if (rate.sourceUrl && rate.sourcePath) {
      const v = await this.fetchFromSource(rate.sourceUrl, rate.sourcePath);
      if (v != null) {
        await this.repo.saveOfficialSnapshot(rate.code, v);
        return { value: v, fetchedAt: new Date() };
      }
      this.logger.warn(`Fetch fallo para rate ${rate.code}, uso ultimo valor disponible`);
    }
    if (rate.lastValue != null && rate.lastFetchedAt != null) {
      return { value: rate.lastValue, fetchedAt: rate.lastFetchedAt };
    }
    return null;
  }

  private async maybeRefreshCustomApi(
    custom: StoreCustomRate,
  ): Promise<{ value: number; fetchedAt: Date } | null> {
    const stale = this.isStale(custom.lastFetchedAt);
    if (!stale && custom.lastValue != null && custom.lastFetchedAt != null) {
      return { value: custom.lastValue, fetchedAt: custom.lastFetchedAt };
    }
    if (!custom.sourceUrl || !custom.sourcePath) return null;
    const v = await this.fetchFromSource(custom.sourceUrl, custom.sourcePath);
    if (v != null) {
      await this.repo.updateCustomFetch(custom.id, v);
      return { value: v, fetchedAt: new Date() };
    }
    this.logger.warn(`Fetch fallo para custom rate ${custom.id}, uso ultimo valor disponible`);
    if (custom.lastValue != null && custom.lastFetchedAt != null) {
      return { value: custom.lastValue, fetchedAt: custom.lastFetchedAt };
    }
    return null;
  }

  private async fetchFromSource(url: string, path: string): Promise<number | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) return null;
      const json = await res.json();
      return extractPath(json, path);
    } catch {
      return null;
    }
  }
}

function extractPath(obj: unknown, path: string): number | null {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  const num = typeof cur === 'string' ? Number(cur) : (cur as number);
  return Number.isFinite(num) ? Number(num) : null;
}
