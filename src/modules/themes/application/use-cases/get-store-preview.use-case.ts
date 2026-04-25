import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { Template } from '../../domain/entities/template.entity';
import { StoreTheme } from '../../domain/entities/store-theme.entity';
import { StorePreviewResponseDto } from '../dto/store-preview-response.dto';
import { GetStoreRealDataHelper } from '../services/get-store-real-data.helper';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';
import {
  planSatisfiesRequirement,
  resolveStorePlan,
} from '../services/template-plan-gate.helper';
import {
  MigratorTree,
  migrateTreeToCurrentVersion,
} from '../services/theme-version-migrator.service';

const DEFAULT_TEMPLATE_KEY = 'vitrina';

interface DraftEntry {
  tree?: unknown;
  tokens?: unknown;
  updatedAt?: string;
}

/**
 * GET /stores/:storeId/theme/preview?template=X — preview con datos REALES.
 *
 * Lógica (lectura pura, NUNCA escribe a DB):
 *
 *   1. Lazy-create del StoreTheme si no existe (mismo patrón que BE-120b/c).
 *      Aunque crear es una escritura, este patrón ya está aceptado por el
 *      módulo: el preview no escribe MÁS allá del lazy-create estructural
 *      necesario para que el editor funcione consistente.
 *
 *      → Decisión BE-120d: para mantener "lectura pura" según el spec del
 *        ticket, NO usamos lazy-create aquí. Si el theme no existe, sintetizamos
 *        en memoria desde defaults del template pedido (o vitrina). Esto evita
 *        write-amplification y deja el preview como GET puro 100%.
 *
 *   2. Determinar template a previewar:
 *      - Si query.template está → usarlo. 404 si no existe/inactivo.
 *      - Si no, usar theme.activeTemplate. Si activeTemplate ya no existe
 *        en el catálogo → caer a vitrina y reportar `fallbackFromInvalidActive`.
 *
 *   3. Plan-gating SIEMPRE: validar que el plan del store cubre
 *      `template.planRequired`. 403 si insuficiente.
 *
 *   4. Determinar draft:
 *      - Si theme existe y `draftsByTemplate[templateKey]` está → usar ese.
 *        `isDraft=true`. Aplicar migración lazy si templateVersion del tree
 *        está atrás del catálogo. Migración solo en memoria.
 *      - Si no → construir defaults `defaultTreeFor + defaultTokensFor`.
 *        `isDraft=false`. No persistir.
 *
 *   5. Cargar data real (store + products + categories visibles) vía helper.
 *      404 si el store no existe (NotFoundException del helper).
 *
 *   6. Si productos reales count=0 → fallback a `template.demoDataJson.products`.
 *      `mode='demo-fallback'`. Misma lógica para categorías. Store SIEMPRE real.
 */
