import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '@/modules/stores/stores.module';

// Use Cases
import { ListTemplatesUseCase } from './application/use-cases/list-templates.use-case';
import { GetTemplateUseCase } from './application/use-cases/get-template.use-case';
import { ListPalettesUseCase } from './application/use-cases/list-palettes.use-case';
import { GetStoreThemeUseCase } from './application/use-cases/get-store-theme.use-case';
import { UpdateDraftTokensUseCase } from './application/use-cases/update-draft-tokens.use-case';
import { UpdateDraftSectionsUseCase } from './application/use-cases/update-draft-sections.use-case';
import { SwitchTemplateUseCase } from './application/use-cases/switch-template.use-case';
import { ResetDraftUseCase } from './application/use-cases/reset-draft.use-case';
import { PublishThemeUseCase } from './application/use-cases/publish-theme.use-case';
import { RollbackThemeUseCase } from './application/use-cases/rollback-theme.use-case';
import { GetPublicStoreThemeUseCase } from './application/use-cases/get-public-store-theme.use-case';

// Services
import { StoreThemeAssembler } from './application/services/store-theme-assembler.service';

// Repositories
import { PrismaTemplateRepository } from './infrastructure/persistence/prisma-template.repository';
import { PrismaPalettePresetRepository } from './infrastructure/persistence/prisma-palette-preset.repository';
import { PrismaStoreThemeRepository } from './infrastructure/persistence/prisma-store-theme.repository';

// Controllers
import { TemplatesController } from './presentation/controllers/templates.controller';
import { PalettesController } from './presentation/controllers/palettes.controller';
import { StoreThemesController } from './presentation/controllers/store-themes.controller';
import { PublicStoreThemeController } from './presentation/controllers/public-store-theme.controller';

@Module({
  imports: [DatabaseModule, StoresModule],
  controllers: [
    TemplatesController,
    PalettesController,
    StoreThemesController,
    PublicStoreThemeController,
  ],
  providers: [
    ListTemplatesUseCase,
    GetTemplateUseCase,
    ListPalettesUseCase,
    GetStoreThemeUseCase,
    UpdateDraftTokensUseCase,
    UpdateDraftSectionsUseCase,
    SwitchTemplateUseCase,
    ResetDraftUseCase,
    PublishThemeUseCase,
    RollbackThemeUseCase,
    GetPublicStoreThemeUseCase,

    StoreThemeAssembler,

    {
      provide: INJECTION_TOKENS.TEMPLATE_REPOSITORY,
      useClass: PrismaTemplateRepository,
    },
    {
      provide: INJECTION_TOKENS.PALETTE_PRESET_REPOSITORY,
      useClass: PrismaPalettePresetRepository,
    },
    {
      provide: INJECTION_TOKENS.STORE_THEME_REPOSITORY,
      useClass: PrismaStoreThemeRepository,
    },
  ],
  exports: [
    INJECTION_TOKENS.TEMPLATE_REPOSITORY,
    INJECTION_TOKENS.PALETTE_PRESET_REPOSITORY,
    INJECTION_TOKENS.STORE_THEME_REPOSITORY,
  ],
})
export class ThemesModule {}
