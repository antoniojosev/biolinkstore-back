/**
 * Test env helper para los tests de integración E2E del page builder.
 *
 * Decisión BE-120f:
 *   - El proyecto NO tiene infra E2E con DB real corriendo (solo `test/jest-e2e.json`
 *     vacío de specs). Montar una DB Postgres real para esta fase agregaría
 *     dependencia de entorno y orquestación de seeds.
 *   - Decisión: integration tests sobre la app NestJS real, con repos in-memory
 *     que cumplen los contratos de dominio. Cubre:
 *       · Routing real (controllers, pipes, guards no-op).
 *       · Validación class-validator real.
 *       · Use cases reales sin mocks.
 *       · Migración lazy real (theme-version-migrator).
 *     NO cubre la capa Prisma (eso son los `.spec.ts` aislados de cada use case
 *     más los integration tests que aparezcan en la fase de DB real).
 *
 * Forma de uso:
 *   ```ts
 *   const env = await createInMemoryThemesEnv();
 *   await request(env.app.getHttpServer()).get('/stores/store_1/theme').expect(200);
 *   await env.app.close();
 *   ```
 */

import {
  CanActivate,
  ExecutionContext,
  Global,
  INestApplication,
  Module,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Plan, TemplateNiche } from '@prisma/client';

import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

import { ThemesModule } from '../themes.module';
import { Template } from '../domain/entities/template.entity';
import { PalettePreset } from '../domain/entities/palette-preset.entity';
import { StoreTheme } from '../domain/entities/store-theme.entity';

import {
  InMemoryTemplateRepository,
  InMemoryPalettePresetRepository,
  InMemoryStoreThemeRepository,
  InMemoryStoreRepository,
  InMemoryProductRepository,
  InMemoryCategoryRepository,
  PrismaSubscriptionStub,
  TestStoreRecord,
} from './in-memory-repos';

/**
 * Guard no-op que inyecta un usuario de prueba en `req.user`.
 * Sustituye al `JwtAuthGuard` global a nivel de módulo de testing.
 * El `StoreOwnerGuard` se sustituye también porque depende de DB real.
 */
class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      userId: 'user_test',
      email: 'test@example.com',
    };
    return true;
  }
}

class TestStoreOwnerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

export interface TestEnv {
  app: INestApplication;
  templateRepo: InMemoryTemplateRepository;
  paletteRepo: InMemoryPalettePresetRepository;
  themeRepo: InMemoryStoreThemeRepository;
  storeRepo: InMemoryStoreRepository;
  productRepo: InMemoryProductRepository;
  categoryRepo: InMemoryCategoryRepository;
  prismaStub: PrismaSubscriptionStub;
  storeId: string;
}

const DEFAULT_STORE_ID = 'store_test_1';
const DEFAULT_USER_ID = 'user_test';

