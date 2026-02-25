import { Module, forwardRef } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';

// Application
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';

// Infrastructure
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';

// Presentation
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    // Use Cases
    GetUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,

    // Repository binding
    {
      provide: INJECTION_TOKENS.USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [
    INJECTION_TOKENS.USER_REPOSITORY,
    GetUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
  ],
})
export class UsersModule {}
