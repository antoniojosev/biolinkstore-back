import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Plan, TemplateNiche } from '@prisma/client';
import { Template } from '../../domain/entities/template.entity';
import { StoreTheme } from '../../domain/entities/store-theme.entity';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { GetStoreRealDataHelper } from '../services/get-store-real-data.helper';
import { GetStorePreviewUseCase } from './get-store-preview.use-case';

function buildTemplate(
  key: string,
  overrides: Partial<Template> = {},
): Template {
  return new Template({
    id: `tpl_${key}`,
    key,
    name: key,
    niche: TemplateNiche.GENERAL,
    planRequired: Plan.FREE,
    previewImage: null,
    demoDataJson: {
      store: { name: `Demo ${key}` },
      products: [{ id: 'demo_p1', name: 'Demo product 1' }],
      categories: [{ id: 'demo_c1', name: 'Demo cat 1' }],
    },
    sectionSchema: {
      defaultOrder: ['hero_main'],
      sections: [{ type: 'hero', key: 'hero_main', props: {} }],
    },
    defaultTokens: { palette: { primary: '#000' } },
    version: 1,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function buildTheme(overrides: Partial<StoreTheme> = {}): StoreTheme {
  return new StoreTheme({
    id: 'theme_1',
    storeId: 'store_1',
    activeTemplate: 'vitrina',
    publishedTemplate: null,
    rollbackTemplate: null,
    draftsByTemplate: {
      vitrina: {
        tree: {
          template: 'vitrina',
          templateVersion: 1,
          sections: [{ type: 'hero', key: 'hero_main', visible: true, props: { headline: 'Hola' } }],
        },
        tokens: { palette: { primary: '#aaa' } },
        updatedAt: '2026-04-22T10:00:00Z',
      },
    },
    publishedTree: null,
    publishedTokens: null,
    rollbackTree: null,
    rollbackTokens: null,
    version: 1,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

interface MockSetup {
  theme: StoreTheme | null;
  templates: Record<string, Template>;
  storePlan?: Plan;
  realProducts?: unknown[];
  realCategories?: unknown[];
  storeMissing?: boolean;
}

function buildMocks(setup: MockSetup) {
  const storeThemeRepo: IStoreThemeRepository = {
    findByStoreId: jest.fn(async () => setup.theme),
    findByStoreIdOrCreate: jest.fn(async () => {
      throw new Error('preview NEVER lazy-creates — should not be called');
    }),
    updateDraftTokens: jest.fn(),
    updateDraftSections: jest.fn(),
    updateDraftsByTemplateAndActive: jest.fn(),
    publish: jest.fn(),
    swapRollback: jest.fn(),
  };

  const templateRepo: ITemplateRepository = {
    findActive: jest.fn(async () => Object.values(setup.templates)),
    findActiveByKey: jest.fn(async (key) => setup.templates[key] ?? null),
  };

  const prisma = {
    subscription: {
      findUnique: jest.fn(async () => ({ plan: setup.storePlan ?? Plan.FREE })),
    },
  } as unknown as import('@/infrastructure/database/prisma/prisma.service').PrismaService;

  const realData = {
    execute: jest.fn(async (storeId: string) => {
      if (setup.storeMissing) {
        throw new NotFoundException(`Store not found: ${storeId}`);
      }
      return {
        store: {
          id: storeId,
          slug: 'mi-tienda',
          name: 'Mi Tienda',
          description: null,
          logo: null,
          banner: null,
          phone: null,
          email: null,
          address: null,
          socials: null,
        },
        products: setup.realProducts ?? [],
        categories: setup.realCategories ?? [],
      };
    }),
  } as unknown as GetStoreRealDataHelper;

  const useCase = new GetStorePreviewUseCase(
    storeThemeRepo,
    templateRepo,
    prisma,
    realData,
  );

  return { useCase, storeThemeRepo, templateRepo, realData };
}

describe('GetStorePreviewUseCase', () => {
  describe('selección de template', () => {
    it('query.template inválido → 404', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: { vitrina: buildTemplate('vitrina') },
      });
      await expect(useCase.execute('store_1', 'inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('query.template válido → usa ese template (override del activeTemplate)', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme({ activeTemplate: 'vitrina' }),
        templates: {
          vitrina: buildTemplate('vitrina'),
          atelier: buildTemplate('atelier'),
        },
        storePlan: Plan.FREE,
        realProducts: [{ id: 'p1' }],
      });
      const out = await useCase.execute('store_1', 'atelier');
      expect(out.template).toBe('atelier');
      expect(out.isActiveTemplate).toBe(false);
    });

    it('sin query → usa theme.activeTemplate', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme({ activeTemplate: 'vitrina' }),
        templates: { vitrina: buildTemplate('vitrina') },
        realProducts: [{ id: 'p1' }],
      });
      const out = await useCase.execute('store_1');
      expect(out.template).toBe('vitrina');
      expect(out.isActiveTemplate).toBe(true);
    });

    it('activeTemplate ya no existe en catálogo → fallback a vitrina + reporta fallbackFromInvalidActive', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme({ activeTemplate: 'borrado' }),
        templates: { vitrina: buildTemplate('vitrina') },
        realProducts: [{ id: 'p1' }],
      });
      const out = await useCase.execute('store_1');
      expect(out.template).toBe('vitrina');
      expect(out.fallbackFromInvalidActive).toBe('borrado');
      expect(out.isActiveTemplate).toBe(false);
    });

    it('theme inexistente y sin query → usa vitrina default', async () => {
      const { useCase } = buildMocks({
        theme: null,
        templates: { vitrina: buildTemplate('vitrina') },
      });
      const out = await useCase.execute('store_1');
      expect(out.template).toBe('vitrina');
    });

    it('theme inexistente, vitrina tampoco → 404 (catálogo vacío)', async () => {
      const { useCase } = buildMocks({
        theme: null,
        templates: {},
      });
      await expect(useCase.execute('store_1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('plan gating', () => {
    it('plan FREE intentando template PRO → 403', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: {
          vitrina: buildTemplate('vitrina'),
          luxora: buildTemplate('luxora', { planRequired: Plan.PRO }),
        },
        storePlan: Plan.FREE,
      });
      await expect(useCase.execute('store_1', 'luxora')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('plan PRO accediendo template PRO → OK', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: {
          vitrina: buildTemplate('vitrina'),
          luxora: buildTemplate('luxora', { planRequired: Plan.PRO }),
        },
        storePlan: Plan.PRO,
        realProducts: [{ id: 'p1' }],
      });
      const out = await useCase.execute('store_1', 'luxora');
      expect(out.template).toBe('luxora');
    });
  });

  describe('resolución de draft vs defaults', () => {
    it('draft existe → isDraft=true y devuelve tree del draft', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: { vitrina: buildTemplate('vitrina') },
        realProducts: [{ id: 'p1' }],
      });
      const out = await useCase.execute('store_1', 'vitrina');
      expect(out.isDraft).toBe(true);
      const tree = out.tree as { sections: Array<{ props: Record<string, unknown> }> };
      expect(tree.sections[0].props.headline).toBe('Hola');
    });

    it('draft NO existe → isDraft=false, tree sintetizado desde defaults', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme({
          // Sin draft de menu, pero pedimos preview de menu.
          draftsByTemplate: {
            vitrina: {
              tree: { template: 'vitrina', templateVersion: 1, sections: [] },
              tokens: {},
              updatedAt: '2026-04-22T10:00:00Z',
            },
          },
        }),
        templates: {
          vitrina: buildTemplate('vitrina'),
          menu: buildTemplate('menu'),
        },
        realProducts: [{ id: 'p1' }],
      });
      const out = await useCase.execute('store_1', 'menu');
      expect(out.isDraft).toBe(false);
      const tree = out.tree as { template: string; sections: unknown[] };
      expect(tree.template).toBe('menu');
      // defaultTreeFor crea sección hero_main por defaultOrder.
      expect(tree.sections).toHaveLength(1);
    });

    it('draft con templateVersion atrás → migrado en memoria al actual', async () => {
      const oldTree = {
        template: 'vitrina',
        templateVersion: 1,
        sections: [
          { type: 'hero', key: 'hero_main', visible: true, props: { obsoleta: 'x', headline: 'Hi' } },
          { type: 'tipo_borrado', key: 'gone' }, // type ya no en schema actual
        ],
      };
      const newTemplate = buildTemplate('vitrina', {
        version: 5,
        sectionSchema: {
          defaultOrder: ['hero_main'],
          sections: [
            { type: 'hero', key: 'hero_main', props: { headline: {} } },
          ],
        },
      });
      const { useCase } = buildMocks({
        theme: buildTheme({
          draftsByTemplate: {
            vitrina: {
              tree: oldTree,
              tokens: { palette: { primary: '#aaa' } },
              updatedAt: '2026-04-22T10:00:00Z',
            },
          },
        }),
        templates: { vitrina: newTemplate },
        realProducts: [{ id: 'p1' }],
      });
      const out = await useCase.execute('store_1', 'vitrina');
      expect(out.templateVersion).toBe(5);
      const tree = out.tree as {
        sections: Array<{ type: string; props: Record<string, unknown> }>;
      };
      // tipo_borrado dropped, prop "obsoleta" stripped, headline preservado.
      expect(tree.sections).toHaveLength(1);
      expect(tree.sections[0].type).toBe('hero');
      expect(tree.sections[0].props.headline).toBe('Hi');
      expect(tree.sections[0].props.obsoleta).toBeUndefined();
    });
  });

  describe('data real vs demo fallback', () => {
    it('store con productos reales → mode=live, productos reales en respuesta', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: { vitrina: buildTemplate('vitrina') },
        realProducts: [{ id: 'p1' }, { id: 'p2' }],
        realCategories: [{ id: 'c1' }],
      });
      const out = await useCase.execute('store_1', 'vitrina');
      expect(out.mode).toBe('live');
      expect(out.products).toEqual([{ id: 'p1' }, { id: 'p2' }]);
      expect(out.categories).toEqual([{ id: 'c1' }]);
    });

    it('store sin productos reales → mode=demo-fallback, productos vienen de demoDataJson', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: { vitrina: buildTemplate('vitrina') },
        realProducts: [],
        realCategories: [],
      });
      const out = await useCase.execute('store_1', 'vitrina');
      expect(out.mode).toBe('demo-fallback');
      expect(out.products).toEqual([{ id: 'demo_p1', name: 'Demo product 1' }]);
      expect(out.categories).toEqual([{ id: 'demo_c1', name: 'Demo cat 1' }]);
    });

    it('store NO encontrado → 404 propagado del helper', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: { vitrina: buildTemplate('vitrina') },
        storeMissing: true,
      });
      await expect(useCase.execute('store_1', 'vitrina')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('store SIEMPRE viene del repo (nunca del demo), aunque productos sean fallback', async () => {
      const { useCase } = buildMocks({
        theme: buildTheme(),
        templates: { vitrina: buildTemplate('vitrina') },
        realProducts: [],
      });
      const out = await useCase.execute('store_1', 'vitrina');
      // store del helper, no del demoData.
      const store = out.store as { id: string; slug: string };
      expect(store.id).toBe('store_1');
      expect(store.slug).toBe('mi-tienda');
    });
  });

  describe('NUNCA escribe a DB', () => {
    it('preview no llama findByStoreIdOrCreate aunque theme sea null', async () => {
      const { useCase, storeThemeRepo } = buildMocks({
        theme: null,
        templates: { vitrina: buildTemplate('vitrina') },
      });
      await useCase.execute('store_1');
      expect(storeThemeRepo.findByStoreIdOrCreate).not.toHaveBeenCalled();
      expect(storeThemeRepo.updateDraftTokens).not.toHaveBeenCalled();
      expect(storeThemeRepo.updateDraftSections).not.toHaveBeenCalled();
      expect(storeThemeRepo.publish).not.toHaveBeenCalled();
      expect(storeThemeRepo.swapRollback).not.toHaveBeenCalled();
    });
  });
});
