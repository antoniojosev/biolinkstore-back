import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { CurrencyModule } from '@/modules/currency/currency.module';

// Domain
import { SlugGeneratorService } from './domain/services/slug-generator.service';
import { WhatsappTemplateEngine } from './domain/services/whatsapp-template.engine';
import { StoreHoursService } from './domain/services/store-hours.service';

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
import { GetStoreHoursUseCase } from './application/use-cases/hours/get-store-hours.use-case';
import { UpdateStoreHoursUseCase } from './application/use-cases/hours/update-store-hours.use-case';
import { RegisterDomainUseCase } from './application/use-cases/domain/register-domain.use-case';
import { GetDomainUseCase } from './application/use-cases/domain/get-domain.use-case';
import { VerifyDomainUseCase } from './application/use-cases/domain/verify-domain.use-case';
import { DeleteDomainUseCase } from './application/use-cases/domain/delete-domain.use-case';

// Infrastructure
import { PrismaStoreRepository } from './infrastructure/persistence/prisma-store.repository';
import { PrismaStoreHoursRepository } from './infrastructure/persistence/prisma-store-hours.repository';
import { PrismaStoreDomainRepository } from './infrastructure/persistence/prisma-store-domain.repository';
import { NodeDnsTxtResolver } from './infrastructure/dns/node-dns-txt-resolver';

// Presentation
import { StoresController } from './presentation/controllers/stores.controller';
import { WhatsappTemplateController } from './presentation/controllers/whatsapp-template.controller';
import { ExchangeRateConfigController } from './presentation/controllers/exchange-rate-config.controller';
import { StoreHoursController } from './presentation/controllers/store-hours.controller';
import { ExchangeRateHistoryController } from './presentation/controllers/exchange-rate-history.controller';
import { StoreDomainController } from './presentation/controllers/store-domain.controller';

@Module({
  imports: [DatabaseModule, CurrencyModule],
  controllers: [
    StoresController,
    WhatsappTemplateController,
    ExchangeRateConfigController,
    StoreHoursController,
    ExchangeRateHistoryController,
    StoreDomainController,
  ],
  providers: [
    // Domain Services
    SlugGeneratorService,
    WhatsappTemplateEngine,
    StoreHoursService,

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
    GetStoreHoursUseCase,
    UpdateStoreHoursUseCase,
    RegisterDomainUseCase,
    GetDomainUseCase,
    VerifyDomainUseCase,
    DeleteDomainUseCase,

    // Repository bindings
    {
      provide: INJECTION_TOKENS.STORE_REPOSITORY,
      useClass: PrismaStoreRepository,
    },
    {
      provide: INJECTION_TOKENS.STORE_HOURS_REPOSITORY,
      useClass: PrismaStoreHoursRepository,
    },
    {
      provide: INJECTION_TOKENS.STORE_DOMAIN_REPOSITORY,
      useClass: PrismaStoreDomainRepository,
    },
    {
      provide: INJECTION_TOKENS.DNS_TXT_RESOLVER,
      useClass: NodeDnsTxtResolver,
    },

    // Direct repository for controller
    PrismaStoreRepository,
  ],
  exports: [
    INJECTION_TOKENS.STORE_REPOSITORY,
    INJECTION_TOKENS.STORE_HOURS_REPOSITORY,
    INJECTION_TOKENS.STORE_DOMAIN_REPOSITORY,
    PrismaStoreRepository,
    WhatsappTemplateEngine,
    StoreHoursService,
  ],
})
export class StoresModule {}
