import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';

// Domain
import { SlugGeneratorService } from './domain/services/slug-generator.service';

// Application
import { CreateStoreUseCase } from './application/use-cases/create-store.use-case';
import { UpdateStoreUseCase } from './application/use-cases/update-store.use-case';
import { GetStoreUseCase } from './application/use-cases/get-store.use-case';
import { ListUserStoresUseCase } from './application/use-cases/list-user-stores.use-case';
import { DeleteStoreUseCase } from './application/use-cases/delete-store.use-case';
import { GetStoreCountsUseCase } from './application/use-cases/get-store-counts.use-case';

// Infrastructure
import { PrismaStoreRepository } from './infrastructure/persistence/prisma-store.repository';

// Presentation
import { StoresController } from './presentation/controllers/stores.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [StoresController],
  providers: [
    // Domain Services
    SlugGeneratorService,

    // Use Cases
    CreateStoreUseCase,
    UpdateStoreUseCase,
    GetStoreUseCase,
    ListUserStoresUseCase,
    DeleteStoreUseCase,
    GetStoreCountsUseCase,

    // Repository binding
    {
      provide: INJECTION_TOKENS.STORE_REPOSITORY,
      useClass: PrismaStoreRepository,
    },
  ],
  exports: [INJECTION_TOKENS.STORE_REPOSITORY],
})
export class StoresModule {}
