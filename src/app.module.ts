import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Configuration
import configuration from './config/configuration';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { ImageModule } from './infrastructure/image/image.module';
import { EmailModule } from './modules/email/email.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PublicModule } from './modules/public/public.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PaymentReportsModule } from './modules/payment-reports/payment-reports.module';
import { ContactModule } from './modules/contact/contact.module';

// Global Guards, Filters, Interceptors, Pipes
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env.development', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Infrastructure
    DatabaseModule,
    // CacheModule,
    StorageModule,
    ImageModule,
    EmailModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    StoresModule,
    ProductsModule,
    CategoriesModule,
    PublicModule,
    OrdersModule,
    AnalyticsModule,
    UploadsModule,
    PaymentReportsModule,
    ContactModule,
  ],
  providers: [
    // Global JWT Auth Guard (can be overridden with @Public decorator)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global Validation Pipe
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
