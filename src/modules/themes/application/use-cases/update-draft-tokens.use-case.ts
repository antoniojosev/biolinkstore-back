import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { StoreThemeResponseDto } from '../dto/store-theme-response.dto';
import { StoreThemeAssembler } from '../services/store-theme-assembler.service';
import { UpdateDraftTokensBodyDto } from '../dto/update-draft-tokens.dto';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';

const DEFAULT_TEMPLATE_KEY = 'vitrina';

interface DraftEntry {
  tree?: unknown;
  tokens?: Record<string, unknown>;
  updatedAt?: string;
  [k: string]: unknown;
}

/**
 * Deep merge enfocado en objetos planos. Arrays se reemplazan (no se concatenan).
 * Suficiente para tokens estructurados (palette/typography/...).
 */
function deepMergeObjects(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      out[k] !== null &&
      typeof out[k] === 'object' &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMergeObjects(
        out[k] as Record<string, unknown>,
        v as Record<string, unknown>,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

@Injectable()
export class UpdateDraftTokensUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_THEME_REPOSITORY)
    private readonly storeThemeRepo: IStoreThemeRepository,
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
    private readonly assembler: StoreThemeAssembler,
  ) {}

  async execute(
    storeId: string,
    patch: UpdateDraftTokensBodyDto,
  ): Promise<StoreThemeResponseDto> {
    let theme = await this.storeThemeRepo.findByStoreId(storeId);

    if (!theme) {
      // Lazy create con vitrina + drafts vacío. Misma lógica que GET.
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

    const drafts = (theme.draftsByTemplate ?? {}) as Record<string, DraftEntry>;
    const activeKey = theme.activeTemplate;
    const current: DraftEntry = drafts[activeKey] ?? {};
    const currentTokens =
      (current.tokens as Record<string, unknown> | undefined) ?? {};

    const patchObj = patch as unknown as Record<string, unknown>;
    // Sólo aplicamos los campos del root del patch que vinieron presentes.
    const incomingPatch: Record<string, unknown> = {};
    for (const k of Object.keys(patchObj)) {
      if (patchObj[k] !== undefined) {
        incomingPatch[k] = patchObj[k];
      }
    }

    const merged = deepMergeObjects(currentTokens, incomingPatch);

    const updatedDrafts: Record<string, DraftEntry> = {
      ...drafts,
      [activeKey]: {
        ...current,
        tokens: merged,
        updatedAt: new Date().toISOString(),
      },
    };

    const updatedTheme = await this.storeThemeRepo.updateDraftTokens(
      storeId,
      activeKey,
      updatedDrafts as unknown as Record<string, unknown>,
    );

    return this.assembler.toResponse(updatedTheme);
  }
}
