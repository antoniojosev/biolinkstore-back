import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';

// Application - Use Cases
import { GetPublicStoreUseCase } from './application/use-cases/get-public-store.use-case';
import { GetPublicProductsUseCase } from './application/use-cases/get-public-products.use-case';
import { GetPublicProductUseCase } from './application/use-cases/get-public-product.use-case';
import { GetPublicCategoriesUseCase } from './application/use-cases/get-public-categories.use-case';

// Presentation - Controllers
import { PublicStoreController } from './presentation/controllers/public-store.controller';

@Module({
  imports: [StoresModule, ProductsModule, CategoriesModule],
  controllers: [PublicStoreController],
  providers: [
    GetPublicStoreUseCase,
    GetPublicProductsUseCase,
    GetPublicProductUseCase,
    GetPublicCategoriesUseCase,
  ],
})
export class PublicModule {}
