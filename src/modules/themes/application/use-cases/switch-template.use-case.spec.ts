import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Plan, TemplateNiche } from '@prisma/client';
import { Template } from '../../domain/entities/template.entity';
import { StoreTheme } from '../../domain/entities/store-theme.entity';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { StoreThemeAssembler } from '../services/store-theme-assembler.service';
import {
  MAX_DRAFTS_NON_PUBLISHED,
  SwitchTemplateUseCase,
} from './switch-template.use-case';

function buildTemplate(
  key: string,
  planRequired: Plan = Plan.FREE,
): Template {
  return new Template({
    id: `tpl_${key}`,
    key,
    name: key,
    niche: TemplateNiche.GENERAL,
    planRequired,
    previewImage: null,
    demoDataJson: {},
    sectionSchema: {
      defaultOrder: ['hero_main'],
      sections: [
        { type: 'hero', key: 'hero_main', removable: false, props: {} },
      ],
    },
    defaultTokens: {
      palette: { preset: 'custom', primary: '#000000' },
      typography: { headingFont: 'Inter', bodyFont: 'Inter' },
      radius: 'md',
      spacing: 'normal',
      buttonStyle: 'solid',
    },
    version: 1,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
}

interface MockRepoState {
  theme: StoreTheme | null;
  templatesByKey: Record<string, Template>;
  storePlan: Plan;
}

function buildMocks(state: MockRepoState) {
  const calls: { args: unknown[]; method: string }[] = [];

  const storeThemeRepo: IStoreThemeRepository = {
    findByStoreId: jest.fn(async () => state.theme),
    findByStoreIdOrCreate: jest.fn(async (_storeId, defaults) => {
      state.theme = new StoreTheme({
        id: 'theme_1',
        storeId: _storeId,
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
      return state.theme;
    }),
    updateDraftTokens: jest.fn(async () => {
      throw new Error('not used in switch tests');
    }),
    updateDraftSections: jest.fn(async () => {
      throw new Error('not used in switch tests');
    }),
    updateDraftsByTemplateAndActive: jest.fn(
      async (storeId, drafts, activeTemplate) => {
        calls.push({
          method: 'updateDraftsByTemplateAndActive',
          args: [storeId, drafts, activeTemplate],
        });
        if (!state.theme) throw new Error('theme missing');
        state.theme = new StoreTheme({
          ...state.theme,
          draftsByTemplate: drafts,
          activeTemplate,
        });
        return state.theme;
      },
    ),
    publish: jest.fn(async () => {
      throw new Error('not used in switch tests');
    }),
    swapRollback: jest.fn(async () => {
      throw new Error('not used in switch tests');
    }),
  };

  const templateRepo: ITemplateRepository = {
    findActive: jest.fn(async () => Object.values(state.templatesByKey)),
    findActiveByKey: jest.fn(async (key) => state.templatesByKey[key] ?? null),
  };

  const prisma = {
    subscription: {
      findUnique: jest.fn(async () => ({ plan: state.storePlan })),
    },
  } as unknown as import('@/infrastructure/database/prisma/prisma.service').PrismaService;

  const assembler = new StoreThemeAssembler();

  const useCase = new SwitchTemplateUseCase(
    storeThemeRepo,
    templateRepo,
    prisma,
    assembler,
  );

  return { useCase, storeThemeRepo, templateRepo, prisma, assembler, state, calls };
}

function buildExistingTheme(
  draftsByTemplate: Record<string, { tree: unknown; tokens: unknown; updatedAt: string }>,
  activeTemplate: string,
  publishedTemplate: string | null = null,
): StoreTheme {
  return new StoreTheme({
    id: 'theme_1',
    storeId: 'store_1',
    activeTemplate,
    publishedTemplate,
    rollbackTemplate: null,
    draftsByTemplate,
    publishedTree: null,
    publishedTokens: null,
    rollbackTree: null,
    rollbackTokens: null,
    version: 1,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('SwitchTemplateUseCase', () => {
  it('404 si template no existe', async () => {
    const { useCase } = buildMocks({
      theme: null,
      templatesByKey: { vitrina: buildTemplate('vitrina') },
      storePlan: Plan.FREE,
    });
    await expect(useCase.execute('store_1', 'inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('403 si plan del store no cubre el planRequired del template', async () => {
    const { useCase } = buildMocks({
      theme: null,
      templatesByKey: {
        vitrina: buildTemplate('vitrina'),
        luxora: buildTemplate('luxora', Plan.PRO),
      },
      storePlan: Plan.FREE,
    });
    await expect(useCase.execute('store_1', 'luxora')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('si el draft del template ya existe, sólo cambia activeTemplate (no purga, no recrea)', async () => {
    const drafts = {
      vitrina: {
        tree: { sections: [] },
        tokens: { palette: { primary: '#aaa' } },
        updatedAt: '2026-04-20T10:00:00Z',
      },
      menu: {
        tree: { sections: [{ type: 'hero', key: 'hero_main' }] },
        tokens: { palette: { primary: '#b45309' } },
        updatedAt: '2026-04-21T10:00:00Z',
      },
    };
    const { useCase, calls } = buildMocks({
      theme: buildExistingTheme(drafts, 'vitrina'),
      templatesByKey: {
        vitrina: buildTemplate('vitrina'),
        menu: buildTemplate('menu'),
      },
      storePlan: Plan.FREE,
    });

    const out = await useCase.execute('store_1', 'menu');
    expect(out.activeTemplate).toBe('menu');

    // El draft de "menu" debe permanecer intacto en updatedAt original.
    const persistedDrafts = calls[0].args[1] as Record<
      string,
      { updatedAt: string }
    >;
    expect(persistedDrafts.menu.updatedAt).toBe('2026-04-21T10:00:00Z');
    expect(Object.keys(persistedDrafts).sort()).toEqual(['menu', 'vitrina']);
  });

  it('crea draft nuevo con defaults cuando no existe y hay <3 entradas no-published', async () => {
    const drafts = {
      vitrina: {
        tree: {},
        tokens: {},
        updatedAt: '2026-04-20T10:00:00Z',
      },
    };
    const { useCase, calls } = buildMocks({
      theme: buildExistingTheme(drafts, 'vitrina'),
      templatesByKey: {
        vitrina: buildTemplate('vitrina'),
        menu: buildTemplate('menu'),
      },
      storePlan: Plan.FREE,
    });

    const out = await useCase.execute('store_1', 'menu');
    expect(out.activeTemplate).toBe('menu');
    const persisted = calls[0].args[1] as Record<string, unknown>;
    expect(Object.keys(persisted).sort()).toEqual(['menu', 'vitrina']);
    const menuDraft = persisted.menu as {
      tree: { template: string; templateVersion: number; sections: unknown[] };
      tokens: Record<string, unknown>;
      updatedAt: string;
    };
    expect(menuDraft.tree.template).toBe('menu');
    expect(menuDraft.tree.sections).toHaveLength(1);
    expect(menuDraft.tokens).toBeDefined();
  });

  it('FIFO: cuando hay 3 drafts no-published, purga el más antiguo por updatedAt al crear uno nuevo', async () => {
    const drafts = {
      vitrina: {
        tree: {},
        tokens: {},
        updatedAt: '2026-04-18T10:00:00Z', // más antiguo
      },
      luxora: {
        tree: {},
        tokens: {},
        updatedAt: '2026-04-19T10:00:00Z',
      },
      atelier: {
        tree: {},
        tokens: {},
        updatedAt: '2026-04-20T10:00:00Z',
      },
    };
    const { useCase, calls } = buildMocks({
      theme: buildExistingTheme(drafts, 'atelier'),
      templatesByKey: {
        vitrina: buildTemplate('vitrina'),
        luxora: buildTemplate('luxora'),
        atelier: buildTemplate('atelier'),
        rosier: buildTemplate('rosier'),
      },
      storePlan: Plan.BUSINESS,
    });

    await useCase.execute('store_1', 'rosier');
    const persisted = calls[0].args[1] as Record<string, unknown>;
    expect(Object.keys(persisted).sort()).toEqual([
      'atelier',
      'luxora',
      'rosier',
    ]);
    expect(persisted.vitrina).toBeUndefined();
  });

  it('FIFO no purga al publishedTemplate aunque sea el más antiguo', async () => {
    const drafts = {
      vitrina: {
        tree: {},
        tokens: {},
        updatedAt: '2026-04-15T10:00:00Z', // más antiguo Y published
      },
      luxora: {
        tree: {},
        tokens: {},
        updatedAt: '2026-04-19T10:00:00Z',
      },
      atelier: {
        tree: {},
        tokens: {},
        updatedAt: '2026-04-20T10:00:00Z',
      },
    };
    const { useCase, calls } = buildMocks({
      theme: buildExistingTheme(drafts, 'atelier', /* published */ 'vitrina'),
      templatesByKey: {
        vitrina: buildTemplate('vitrina'),
        luxora: buildTemplate('luxora'),
        atelier: buildTemplate('atelier'),
        rosier: buildTemplate('rosier'),
      },
      storePlan: Plan.BUSINESS,
    });

    // Como vitrina es published, queda excluida del set FIFO de no-publisheds.
    // Hay 2 no-published (luxora, atelier) -> aún <3, así que NO debe purgar nada.
    await useCase.execute('store_1', 'rosier');
    const persisted = calls[0].args[1] as Record<string, unknown>;
    expect(Object.keys(persisted).sort()).toEqual([
      'atelier',
      'luxora',
      'rosier',
      'vitrina',
    ]);
    // vitrina sigue presente, no fue purgada.
    expect(persisted.vitrina).toBeDefined();
  });

  it('Lazy create cuando theme no existe: crea con vitrina + draft, luego switch agrega o usa', async () => {
    const { useCase, calls } = buildMocks({
      theme: null,
      templatesByKey: {
        vitrina: buildTemplate('vitrina'),
        menu: buildTemplate('menu'),
      },
      storePlan: Plan.FREE,
    });

    const out = await useCase.execute('store_1', 'menu');
    expect(out.activeTemplate).toBe('menu');
    // 1 update post-create con drafts {vitrina, menu}.
    expect(calls).toHaveLength(1);
    const persisted = calls[0].args[1] as Record<string, unknown>;
    expect(Object.keys(persisted).sort()).toEqual(['menu', 'vitrina']);
  });

  it(`MAX_DRAFTS_NON_PUBLISHED export expone constante coherente con el spec (3)`, () => {
    expect(MAX_DRAFTS_NON_PUBLISHED).toBe(3);
  });
});
