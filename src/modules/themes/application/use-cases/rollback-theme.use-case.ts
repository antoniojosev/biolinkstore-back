import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { StoreThemeResponseDto } from '../dto/store-theme-response.dto';
import { StoreThemeAssembler } from '../services/store-theme-assembler.service';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';

const DEFAULT_TEMPLATE_KEY = 'vitrina';

interface DraftEntry {
  tree?: unknown;
  tokens?: unknown;
  updatedAt?: string;
}

/**
 * Rollback al snapshot anterior:
 *   1. Lazy-create del StoreTheme si no existe.
 *   2. Si no hay rollback (rollbackTemplate o rollbackTree null) → 400.
 *   3. Swap atómico published ↔ rollback.
 *   4. NO toca drafts ni activeTemplate.
 *   5. NO incrementa version (rollback ≠ nueva publicación).
 *   6. publishedAt = now (acabamos de re-publicar el snapshot).
 */
@Injectable()
export class RollbackThemeUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_THEME_REPOSITORY)
    private readonly storeThemeRepo: IStoreThemeRepository,
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
    private readonly assembler: StoreThemeAssembler,
  ) {}

  async execute(storeId: string): Promise<StoreThemeResponseDto> {
    let theme = await this.storeThemeRepo.findByStoreId(storeId);

    if (!theme) {
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

    if (
      !theme.rollbackTemplate ||
      theme.rollbackTree === null ||
      theme.rollbackTree === undefined ||
      theme.rollbackTokens === null ||
      theme.rollbackTokens === undefined
    ) {
      throw new BadRequestException('No rollback available');
    }

    // Swap published ↔ rollback. publishedAt = now. version sin cambios.
    const updated = await this.storeThemeRepo.swapRollback(storeId, {
      publishedTemplate: theme.rollbackTemplate,
      publishedTree: theme.rollbackTree,
      publishedTokens: theme.rollbackTokens,
      rollbackTemplate: theme.publishedTemplate,
      rollbackTree: theme.publishedTree ?? null,
      rollbackTokens: theme.publishedTokens ?? null,
      publishedAt: new Date(),
    });

    return this.assembler.toResponse(updated);
  }
}
