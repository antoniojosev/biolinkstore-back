/**
 * In-memory repositories que cumplen los contratos de dominio usados por
 * el módulo themes. Sin DB, sin Prisma.
 *
 * Cada uno mantiene su propio Map<id, entity>. Los métodos no usados por los
 * use cases del módulo themes lanzan `Error('not implemented in test env')`
 * para detectar regresiones cuando se agregan nuevas dependencias.
 */

import { Plan, TemplateNiche, ExchangeRateMode } from '@prisma/client';

import { Template } from '../domain/entities/template.entity';
import { PalettePreset } from '../domain/entities/palette-preset.entity';
import { StoreTheme } from '../domain/entities/store-theme.entity';

import {
  ITemplateRepository,
  ListTemplatesFilter,
} from '../domain/repositories/template.repository.interface';
import { IPalettePresetRepository } from '../domain/repositories/palette-preset.repository.interface';
import { IStoreThemeRepository } from '../domain/repositories/store-theme.repository.interface';

import {
  IStoreRepository,
  CreateStoreData,
  UpdateStoreData,
} from '@/modules/stores/domain/repositories/store.repository.interface';
import { Store } from '@/modules/stores/domain/entities/store.entity';

import {
  IProductRepository,
  ProductFilterParams,
  CreateProductData,
  UpdateProductData,
} from '@/modules/products/domain/repositories/product.repository.interface';
import { Product } from '@/modules/products/domain/entities/product.entity';

import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '@/modules/categories/domain/repositories/category.repository.interface';
import { Category } from '@/modules/categories/domain/entities/category.entity';

import {
  PaginatedResult,
  PaginationParams,
} from '@/common/interfaces/pagination.interface';

const PLAN_LEVEL: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
};

// ============================================================================
// Template repo
// ============================================================================

export class InMemoryTemplateRepository implements ITemplateRepository {
  private readonly byKey = new Map<string, Template>();

  upsert(template: Template): void {
    this.byKey.set(template.key, template);
  }

  /**
   * Reemplaza el template existente por una nueva versión (útil para tests
   * de migración: bumpear `version` o mutar `sectionSchema`).
   */
  bumpVersion(key: string, mutator: (t: Template) => void): Template {
    const existing = this.byKey.get(key);
    if (!existing) throw new Error(`Template not seeded: ${key}`);
    mutator(existing);
    return existing;
  }

