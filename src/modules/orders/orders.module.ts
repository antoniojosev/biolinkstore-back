import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';

// Domain Services
import { MessageGeneratorService } from './domain/services/message-generator.service';

// Application - Use Cases
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';

// Infrastructure - Repositories
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';

// Presentation - Controllers
import { OrdersController } from './presentation/controllers/orders.controller';

@Module({
  imports: [DatabaseModule, StoresModule, ProductsModule],
  controllers: [OrdersController],
  providers: [
    // Domain Services
    MessageGeneratorService,

    // Use Cases
    CreateOrderUseCase,
    ListOrdersUseCase,

    // Repository Binding
    {
      provide: INJECTION_TOKENS.ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [INJECTION_TOKENS.ORDER_REPOSITORY],
})
export class OrdersModule {}
