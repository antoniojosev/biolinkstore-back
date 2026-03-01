import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '@/modules/stores/stores.module';

// Application - Use Cases
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';

// Infrastructure - Repositories
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma-category.repository';

// Presentation - Controllers
import { CategoriesController } from './presentation/controllers/categories.controller';

@Module({
  imports: [DatabaseModule, StoresModule],
  controllers: [CategoriesController],
  providers: [
    // Use Cases
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    GetCategoryUseCase,
    ListCategoriesUseCase,

    // Repository Binding
    {
      provide: INJECTION_TOKENS.CATEGORY_REPOSITORY,
      useClass: PrismaCategoryRepository,
    },
  ],
  exports: [INJECTION_TOKENS.CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