  async findActive(filter: ListTemplatesFilter): Promise<Template[]> {
    let result = Array.from(this.byKey.values()).filter((t) => t.isActive);
    if (filter.niche) {
      result = result.filter((t) => t.niche === filter.niche);
    }
    if (filter.plan) {
      const cap = PLAN_LEVEL[filter.plan];
      result = result.filter((t) => PLAN_LEVEL[t.planRequired] <= cap);
    }
    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findActiveByKey(key: string): Promise<Template | null> {
    const t = this.byKey.get(key);
    return t && t.isActive ? t : null;
  }
}

// ============================================================================
// Palette preset repo
// ============================================================================

export class InMemoryPalettePresetRepository
  implements IPalettePresetRepository
{
  private readonly byKey = new Map<string, PalettePreset>();

  upsert(palette: PalettePreset): void {
    this.byKey.set(palette.key, palette);
  }

  async findActive(): Promise<PalettePreset[]> {
    return Array.from(this.byKey.values())
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

// ============================================================================
// StoreTheme repo
// ============================================================================

export class InMemoryStoreThemeRepository implements IStoreThemeRepository {
  private readonly byStoreId = new Map<string, StoreTheme>();
  private idCounter = 1;

  /**
   * Reemplaza la entrada por completo (testing helper).
   */
  replace(theme: StoreTheme): void {
    this.byStoreId.set(theme.storeId, theme);
  }

  /**
   * Lectura cruda — útil para asserts que comprueban "no se persistió X"
   * tras un GET (ej: lazy migration).
   */
  raw(storeId: string): StoreTheme | undefined {
    return this.byStoreId.get(storeId);
  }

  async findByStoreId(storeId: string): Promise<StoreTheme | null> {
    const t = this.byStoreId.get(storeId);
    return t ? this.clone(t) : null;
  }

  async findByStoreIdOrCreate(
    storeId: string,
    defaults: {
      activeTemplate: string;
      draftsByTemplate: Record<string, unknown>;
    },
  ): Promise<StoreTheme> {
    const existing = this.byStoreId.get(storeId);
    if (existing) return this.clone(existing);

    const created = new StoreTheme({
      id: `theme_${this.idCounter++}`,
      storeId,
      activeTemplate: defaults.activeTemplate,
      publishedTemplate: null,
      rollbackTemplate: null,
      draftsByTemplate: defaults.draftsByTemplate,
      publishedTree: null,
      publishedTokens: null,
      rollbackTree: null,
      rollbackTokens: null,
      version: 1,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.byStoreId.set(storeId, created);
    return this.clone(created);
  }

  async updateDraftTokens(
    storeId: string,
    _templateKey: string,
    draftsByTemplate: Record<string, unknown>,
  ): Promise<StoreTheme> {
    const t = this.requireExisting(storeId);
    t.draftsByTemplate = draftsByTemplate;
    t.updatedAt = new Date();
    return this.clone(t);
  }

  async updateDraftSections(
    storeId: string,
    _templateKey: string,
    draftsByTemplate: Record<string, unknown>,
  ): Promise<StoreTheme> {
    const t = this.requireExisting(storeId);
    t.draftsByTemplate = draftsByTemplate;
    t.updatedAt = new Date();
    return this.clone(t);
  }

  async updateDraftsByTemplateAndActive(
    storeId: string,
    draftsByTemplate: Record<string, unknown>,
    activeTemplate: string,
  ): Promise<StoreTheme> {
    const t = this.requireExisting(storeId);
    t.draftsByTemplate = draftsByTemplate;
    t.activeTemplate = activeTemplate;
    t.updatedAt = new Date();
    return this.clone(t);
  }

  async publish(
    storeId: string,
    params: {
      publishedTemplate: string;
      publishedTree: unknown;
      publishedTokens: unknown;
      rollbackTemplate: string | null;
      rollbackTree: unknown | null;
      rollbackTokens: unknown | null;
      publishedAt: Date;
      version: number;
    },
  ): Promise<StoreTheme> {
    const t = this.requireExisting(storeId);
    t.publishedTemplate = params.publishedTemplate;
    t.publishedTree = params.publishedTree;
    t.publishedTokens = params.publishedTokens;
    t.rollbackTemplate = params.rollbackTemplate;
    t.rollbackTree = params.rollbackTree;
    t.rollbackTokens = params.rollbackTokens;
    t.publishedAt = params.publishedAt;
    t.version = params.version;
    t.updatedAt = new Date();
    return this.clone(t);
  }

  async swapRollback(
    storeId: string,
    params: {
      publishedTemplate: string;
      publishedTree: unknown;
      publishedTokens: unknown;
      rollbackTemplate: string | null;
      rollbackTree: unknown | null;
      rollbackTokens: unknown | null;
      publishedAt: Date;
    },
  ): Promise<StoreTheme> {
    const t = this.requireExisting(storeId);
    t.publishedTemplate = params.publishedTemplate;
    t.publishedTree = params.publishedTree;
    t.publishedTokens = params.publishedTokens;
    t.rollbackTemplate = params.rollbackTemplate;
    t.rollbackTree = params.rollbackTree;
    t.rollbackTokens = params.rollbackTokens;
    t.publishedAt = params.publishedAt;
    t.updatedAt = new Date();
    return this.clone(t);
  }

  private requireExisting(storeId: string): StoreTheme {
    const t = this.byStoreId.get(storeId);
    if (!t) {
      throw new Error(
        `In-memory store theme not found for storeId=${storeId} (test env)`,
      );
    }
    return t;
  }

  /**
   * Devuelve clones por copia profunda JSON para evitar que los use cases
   * muten los objetos retenidos por el repo. Reproduce más fielmente el
   * comportamiento de Prisma que serializa cada round-trip.
   */
  private clone(t: StoreTheme): StoreTheme {
    return new StoreTheme({
      id: t.id,
      storeId: t.storeId,
      activeTemplate: t.activeTemplate,
      publishedTemplate: t.publishedTemplate,
      rollbackTemplate: t.rollbackTemplate,
      draftsByTemplate: deepCloneJson(t.draftsByTemplate),
      publishedTree: deepCloneJson(t.publishedTree),
      publishedTokens: deepCloneJson(t.publishedTokens),
      rollbackTree: deepCloneJson(t.rollbackTree),
      rollbackTokens: deepCloneJson(t.rollbackTokens),
      version: t.version,
      publishedAt: t.publishedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    });
  }
}

// ============================================================================
// Store repo (parcial — solo lo que el módulo themes consume)
// ============================================================================

export interface TestStoreRecord {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
}

export class InMemoryStoreRepository implements IStoreRepository {
  private readonly byId = new Map<string, Store>();
  private readonly bySlug = new Map<string, Store>();

  upsert(record: TestStoreRecord): Store {
    const existing = this.byId.get(record.id);
    const store = new Store({
      ...(existing ?? {}),
      id: record.id,
      slug: record.slug,
      username: existing?.username ?? null,
      name: record.name,
      description: existing?.description ?? null,
      logo: existing?.logo ?? null,
      favicon: existing?.favicon ?? null,
      banner: existing?.banner ?? null,
      primaryColor: existing?.primaryColor ?? '#000000',
      secondaryColor: existing?.secondaryColor ?? '#ffffff',
      backgroundColor: existing?.backgroundColor ?? '#ffffff',
      textColor: existing?.textColor ?? '#000000',
      font: existing?.font ?? 'Inter',
      template: existing?.template ?? 'vitrina',
      whatsappNumbers: existing?.whatsappNumbers ?? [],
      instagramHandle: existing?.instagramHandle ?? null,
      facebookUrl: existing?.facebookUrl ?? null,
      tiktokUrl: existing?.tiktokUrl ?? null,
      email: existing?.email ?? null,
      phone: existing?.phone ?? null,
      address: existing?.address ?? null,
      socialLinks: existing?.socialLinks ?? null,
      businessHours: existing?.businessHours ?? null,
      checkoutConfig: existing?.checkoutConfig ?? null,
      currencyConfig: existing?.currencyConfig ?? null,
      whatsappTemplate: existing?.whatsappTemplate ?? null,
      exchangeRateMode:
        existing?.exchangeRateMode ?? ExchangeRateMode.AUTO,
      exchangeRateCode: existing?.exchangeRateCode ?? 'USD',
      customRate: existing?.customRate ?? null,
      stockEnabled: existing?.stockEnabled ?? false,
      showBranding: existing?.showBranding ?? true,
      customDomain: existing?.customDomain ?? null,
      domainVerified: existing?.domainVerified ?? false,
      ownerId: record.ownerId,
      createdAt: existing?.createdAt ?? new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date(),
    });
    this.byId.set(store.id, store);
    this.bySlug.set(store.slug, store);
    return store;
  }

  async findById(id: string): Promise<Store | null> {
    return this.byId.get(id) ?? null;
  }

  async findByIdWithSubscription(id: string): Promise<Store | null> {
    return this.findById(id);
  }

  async findBySlug(slug: string): Promise<Store | null> {
    return this.bySlug.get(slug) ?? null;
  }

  async findByOwnerId(): Promise<PaginatedResult<Store>> {
    throw new Error('findByOwnerId not implemented in test env');
  }

  async create(_data: CreateStoreData): Promise<Store> {
    throw new Error('create not implemented in test env');
  }

  async update(_id: string, _data: UpdateStoreData): Promise<Store> {
    throw new Error('update not implemented in test env');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('delete not implemented in test env');
  }

  async checkSlugExists(slug: string): Promise<boolean> {
    return this.bySlug.has(slug);
  }

  async checkUsernameExists(_username: string): Promise<boolean> {
    return false;
  }
}

// ============================================================================
// Product repo (parcial)
// ============================================================================

export class InMemoryProductRepository implements IProductRepository {
  private readonly byStoreId = new Map<string, Product[]>();

  add(storeId: string, product: Product): void {
    const list = this.byStoreId.get(storeId) ?? [];
    list.push(product);
    this.byStoreId.set(storeId, list);
  }

  async findById(_id: string): Promise<Product | null> {
    throw new Error('findById not implemented in test env');
  }

  async findBySlug(_storeId: string, _slug: string): Promise<Product | null> {
    throw new Error('findBySlug not implemented in test env');
  }

  async findByStoreId(
    storeId: string,
    params?: ProductFilterParams,
  ): Promise<PaginatedResult<Product>> {
    let list = this.byStoreId.get(storeId) ?? [];
    if (params?.isVisible !== undefined) {
      list = list.filter((p) => p.isVisible === params.isVisible);
    }
    const limit = params?.limit ?? 20;
    const page = params?.page ?? 1;
    const start = (page - 1) * limit;
    const slice = list.slice(start, start + limit);
    return {
      data: slice,
      meta: {
        total: list.length,
        page,
        limit,
        totalPages: Math.ceil(list.length / limit),
        hasNextPage: start + limit < list.length,
        hasPreviousPage: page > 1,
      },
    };
  }

  async create(_data: CreateProductData): Promise<Product> {
    throw new Error('create not implemented in test env');
  }

  async update(_id: string, _data: UpdateProductData): Promise<Product> {
    throw new Error('update not implemented in test env');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('delete not implemented in test env');
  }

  async checkSlugExists(_storeId: string, _slug: string): Promise<boolean> {
    return false;
  }

  async countByStoreId(storeId: string): Promise<number> {
    return (this.byStoreId.get(storeId) ?? []).length;
  }
}

// ============================================================================
// Category repo (parcial)
// ============================================================================

export class InMemoryCategoryRepository implements ICategoryRepository {
  private readonly byStoreId = new Map<string, Category[]>();

  add(storeId: string, category: Category): void {
    const list = this.byStoreId.get(storeId) ?? [];
    list.push(category);
    this.byStoreId.set(storeId, list);
  }

  async findById(_id: string): Promise<Category | null> {
    throw new Error('findById not implemented in test env');
  }

  async findBySlug(_storeId: string, _slug: string): Promise<Category | null> {
    throw new Error('findBySlug not implemented in test env');
  }

  async findByStoreId(
    storeId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Category>> {
    const list = this.byStoreId.get(storeId) ?? [];
    const limit = params?.limit ?? 100;
    const page = params?.page ?? 1;
    const start = (page - 1) * limit;
    const slice = list.slice(start, start + limit);
    return {
      data: slice,
      meta: {
        total: list.length,
        page,
        limit,
        totalPages: Math.ceil(list.length / limit),
        hasNextPage: start + limit < list.length,
        hasPreviousPage: page > 1,
      },
    };
  }

  async create(_data: CreateCategoryData): Promise<Category> {
    throw new Error('create not implemented in test env');
  }

  async update(_id: string, _data: UpdateCategoryData): Promise<Category> {
    throw new Error('update not implemented in test env');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('delete not implemented in test env');
  }

  async checkSlugExists(_storeId: string, _slug: string): Promise<boolean> {
    return false;
  }
}

// ============================================================================
// Prisma stub (solo subscription.findUnique + user.findUnique)
// ============================================================================

/**
 * El plan-gate del switch-template y del preview consume `prisma.subscription
 * .findUnique({ where: { storeId } })`. Stubeamos solo eso.
 *
 * También exponemos `user.findUnique` para que `DemoGuard` (si llegara a
 * activarse en este módulo de tests) no rompa.
 */
export class PrismaSubscriptionStub {
  private readonly planByStoreId = new Map<string, Plan>();

  setPlan(storeId: string, plan: Plan): void {
    this.planByStoreId.set(storeId, plan);
  }

  asPrisma(): unknown {
    const planByStoreId = this.planByStoreId;
    return {
      subscription: {
        findUnique: async ({ where }: { where: { storeId: string } }) => {
          const plan = planByStoreId.get(where.storeId);
          // Si no se ha seteado, devolvemos null. El helper de plan-gate trata
          // null como FREE — coincide con el contrato real.
          if (!plan) return null;
          return { plan };
        },
      },
      user: {
        findUnique: async () => ({ isDemo: false }),
      },
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

function deepCloneJson<T>(value: T): T {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}
