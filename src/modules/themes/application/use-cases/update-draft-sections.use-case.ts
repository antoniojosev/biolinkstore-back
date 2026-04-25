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
import { UpdateDraftSectionsDto } from '../dto/update-draft-sections.dto';
import {
  SectionSchema,
  validateSections,
} from '../services/section-schema-validator.service';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';

const DEFAULT_TEMPLATE_KEY = 'vitrina';

interface DraftEntry {
  tree?: { template?: string; templateVersion?: number; sections?: unknown[] };
  tokens?: unknown;
  updatedAt?: string;
}

@Injectable()
export class UpdateDraftSectionsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_THEME_REPOSITORY)
    private readonly storeThemeRepo: IStoreThemeRepository,
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
    private readonly assembler: StoreThemeAssembler,
  ) {}

  async execute(
    storeId: string,
    dto: UpdateDraftSectionsDto,
  ): Promise<StoreThemeResponseDto> {
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

    // Necesitamos el template activo para validar contra su sectionSchema.
    const activeKey = theme.activeTemplate;
    const template = await this.templateRepo.findActiveByKey(activeKey);
    if (!template) {
      throw new NotFoundException(
        `Active template "${activeKey}" not available in catalog`,
      );
    }

    const schema = (template.sectionSchema || {}) as SectionSchema;
    const result = validateSections(dto.sections, schema);
    if (result.errors.length > 0) {
      throw new BadRequestException({
        message: 'Section validation failed',
        errors: result.errors,
      });
    }

    const drafts = (theme.draftsByTemplate ?? {}) as Record<string, DraftEntry>;
    const current: DraftEntry = drafts[activeKey] ?? {};
    const newTree = {
      template: activeKey,
      templateVersion: template.version,
      sections: result.valid,
    };

    const updatedDrafts: Record<string, DraftEntry> = {
      ...drafts,
      [activeKey]: {
        ...current,
        tree: newTree,
        updatedAt: new Date().toISOString(),
      },
    };

    const updatedTheme = await this.storeThemeRepo.updateDraftSections(
      storeId,
      activeKey,
      updatedDrafts as unknown as Record<string, unknown>,
    );

    return this.assembler.toResponse(updatedTheme);
  }
}
