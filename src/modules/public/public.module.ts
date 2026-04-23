import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { RatesModule } from '../rates/rates.module';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { PrismaModule } from '@/infrastructure/database/prisma/prisma.module';
import { StorageModule } from '@/infrastructure/storage/storage.module';

// Application - Use Cases
import { GetPublicStoreUseCase } from './application/use-cases/get-public-store.use-case';
import { GetPublicProductsUseCase } from './application/use-cases/get-public-products.use-case';
import { GetPublicProductUseCase } from './application/use-cases/get-public-product.use-case';
import { GetPublicCategoriesUseCase } from './application/use-cases/get-public-categories.use-case';
import { GenerateStoreQrUseCase } from './application/use-cases/generate-store-qr.use-case';
import { CheckSlugExistsUseCase } from './application/use-cases/check-slug-exists.use-case';
import { GenerateStoreOgUseCase } from './application/use-cases/generate-store-og.use-case';
import { GetPublicRatesUseCase } from './application/use-cases/get-public-rates.use-case';
import { GetStoreVisibleRatesUseCase } from './application/use-cases/get-store-visible-rates.use-case';

// Presentation - Controllers
import { PublicStoreController } from './presentation/controllers/public-store.controller';

@Module({
  imports: [
    StoresModule,
    ProductsModule,
    CategoriesModule,
    RatesModule,
    DatabaseModule,
    PrismaModule,
    StorageModule,
  ],
  controllers: [PublicStoreController],
  providers: [
    GetPublicStoreUseCase,
    GetPublicProductsUseCase,
    GetPublicProductUseCase,
    GetPublicCategoriesUseCase,
    GenerateStoreQrUseCase,
    CheckSlugExistsUseCase,
    GenerateStoreOgUseCase,
    GetPublicRatesUseCase,
    GetStoreVisibleRatesUseCase,
  ],
})
export class PublicModule {}