export async function createInMemoryThemesEnv(): Promise<TestEnv> {
  const templateRepo = new InMemoryTemplateRepository();
  const paletteRepo = new InMemoryPalettePresetRepository();
  const themeRepo = new InMemoryStoreThemeRepository();
  const storeRepo = new InMemoryStoreRepository();
  const productRepo = new InMemoryProductRepository();
  const categoryRepo = new InMemoryCategoryRepository();
  const prismaStub = new PrismaSubscriptionStub();

  // Seed por defecto: store del owner test, plan FREE, sin productos/categorías.
  storeRepo.upsert({
    id: DEFAULT_STORE_ID,
    slug: 'mi-tienda',
    name: 'Mi Tienda',
    ownerId: DEFAULT_USER_ID,
  });

  /**
   * Módulo global de tests que provee TODOS los tokens que la cadena de
   * imports de ThemesModule necesita resolver:
   *
   *   ThemesModule → StoresModule → CurrencyModule (ListExchangeRateHistoryUseCase
   *   inyecta STORE_REPOSITORY, EXCHANGE_RATE_HISTORY_REPOSITORY).
   *
   * Como `@Global()`, queda accesible desde cualquier sub-módulo sin que
   * ThemesModule tenga que reimportarlo. Sustituimos también `PrismaService`
   * y los repos secundarios que CurrencyModule consume vía Prisma para
   * evitar cualquier intento de conexión a Postgres en los tests.
   */
  const fakeRateRepo = {
    findCurrent: async () => null,
    findByCode: async () => null,
    upsertRate: async () => null,
  };
  const fakeRateHistoryRepo = {
    findByStoreId: async () => [],
    countByStoreId: async () => 0,
  };

  @Global()
  @Module({
    providers: [
      { provide: INJECTION_TOKENS.STORE_REPOSITORY, useValue: storeRepo },
      { provide: INJECTION_TOKENS.PRODUCT_REPOSITORY, useValue: productRepo },
      { provide: INJECTION_TOKENS.CATEGORY_REPOSITORY, useValue: categoryRepo },
      {
        provide: INJECTION_TOKENS.EXCHANGE_RATE_REPOSITORY,
        useValue: fakeRateRepo,
      },
      {
        provide: INJECTION_TOKENS.EXCHANGE_RATE_HISTORY_REPOSITORY,
        useValue: fakeRateHistoryRepo,
      },
      {
        provide: INJECTION_TOKENS.TEMPLATE_REPOSITORY,
        useValue: templateRepo,
      },
      {
        provide: INJECTION_TOKENS.PALETTE_PRESET_REPOSITORY,
        useValue: paletteRepo,
      },
      {
        provide: INJECTION_TOKENS.STORE_THEME_REPOSITORY,
        useValue: themeRepo,
      },
      { provide: PrismaService, useValue: prismaStub.asPrisma() },
    ],
    exports: [
      INJECTION_TOKENS.STORE_REPOSITORY,
      INJECTION_TOKENS.PRODUCT_REPOSITORY,
      INJECTION_TOKENS.CATEGORY_REPOSITORY,
      INJECTION_TOKENS.EXCHANGE_RATE_REPOSITORY,
      INJECTION_TOKENS.EXCHANGE_RATE_HISTORY_REPOSITORY,
      INJECTION_TOKENS.TEMPLATE_REPOSITORY,
      INJECTION_TOKENS.PALETTE_PRESET_REPOSITORY,
      INJECTION_TOKENS.STORE_THEME_REPOSITORY,
      PrismaService,
    ],
  })
  class TestGlobalsModule {}

  const moduleRef = await Test.createTestingModule({
    imports: [TestGlobalsModule, ThemesModule],
    providers: [
      // Pipe global equivalente al de producción (whitelist + forbid + transform).
      { provide: APP_PIPE, useClass: ValidationPipe },
      // Filter global para que las exceptions HTTP devuelvan el shape estándar
      // (statusCode, message, etc.). Mantiene paridad con producción.
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
    ],
  })
    .overrideProvider(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    .useValue(templateRepo)
    .overrideProvider(INJECTION_TOKENS.PALETTE_PRESET_REPOSITORY)
    .useValue(paletteRepo)
    .overrideProvider(INJECTION_TOKENS.STORE_THEME_REPOSITORY)
    .useValue(themeRepo)
    .overrideProvider(INJECTION_TOKENS.STORE_REPOSITORY)
    .useValue(storeRepo)
    .overrideProvider(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    .useValue(productRepo)
    .overrideProvider(INJECTION_TOKENS.CATEGORY_REPOSITORY)
    .useValue(categoryRepo)
    .overrideProvider(PrismaService)
    .useValue(prismaStub.asPrisma())
    .overrideGuard(JwtAuthGuard)
    .useValue(new TestJwtAuthGuard())
    .overrideGuard(StoreOwnerGuard)
    .useValue(new TestStoreOwnerGuard())
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();

  return {
    app,
    templateRepo,
    paletteRepo,
    themeRepo,
    storeRepo,
    productRepo,
    categoryRepo,
    prismaStub,
    storeId: DEFAULT_STORE_ID,
  };
}

/**
 * Builders helper para inyectar templates con shape consistente.
 *
 * Mantiene los defaults razonables de un template seedeado real:
 *   - sectionSchema con un `hero_main` mínimo + props básicas.
 *   - demoData con productos/categorías sintéticos para demo-fallback.
 *
 * Cada test puede override exactamente lo que necesita.
 */
export function buildTestTemplate(
  key: string,
  overrides: Partial<Template> = {},
): Template {
  return new Template({
    id: `tpl_${key}`,
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    niche: TemplateNiche.GENERAL,
    planRequired: Plan.FREE,
    previewImage: null,
    demoDataJson: {
      store: { name: `Demo ${key}` },
      products: [{ id: 'demo_p1', name: 'Demo Product 1' }],
      categories: [{ id: 'demo_c1', name: 'Demo Cat 1' }],
    },
    sectionSchema: {
      defaultOrder: ['hero_main'],
      sections: [
        {
          type: 'hero',
          key: 'hero_main',
          props: {
            headline: { type: 'text', max: 80 },
            ctaLabel: { type: 'text', max: 24 },
          },
        },
      ],
    },
    defaultTokens: {
      palette: {
        primary: '#111111',
        secondary: '#222222',
        bg: '#FFFFFF',
        text: '#0A0A0A',
      },
      typography: { headingFont: 'Inter', bodyFont: 'Inter', scale: 'normal' },
      radius: 'md',
      spacing: 'normal',
      buttonStyle: 'solid',
    },
    version: 1,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
}

/**
 * Inserta un template en el repo. Devuelve el template para encadenar.
 */
export function seedTemplate(
  env: TestEnv,
  key: string,
  overrides: Partial<Template> = {},
): Template {
  const tpl = buildTestTemplate(key, overrides);
  env.templateRepo.upsert(tpl);
  return tpl;
}

/**
 * Inserta una palette preset.
 */
export function seedPalette(
  env: TestEnv,
  key: string,
  overrides: Partial<PalettePreset> = {},
): PalettePreset {
  const palette = new PalettePreset({
    id: `palette_${key}`,
    key,
    name: key,
    colorsJson: {
      primary: '#000000',
      secondary: '#ffffff',
    },
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
  env.paletteRepo.upsert(palette);
  return palette;
}

/**
 * Inyecta directamente un StoreTheme persistido (bypassa lazy create) para
 * setear escenarios complejos (con published, rollback, drafts pre-existentes).
 */
export function seedTheme(env: TestEnv, theme: Partial<StoreTheme>): StoreTheme {
  const full = new StoreTheme({
    id: theme.id ?? 'theme_test_1',
    storeId: theme.storeId ?? env.storeId,
    activeTemplate: theme.activeTemplate ?? 'vitrina',
    publishedTemplate: theme.publishedTemplate ?? null,
    rollbackTemplate: theme.rollbackTemplate ?? null,
    draftsByTemplate: theme.draftsByTemplate ?? {},
    publishedTree: theme.publishedTree ?? null,
    publishedTokens: theme.publishedTokens ?? null,
    rollbackTree: theme.rollbackTree ?? null,
    rollbackTokens: theme.rollbackTokens ?? null,
    version: theme.version ?? 1,
    publishedAt: theme.publishedAt ?? null,
    createdAt: theme.createdAt ?? new Date('2026-01-01T00:00:00Z'),
    updatedAt: theme.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
  });
  env.themeRepo.replace(full);
  return full;
}

/**
 * Configura el plan de la subscription stub para el storeId default.
 */
export function setStorePlan(env: TestEnv, plan: Plan): void {
  env.prismaStub.setPlan(env.storeId, plan);
}

/**
 * Re-exporta tipos útiles que pueden necesitar las suites.
 */
export type { TestStoreRecord };
