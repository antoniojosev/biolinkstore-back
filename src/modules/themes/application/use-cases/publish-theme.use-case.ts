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
 * Publica el draft del template activo:
 *   1. Lazy-create del StoreTheme si no existe (mismo patrón que BE-120b).
 *   2. Si no hay draft para el activeTemplate → 400 "no draft to publish".
 *   3. Snapshot del actual published → rollback (atomic en el repo).
 *   4. Promueve draft → published. publishedTemplate = activeTemplate.
 *   5. publishedAt = now, version += 1.
 *   6. NO borra el draft (el usuario puede seguir editando ese template).
 */
@Injectable()
export class PublishThemeUseCase {
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

    const drafts = (theme.draftsByTemplate ?? {}) as Record<string, DraftEntry>;
    const activeKey = theme.activeTemplate;
    const draft = drafts[activeKey];

    if (!draft || draft.tree === undefined || draft.tokens === undefined) {
      throw new BadRequestException(
        `No draft to publish for template "${activeKey}"`,
      );
    }

    const updated = await this.storeThemeRepo.publish(storeId, {
      publishedTemplate: activeKey,
      publishedTree: draft.tree,
      publishedTokens: draft.tokens,
      // Snapshot del published actual → rollback. Si no había published, dejamos null.
      rollbackTemplate: theme.publishedTemplate,
      rollbackTree: theme.publishedTree ?? null,
      rollbackTokens: theme.publishedTokens ?? null,
      publishedAt: new Date(),
      version: theme.version + 1,
    });

    return this.assembler.toResponse(updated);
  }
}
