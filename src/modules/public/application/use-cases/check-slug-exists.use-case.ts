import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

export interface SlugExistsContext {
  ip?: string | null;
  referrer?: string | null;
}

export interface SlugExistsResult {
  exists: boolean;
  suggested?: string[];
}

@Injectable()
export class CheckSlugExistsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(slug: string, context: SlugExistsContext = {}): Promise<SlugExistsResult> {
    const normalized = (slug ?? '').trim().toLowerCase();

    const store = await this.storeRepository.findBySlug(normalized);

    if (store) {
      return { exists: true };
    }

    // Fire-and-forget log. Never block response.
    this.prisma.slugMiss
      .create({
        data: {
          slug: normalized,
          ip: context.ip ?? null,
          referrer: context.referrer ?? null,
        },
      })
      .catch(() => {
        // swallow — telemetry only
      });

    const suggested = await this.findSuggestedSlugs(normalized);
    return { exists: false, suggested };
  }

  private async findSuggestedSlugs(slug: string, limit = 5): Promise<string[]> {
    if (slug.length < 2) return [];

    const prefix = slug.slice(0, Math.min(3, slug.length));
    const rows = await this.prisma.store.findMany({
      where: { slug: { startsWith: prefix } },
      select: { slug: true },
      take: 25,
    });

    const scored = rows
      .map((r) => ({ slug: r.slug, distance: CheckSlugExistsUseCase.levenshtein(r.slug, slug) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map((r) => r.slug);

    return scored;
  }

  private static levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const prev = new Array(b.length + 1);
    const curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;

    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  }
}
