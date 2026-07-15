import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '@/modules/stores/stores.module';
import { ProductsModule } from '@/modules/products/products.module';

// Application
import { StartInstagramImportUseCase } from './application/use-cases/start-instagram-import.use-case';
import { PollInstagramImportUseCase } from './application/use-cases/poll-instagram-import.use-case';
import { ProcessInstagramPostUseCase } from './application/use-cases/process-instagram-post.use-case';
import { GetInstagramImportStatusUseCase } from './application/use-cases/get-instagram-import-status.use-case';
import { ImportProcessingLockService } from './application/services/import-processing-lock.service';
import { InstagramImportListener } from './application/listeners/instagram-import.listener';

// Infrastructure
import { PrismaInstagramImportRepository } from './infrastructure/persistence/prisma-instagram-import.repository';
import { ApifyInstagramClient } from './infrastructure/apify/apify-instagram.client';
import { InstagramPostClassifierService } from './infrastructure/ai/instagram-post-classifier.service';

// Presentation
import { InstagramImportController } from './presentation/controllers/instagram-import.controller';

@Module({
  imports: [DatabaseModule, StoresModule, ProductsModule],
  controllers: [InstagramImportController],
  providers: [
    // Use Cases
    StartInstagramImportUseCase,
    PollInstagramImportUseCase,
    ProcessInstagramPostUseCase,
    GetInstagramImportStatusUseCase,

    // Services
    ImportProcessingLockService,
    ApifyInstagramClient,
    InstagramPostClassifierService,

    // Listener (reacciona a 'store.instagram-import.requested', emitido por StoresModule)
    InstagramImportListener,

    // Repository binding
    {
      provide: INJECTION_TOKENS.INSTAGRAM_IMPORT_REPOSITORY,
      useClass: PrismaInstagramImportRepository,
    },
  ],
})
export class InstagramImportModule {}
