import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { StoreThemeResponseDto } from '../dto/store-theme-response.dto';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';
import { StoreThemeAssembler } from '../services/store-theme-assembler.service';

const DEFAULT_TEMPLATE_KEY = 'vitrina';

@Injectable()
export class GetStoreThemeUseCase {
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
        // El catálogo siempre debe tener "vitrina" como FREE base. Si no está,
        // es un error de seed/configuración del entorno; expone 404 explícito.
        throw new NotFoundException(
          `Default template "${DEFAULT_TEMPLATE_KEY}" not available in catalog`,
        );
      }

      const tree = defaultTreeFor(defaultTemplate);
      const tokens = defaultTokensFor(defaultTemplate);
      const now = new Date().toISOString();

      const drafts: Record<string, unknown> = {
        [DEFAULT_TEMPLATE_KEY]: {
          tree,
          tokens,
          updatedAt: now,
        },
      };

      theme = await this.storeThemeRepo.findByStoreIdOrCreate(storeId, {
        activeTemplate: DEFAULT_TEMPLATE_KEY,
        draftsByTemplate: drafts,
      });
    }

    return this.assembler.toResponse(theme);
  }
}
