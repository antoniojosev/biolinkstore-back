import { BadRequestException } from '@nestjs/common';
import { StoreTheme } from '../../domain/entities/store-theme.entity';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { StoreThemeAssembler } from '../services/store-theme-assembler.service';
import { RollbackThemeUseCase } from './rollback-theme.use-case';

function buildTheme(overrides: Partial<StoreTheme> = {}): StoreTheme {
  return new StoreTheme({
    id: 'theme_1',
    storeId: 'store_1',
    activeTemplate: 'vitrina',
    publishedTemplate: null,
    rollbackTemplate: null,
    draftsByTemplate: {
      vitrina: {
        tree: { template: 'vitrina', sections: [] },
        tokens: {},
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

function buildMocks(initialTheme: StoreTheme | null) {
  const captured: { method: string; args: unknown[] }[] = [];
  let stored = initialTheme;

  const storeThemeRepo: IStoreThemeRepository = {
    findByStoreId: jest.fn(async () => stored),
    findByStoreIdOrCreate: jest.fn(),
    updateDraftTokens: jest.fn(),
    updateDraftSections: jest.fn(),
    updateDraftsByTemplateAndActive: jest.fn(),
    publish: jest.fn(),
    swapRollback: jest.fn(async (storeId, params) => {
      captured.push({ method: 'swapRollback', args: [storeId, params] });
      if (!stored) throw new Error('theme missing');
      stored = new StoreTheme({
        ...stored,
        publishedTemplate: params.publishedTemplate,
        publishedTree: params.publishedTree,
        publishedTokens: params.publishedTokens,
        rollbackTemplate: params.rollbackTemplate,
        rollbackTree: params.rollbackTree,
        rollbackTokens: params.rollbackTokens,
        publishedAt: params.publishedAt,
      });
      return stored;
    }),
  };

  const templateRepo: ITemplateRepository = {
    findActive: jest.fn(),
    findActiveByKey: jest.fn(),
  };

  const assembler = new StoreThemeAssembler();
  const useCase = new RollbackThemeUseCase(
    storeThemeRepo,
    templateRepo,
    assembler,
  );

  return { useCase, captured, storeThemeRepo };
}

describe('RollbackThemeUseCase', () => {
  it('400 si no hay rollback disponible', async () => {
    const theme = buildTheme(); // rollbackTemplate=null
    const { useCase } = buildMocks(theme);
    await expect(useCase.execute('store_1')).rejects.toThrow(BadRequestException);
  });

  it('swap correcto: published ↔ rollback, version igual, publishedAt actualizado', async () => {
    const publishedTree = { sections: ['current_published'] };
    const publishedTokens = { palette: { primary: '#current' } };
    const rollbackTree = { sections: ['previous_published'] };
    const rollbackTokens = { palette: { primary: '#prev' } };

    const theme = buildTheme({
      activeTemplate: 'vitrina',
      publishedTemplate: 'vitrina',
      publishedTree,
      publishedTokens,
      rollbackTemplate: 'menu',
      rollbackTree,
      rollbackTokens,
      version: 5,
      publishedAt: new Date('2026-04-22T10:00:00Z'),
    });

    const { useCase, captured } = buildMocks(theme);
    const before = Date.now();
    const out = await useCase.execute('store_1');

    // version no cambia.
    expect(out.version).toBe(5);

    // Swap aplicado.
    expect(out.publishedTemplate).toBe('menu');
    expect(out.published?.tree).toEqual(rollbackTree);
    expect(out.published?.tokens).toEqual(rollbackTokens);
    expect(out.rollbackTemplate).toBe('vitrina');
    expect(out.rollback?.tree).toEqual(publishedTree);
    expect(out.rollback?.tokens).toEqual(publishedTokens);

    // publishedAt cercano a now.
    const newPublishedAtMs = out.publishedAt
      ? Date.parse(out.publishedAt)
      : 0;
    expect(newPublishedAtMs).toBeGreaterThanOrEqual(before);

    expect(captured).toHaveLength(1);
  });

  it('rollback NO toca drafts ni activeTemplate', async () => {
    const drafts = {
      vitrina: {
        tree: { sections: ['draft_v'] },
        tokens: { x: 1 },
        updatedAt: '2026-04-22T10:00:00Z',
      },
      menu: {
        tree: { sections: ['draft_m'] },
        tokens: { x: 2 },
        updatedAt: '2026-04-21T10:00:00Z',
      },
    };

    const theme = buildTheme({
      activeTemplate: 'menu',
      draftsByTemplate: drafts,
      publishedTemplate: 'vitrina',
      publishedTree: { sections: ['curr'] },
      publishedTokens: { y: 1 },
      rollbackTemplate: 'vitrina',
      rollbackTree: { sections: ['prev'] },
      rollbackTokens: { y: 2 },
      version: 2,
    });

    const { useCase, captured } = buildMocks(theme);
    const out = await useCase.execute('store_1');

    expect(out.activeTemplate).toBe('menu');
    expect(out.drafts).toHaveLength(2);
    expect(out.draft.template).toBe('menu');
    expect(out.draft.tree).toEqual(drafts.menu.tree);

    // Repo NO recibió cambios en drafts ni activeTemplate.
    const params = captured[0].args[1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('draftsByTemplate');
    expect(params).not.toHaveProperty('activeTemplate');
    expect(params).not.toHaveProperty('version');
  });
});
