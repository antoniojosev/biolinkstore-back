import { NotFoundException } from '@nestjs/common';
import { Plan, TemplateNiche } from '@prisma/client';
import { Template } from '../../domain/entities/template.entity';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { GetTemplatePreviewUseCase } from './get-template-preview.use-case';

function buildTemplate(overrides: Partial<Template> = {}): Template {
  return new Template({
    id: 'tpl_atelier',
    key: 'atelier',
    name: 'Atelier',
    niche: TemplateNiche.FASHION,
    planRequired: Plan.PRO,
    previewImage: 'r2://atelier.png',
    demoDataJson: {
      store: { name: 'Demo Store' },
      products: [{ name: 'Demo p1' }],
      categories: [{ name: 'Demo cat 1' }],
    },
    sectionSchema: {
      defaultOrder: ['hero_main'],
      sections: [{ type: 'hero', key: 'hero_main' }],
    },
    defaultTokens: { palette: { primary: '#C9A86C' } },
    version: 2,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function buildMocks(template: Template | null) {
  const templateRepo: ITemplateRepository = {
    findActive: jest.fn(),
    // findActiveByKey filtra por isActive=true en la implementación Prisma —
    // mock equivalente: si recibimos un template "inactivo" simulamos null.
    findActiveByKey: jest.fn(async (key) => {
      if (!template) return null;
      if (template.key !== key) return null;
      if (!template.isActive) return null;
      return template;
    }),
  };
  return { useCase: new GetTemplatePreviewUseCase(templateRepo), templateRepo };
}

describe('GetTemplatePreviewUseCase', () => {
  it('404 cuando el template no existe', async () => {
    const { useCase } = buildMocks(null);
    await expect(useCase.execute('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('404 cuando el template existe pero está inactivo', async () => {
    const { useCase } = buildMocks(buildTemplate({ isActive: false }));
    await expect(useCase.execute('atelier')).rejects.toThrow(NotFoundException);
  });

  it('happy path: devuelve metadata + demoData + tree default + tokens default', async () => {
    const tpl = buildTemplate();
    const { useCase } = buildMocks(tpl);
    const out = await useCase.execute('atelier');

    expect(out.template).toBe('atelier');
    expect(out.templateVersion).toBe(2);
    expect(out.name).toBe('Atelier');
    expect(out.niche).toBe(TemplateNiche.FASHION);
    expect(out.demoData).toEqual(tpl.demoDataJson);
    // tree default proviene de defaultTreeFor → respeta sectionSchema.defaultOrder.
    expect(out.tree).toEqual({
      template: 'atelier',
      templateVersion: 2,
      sections: [
        { type: 'hero', key: 'hero_main', visible: true, props: {} },
      ],
    });
    expect(out.tokens).toEqual({ palette: { primary: '#C9A86C' } });
  });

  it('demoData=null en catálogo → expone {} (no rompe response)', async () => {
    const tpl = buildTemplate({ demoDataJson: null });
    const { useCase } = buildMocks(tpl);
    const out = await useCase.execute('atelier');
    expect(out.demoData).toEqual({});
  });
});
