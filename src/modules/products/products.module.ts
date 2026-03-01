import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '@/modules/stores/stores.module';

// Domain Services
import { VariantGeneratorService } from './domain/services/variant-generator.service';

// Application - Use Cases
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { DuplicateProductUseCase } from './application/use-cases/duplicate-product.use-case';
import { CreateVariantUseCase } from './application/use-cases/create-variant.use-case';
import { UpdateVariantUseCase } from './application/use-cases/update-variant.use-case';
import { DeleteVariantUseCase } from './application/use-cases/delete-variant.use-case';

// Infrastructure - Repositories
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { PrismaVariantRepository } from './infrastructure/persistence/prisma-variant.repository';

// Presentation - Controllers
import { ProductsController } from './presentation/controllers/products.controller';
import { VariantsController } from './presentation/controllers/variants.controller';

@Module({
  imports: [DatabaseModule, StoresModule],
  controllers: [ProductsController, VariantsController],
  providers: [
    // Domain Services
    VariantGeneratorService,

    // Use Cases
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
    DuplicateProductUseCase,
    CreateVariantUseCase,
    UpdateVariantUseCase,
    DeleteVariantUseCase,

    // Repository Bindings
    {
      provide: INJECTION_TOKENS.PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: INJECTION_TOKENS.VARIANT_REPOSITORY,
      useClass: PrismaVariantRepository,
    },
  ],
  exports: [
    INJECTION_TOKENS.PRODUCT_REPOSITORY,
    INJECTION_TOKENS.VARIANT_REPOSITORY,
    VariantGeneratorService,
  ],
})
export class ProductsModule {}
