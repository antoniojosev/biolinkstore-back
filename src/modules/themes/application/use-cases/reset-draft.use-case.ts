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

@Injectable()
export class ResetDraftUseCase {
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
      // Lazy create con vitrina; tras creación, volvemos a leer y aplicamos reset.
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

    const activeKey = theme.activeTemplate;
    const template = await this.templateRepo.findActiveByKey(activeKey);
    if (!template) {
      throw new NotFoundException(
        `Active template "${activeKey}" not available in catalog`,
      );
    }

    let resetTree: unknown;
    let resetTokens: unknown;

    if (
      theme.publishedTemplate === activeKey &&
      theme.publishedTree &&
      theme.publishedTokens
    ) {
      resetTree = theme.publishedTree;
      resetTokens = theme.publishedTokens;
    } else {
      resetTree = defaultTreeFor(template);
      resetTokens = defaultTokensFor(template);
    }

    const drafts = (theme.draftsByTemplate ?? {}) as Record<string, DraftEntry>;
    const updatedDrafts: Record<string, DraftEntry> = {
      ...drafts,
      [activeKey]: {
        tree: resetTree,
        tokens: resetTokens,
        updatedAt: new Date().toISOString(),
      },
    };

    const updated = await this.storeThemeRepo.updateDraftSections(
      storeId,
      activeKey,
      updatedDrafts as unknown as Record<string, unknown>,
    );

    return this.assembler.toResponse(updated);
  }
}
