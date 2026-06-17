import { BadRequestException } from '@nestjs/common';
import { Plan, TemplateNiche } from '@prisma/client';
import { StoreTheme } from '../../domain/entities/store-theme.entity';
import { Template } from '../../domain/entities/template.entity';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { StoreThemeAssembler } from '../services/store-theme-assembler.service';
import { PublishThemeUseCase } from './publish-theme.use-case';

function buildTemplate(key: string): Template {
  return new Template({
    id: `tpl_${key}`,
    key,
    name: key,
    niche: TemplateNiche.GENERAL,
    planRequired: Plan.FREE,
    previewImage: null,
    demoDataJson: {},
    sectionSchema: {
      defaultOrder: ['hero_main'],
      sections: [{ type: 'hero', key: 'hero_main' }],
    },
    defaultTokens: { palette: { primary: '#000' } },
    version: 1,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
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
        tree: { template: 'vitrina', templateVersion: 1, sections: [] },
        tokens: { palette: { primary: '#aaa' } },
        updatedAt: '2026-04-20T10:00:00Z',
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
  initialTheme: StoreTheme | null;
  templates?: Record<string, Template>;
}

function buildMocks(setup: MockSetup) {
  const captured: { method: string; args: unknown[] }[] = [];
  let stored = setup.initialTheme;

  const storeThemeRepo: IStoreThemeRepository = {
    findByStoreId: jest.fn(async () => stored),
    findByStoreIdOrCreate: jest.fn(async (storeId, defaults) => {
      stored = new StoreTheme({
        id: 'theme_1',
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
      return stored;
    }),
    updateDraftTokens: jest.fn(),
    updateDraftSections: jest.fn(),
    updateDraftsByTemplateAndActive: jest.fn(),
    publish: jest.fn(async (storeId, params) => {
      captured.push({ method: 'publish', args: [storeId, params] });
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
        version: params.version,
      });
      return stored;
    }),
    swapRollback: jest.fn(),
  };

  const templateRepo: ITemplateRepository = {
    findActive: jest.fn(),
    findActiveByKey: jest.fn(async (key) => setup.templates?.[key] ?? null),
  };

  const assembler = new StoreThemeAssembler();
  const useCase = new PublishThemeUseCase(
    storeThemeRepo,
    templateRepo,
    assembler,
  );

  return { useCase, storeThemeRepo, templateRepo, captured };
}

describe('PublishThemeUseCase', () => {
  it('400 si no hay draft para el activeTemplate', async () => {
    const theme = buildTheme({
      activeTemplate: 'inexistente',
      draftsByTemplate: {
        vitrina: {
          tree: { template: 'vitrina' },
          tokens: {},
          updatedAt: '2026-04-20T10:00:00Z',
        },
      },
    });
    const { useCase } = buildMocks({ initialTheme: theme });
    await expect(useCase.execute('store_1')).rejects.toThrow(BadRequestException);
  });

  it('primer publish: rollback queda null, version pasa de 1 a 2, publishedAt seteado', async () => {
    const theme = buildTheme();
    const { useCase, captured } = buildMocks({ initialTheme: theme });

    const out = await useCase.execute('store_1');
    expect(out.publishedTemplate).toBe('vitrina');
    expect(out.rollback).toBeNull();
    expect(out.version).toBe(2);
    expect(out.publishedAt).toBeTruthy();

    expect(captured).toHaveLength(1);
    const params = captured[0].args[1] as Record<string, unknown>;
    expect(params.publishedTemplate).toBe('vitrina');
    expect(params.rollbackTemplate).toBeNull();
    expect(params.rollbackTree).toBeNull();
    expect(params.rollbackTokens).toBeNull();
    expect(params.version).toBe(2);
  });

  it('segundo publish: rollback toma el published anterior, version sube, draft permanece', async () => {
    const draftTree = { template: 'vitrina', templateVersion: 1, sections: [{ type: 'hero', key: 'hero_main' }] };
    const draftTokens = { palette: { primary: '#222' } };

    const theme = buildTheme({
      activeTemplate: 'vitrina',
      publishedTemplate: 'vitrina',
      publishedTree: { sections: ['old_published_tree'] },
      publishedTokens: { palette: { primary: '#aaa' } },
      version: 3,
      draftsByTemplate: {
        vitrina: {
          tree: draftTree,
          tokens: draftTokens,
          updatedAt: '2026-04-22T10:00:00Z',
        },
      },
    });
    const { useCase, captured } = buildMocks({ initialTheme: theme });

    const out = await useCase.execute('store_1');
    expect(out.version).toBe(4);
    expect(out.published?.tree).toEqual(draftTree);
    expect(out.published?.tokens).toEqual(draftTokens);
    expect(out.rollback?.template).toBe('vitrina');
    expect(out.rollback?.tree).toEqual({ sections: ['old_published_tree'] });

    // Draft sigue intacto en respuesta del assembler.
    expect(out.draft.tree).toEqual(draftTree);

    const params = captured[0].args[1] as Record<string, unknown>;
    expect(params.rollbackTemplate).toBe('vitrina');
    expect(params.rollbackTree).toEqual({ sections: ['old_published_tree'] });
  });

  it('lazy-create del theme cuando no existe, luego falla 400 (no hay draft del active recién creado? sí lo hay)', async () => {
    const { useCase } = buildMocks({
      initialTheme: null,
      templates: { vitrina: buildTemplate('vitrina') },
    });

    // El lazy-create deja activeTemplate=vitrina y draft de vitrina con defaults,
    // así que publish DEBE poder ejecutarse sin 400.
    const out = await useCase.execute('store_1');
    expect(out.publishedTemplate).toBe('vitrina');
    expect(out.version).toBe(2);
  });
});
