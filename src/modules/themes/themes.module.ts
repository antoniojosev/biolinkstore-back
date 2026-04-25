import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';

// Use Cases
import { ListTemplatesUseCase } from './application/use-cases/list-templates.use-case';
import { GetTemplateUseCase } from './application/use-cases/get-template.use-case';
import { ListPalettesUseCase } from './application/use-cases/list-palettes.use-case';

// Repositories
import { PrismaTemplateRepository } from './infrastructure/persistence/prisma-template.repository';
import { PrismaPalettePresetRepository } from './infrastructure/persistence/prisma-palette-preset.repository';
import { PrismaStoreThemeRepository } from './infrastructure/persistence/prisma-store-theme.repository';

// Controllers
import { TemplatesController } from './presentation/controllers/templates.controller';
import { PalettesController } from './presentation/controllers/palettes.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplatesController, PalettesController],
  providers: [
    ListTemplatesUseCase,
    GetTemplateUseCase,
    ListPalettesUseCase,

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
