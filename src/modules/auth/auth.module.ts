import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

// Domain
import { PasswordService } from './domain/services/password.service';

// Application
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';

// Infrastructure
import { TokenService } from './infrastructure/services/token.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';

// Presentation
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    // Domain
    PasswordService,

    // Application
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,

    // Infrastructure
    TokenService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
  ],
  exports: [PasswordService, TokenService],
})
export class AuthModule {}
