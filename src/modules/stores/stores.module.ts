import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { CurrencyModule } from '@/modules/currency/currency.module';

// Domain
import { SlugGeneratorService } from './domain/services/slug-generator.service';
import { WhatsappTemplateEngine } from './domain/services/whatsapp-template.engine';

// Application
import { CreateStoreUseCase } from './application/use-cases/create-store.use-case';
import { UpdateStoreUseCase } from './application/use-cases/update-store.use-case';
import { GetStoreUseCase } from './application/use-cases/get-store.use-case';
import { ListUserStoresUseCase } from './application/use-cases/list-user-stores.use-case';
import { DeleteStoreUseCase } from './application/use-cases/delete-store.use-case';
import { GetStoreCountsUseCase } from './application/use-cases/get-store-counts.use-case';
import { GetWhatsappTemplateUseCase } from './application/use-cases/whatsapp/get-whatsapp-template.use-case';
import { UpdateWhatsappTemplateUseCase } from './application/use-cases/whatsapp/update-whatsapp-template.use-case';
import { PreviewWhatsappTemplateUseCase } from './application/use-cases/whatsapp/preview-whatsapp-template.use-case';
import { GetExchangeRateConfigUseCase } from './application/use-cases/exchange-rate/get-exchange-rate-config.use-case';
import { UpdateExchangeRateConfigUseCase } from './application/use-cases/exchange-rate/update-exchange-rate-config.use-case';

// Infrastructure
import { PrismaStoreRepository } from './infrastructure/persistence/prisma-store.repository';

// Presentation
import { StoresController } from './presentation/controllers/stores.controller';
import { WhatsappTemplateController } from './presentation/controllers/whatsapp-template.controller';
import { ExchangeRateConfigController } from './presentation/controllers/exchange-rate-config.controller';

@Module({
  imports: [DatabaseModule, CurrencyModule],
  controllers: [StoresController, WhatsappTemplateController, ExchangeRateConfigController],
  providers: [
    // Domain Services
    SlugGeneratorService,
    WhatsappTemplateEngine,

    // Use Cases
    CreateStoreUseCase,
    UpdateStoreUseCase,
    GetStoreUseCase,
    ListUserStoresUseCase,
    DeleteStoreUseCase,
    GetStoreCountsUseCase,
    GetWhatsappTemplateUseCase,
    UpdateWhatsappTemplateUseCase,
    PreviewWhatsappTemplateUseCase,
    GetExchangeRateConfigUseCase,
    UpdateExchangeRateConfigUseCase,

    // Repository binding
    {
      provide: INJECTION_TOKENS.STORE_REPOSITORY,
      useClass: PrismaStoreRepository,
    },

    // Direct repository for controller
    PrismaStoreRepository,
  ],
  exports: [INJECTION_TOKENS.STORE_REPOSITORY, PrismaStoreRepository, WhatsappTemplateEngine],
})
export class StoresModule {}