@Injectable()
export class GetStorePreviewUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_THEME_REPOSITORY)
    private readonly storeThemeRepo: IStoreThemeRepository,
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
    private readonly prisma: PrismaService,
    private readonly realData: GetStoreRealDataHelper,
  ) {}

  async execute(
    storeId: string,
    queryTemplate?: string,
  ): Promise<StorePreviewResponseDto> {
    // 1. Cargar theme (NO lazy-create — lectura pura).
    const theme = await this.storeThemeRepo.findByStoreId(storeId);

    // 2. Resolver template a previewar.
    const resolution = await this.resolveTemplate(theme, queryTemplate);
    const target = resolution.template;
    const fallbackFromInvalidActive = resolution.fallbackFromInvalidActive;

    // 3. Plan gating SIEMPRE (incluye query y default).
    const storePlan = await resolveStorePlan(this.prisma, storeId);
    if (!planSatisfiesRequirement(storePlan, target.planRequired)) {
      throw new ForbiddenException(
        `Plan ${target.planRequired} requerido para template ${target.key}`,
      );
    }

    // 4. Resolver draft (persistido o sintetizado).
    const drafted = this.resolveDraftOrDefaults(theme, target);

    // 5. Cargar data real (404 propagado si store no existe).
    const real = await this.realData.execute(storeId);

    // 6. Fallback a demoData si no hay productos/categorías reales.
    const demo = (target.demoDataJson || {}) as {
      products?: unknown[];
      categories?: unknown[];
    };
    const hasRealProducts = real.products.length > 0;
    const hasRealCategories = real.categories.length > 0;

    const products: unknown[] = hasRealProducts
      ? real.products
      : Array.isArray(demo.products)
        ? demo.products
        : [];
    const categories: unknown[] = hasRealCategories
      ? real.categories
      : Array.isArray(demo.categories)
        ? demo.categories
        : [];

    // mode: si productos vienen de demoData (no había reales), es demo-fallback.
    // Categorías siguen la misma señal de "realidad" del store; usamos productos
    // como driver principal (criterio del spec: "si el store NO tiene productos").
    const mode: 'live' | 'demo-fallback' = hasRealProducts
      ? 'live'
      : 'demo-fallback';

    const isActiveTemplate =
      !!theme && theme.activeTemplate === target.key && !fallbackFromInvalidActive;

    return {
      mode,
      template: target.key,
      templateVersion:
        typeof drafted.tree?.templateVersion === 'number'
          ? drafted.tree.templateVersion
          : target.version,
      store: real.store,
      products,
      categories,
      tree: drafted.tree,
      tokens: drafted.tokens,
      isDraft: drafted.isDraft,
      isActiveTemplate,
      ...(fallbackFromInvalidActive
        ? { fallbackFromInvalidActive }
        : {}),
    };
  }

  /**
   * Determina qué template hay que previewar y reporta si caímos a vitrina
   * por activeTemplate inválido.
   */
  private async resolveTemplate(
    theme: StoreTheme | null,
    queryTemplate: string | undefined,
  ): Promise<{ template: Template; fallbackFromInvalidActive?: string }> {
    if (queryTemplate) {
      const explicit = await this.templateRepo.findActiveByKey(queryTemplate);
      if (!explicit) {
        throw new NotFoundException(`Template not found: ${queryTemplate}`);
      }
      return { template: explicit };
    }

    // Sin query: usar activeTemplate del theme, si lo hay y existe en catálogo.
    if (theme?.activeTemplate) {
      const active = await this.templateRepo.findActiveByKey(theme.activeTemplate);
      if (active) {
        return { template: active };
      }
      // activeTemplate ya no está en el catálogo → caemos a vitrina y reportamos.
      const vitrina = await this.requireDefaultTemplate();
      return {
        template: vitrina,
        fallbackFromInvalidActive: theme.activeTemplate,
      };
    }

    // Theme aún no existe → usar default vitrina.
    const fallback = await this.requireDefaultTemplate();
    return { template: fallback };
  }

  private async requireDefaultTemplate(): Promise<Template> {
    const vitrina = await this.templateRepo.findActiveByKey(DEFAULT_TEMPLATE_KEY);
    if (vitrina) return vitrina;
    // Fallback secundario consistente con GetPublicStoreThemeUseCase.
    const list = await this.templateRepo.findActive({});
    if (list.length === 0) {
      throw new NotFoundException(
        `No active template available (catalog empty)`,
      );
    }
    return list[0];
  }

  /**
   * Devuelve el draft del templateKey indicado dentro del theme, o defaults
   * sintetizados si no existe. Aplica migración lazy en memoria si el draft
   * tiene `templateVersion` atrás de la versión actual del template.
   */
  private resolveDraftOrDefaults(
    theme: StoreTheme | null,
    target: Template,
  ): { tree: MigratorTree; tokens: unknown; isDraft: boolean } {
    const drafts = (theme?.draftsByTemplate ?? {}) as Record<string, DraftEntry>;
    const entry = drafts[target.key];

    if (entry && entry.tree && entry.tokens !== undefined) {
      const candidateTree = entry.tree as MigratorTree;
      const migration = migrateTreeToCurrentVersion(candidateTree, target);
      return {
        tree: migration.tree,
        tokens: entry.tokens,
        isDraft: true,
      };
    }

    return {
      tree: defaultTreeFor(target) as unknown as MigratorTree,
      tokens: defaultTokensFor(target),
      isDraft: false,
    };
  }
}
