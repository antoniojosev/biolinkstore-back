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
import { StoreThemeResponseDto } from '../dto/store-theme-response.dto';
import { StoreThemeAssembler } from '../services/store-theme-assembler.service';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';
import {
  planSatisfiesRequirement,
  resolveStorePlan,
} from '../services/template-plan-gate.helper';

const DEFAULT_TEMPLATE_KEY = 'vitrina';
export const MAX_DRAFTS_NON_PUBLISHED = 3;

interface DraftEntry {
  tree?: unknown;
  tokens?: unknown;
  updatedAt?: string;
}

/**
 * Lógica del switch-template:
 *
 *   1. Validar que el template existe y está activo (404 si no).
 *   2. Validar que el plan del store cubre `template.planRequired` (403 si no).
 *   3. Si el draft del template ya existe, simplemente cambiar `activeTemplate`.
 *   4. Si no existe:
 *        a. Si ya hay 3 drafts NO-publishedTemplate, purgar el más antiguo
 *           por updatedAt (excluye al `publishedTemplate` aún si está en el set).
 *        b. Crear entrada nueva con tree/tokens default + updatedAt now.
 *        c. Cambiar `activeTemplate`.
 *
 * Multi-write: drafts + activeTemplate cambian a la vez. Repo usa una sola
 * `update()` que toca ambos campos atómicamente (Prisma garantiza atomicidad
 * de la operación update por sí misma, no se requiere $transaction).
 */
@Injectable()
export class SwitchTemplateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_THEME_REPOSITORY)
    private readonly storeThemeRepo: IStoreThemeRepository,
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
    private readonly prisma: PrismaService,
    private readonly assembler: StoreThemeAssembler,
  ) {}

  async execute(
    storeId: string,
    templateKey: string,
  ): Promise<StoreThemeResponseDto> {
    const targetTemplate = await this.templateRepo.findActiveByKey(templateKey);
    if (!targetTemplate) {
      throw new NotFoundException(`Template not found: ${templateKey}`);
    }

    const storePlan = await resolveStorePlan(this.prisma, storeId);
    if (!planSatisfiesRequirement(storePlan, targetTemplate.planRequired)) {
      throw new ForbiddenException(
        `Plan ${targetTemplate.planRequired} requerido para template ${targetTemplate.key}`,
      );
    }

    let theme = await this.storeThemeRepo.findByStoreId(storeId);
    if (!theme) {
      // Lazy create con vitrina como activo, luego seguimos con la lógica de switch.
      const defaultTemplate =
        await this.templateRepo.findActiveByKey(DEFAULT_TEMPLATE_KEY);
      if (!defaultTemplate) {
        throw new NotFoundException(
          `Default template "${DEFAULT_TEMPLATE_KEY}" not available in catalog`,
        );
      }
      const drafts: Record<string, DraftEntry> = {
        [DEFAULT_TEMPLATE_KEY]: {
          tree: defaultTreeFor(defaultTemplate),
          tokens: defaultTokensFor(defaultTemplate),
          updatedAt: new Date().toISOString(),
        },
      };
      theme = await this.storeThemeRepo.findByStoreIdOrCreate(storeId, {
        activeTemplate: DEFAULT_TEMPLATE_KEY,
        draftsByTemplate: drafts as unknown as Record<string, unknown>,
      });
    }

    const drafts = { ...((theme.draftsByTemplate ?? {}) as Record<string, DraftEntry>) };
    const publishedTemplate = theme.publishedTemplate;

    // Caso 1: el draft del template ya existe — simplemente cambiamos el activo.
    if (drafts[templateKey]) {
      const updated = await this.storeThemeRepo.updateDraftsByTemplateAndActive(
        storeId,
        drafts as unknown as Record<string, unknown>,
        templateKey,
      );
      return this.assembler.toResponse(updated);
    }

    // Caso 2: hay que crear el draft nuevo. Antes, evaluar FIFO.
    const nonPublishedKeys = Object.keys(drafts).filter(
      (k) => k !== publishedTemplate,
    );
    if (nonPublishedKeys.length >= MAX_DRAFTS_NON_PUBLISHED) {
      // Purga el más antiguo de los no-published por updatedAt asc.
      let oldestKey = nonPublishedKeys[0];
      let oldestAt = parseUpdatedAt(drafts[oldestKey]);
      for (const k of nonPublishedKeys.slice(1)) {
        const at = parseUpdatedAt(drafts[k]);
        if (at < oldestAt) {
          oldestAt = at;
          oldestKey = k;
        }
      }
      delete drafts[oldestKey];
    }

    drafts[templateKey] = {
      tree: defaultTreeFor(targetTemplate),
      tokens: defaultTokensFor(targetTemplate),
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.storeThemeRepo.updateDraftsByTemplateAndActive(
      storeId,
      drafts as unknown as Record<string, unknown>,
      templateKey,
    );
    return this.assembler.toResponse(updated);
  }
}

function parseUpdatedAt(entry: DraftEntry | undefined): number {
  if (!entry || typeof entry.updatedAt !== 'string') return 0;
  const ms = Date.parse(entry.updatedAt);
  return Number.isFinite(ms) ? ms : 0;
}
