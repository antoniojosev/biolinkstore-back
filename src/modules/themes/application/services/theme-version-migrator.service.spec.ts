import { Plan, TemplateNiche } from '@prisma/client';
import { Template } from '../../domain/entities/template.entity';
import {
  MigratorTree,
  migrateTreeToCurrentVersion,
} from './theme-version-migrator.service';

function buildTemplate(
  version: number,
  sectionSchema: Record<string, unknown>,
): Template {
  return new Template({
    id: 'tpl_test',
    key: 'vitrina',
    name: 'Vitrina',
    niche: TemplateNiche.GENERAL,
    planRequired: Plan.FREE,
    previewImage: null,
    demoDataJson: {},
    sectionSchema,
    defaultTokens: {},
    version,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildTree(
  templateVersion: number,
  sections: MigratorTree['sections'],
): MigratorTree {
  return {
    template: 'vitrina',
    templateVersion,
    sections,
  };
}

describe('migrateTreeToCurrentVersion', () => {
  it('templateVersion igual al actual → no cambios, migrated false', () => {
    const template = buildTemplate(2, {
      sections: [{ type: 'hero', key: 'hero_main', props: { title: { type: 'text' } } }],
    });
    const tree = buildTree(2, [
      { type: 'hero', key: 'hero_main', visible: true, props: { title: 'Hi' } },
    ]);

    const result = migrateTreeToCurrentVersion(tree, template);
    expect(result.migrated).toBe(false);
    expect(result.tree).toBe(tree); // mismo objeto, sin clonar
  });

  it('templateVersion mayor que el actual (downgrade) → no muta, migrated false', () => {
    const template = buildTemplate(1, {
      sections: [{ type: 'hero', key: 'hero_main' }],
    });
    const tree = buildTree(5, [
      { type: 'hero', key: 'hero_main', visible: true, props: {} },
    ]);

    const result = migrateTreeToCurrentVersion(tree, template);
    expect(result.migrated).toBe(false);
    expect(result.tree.templateVersion).toBe(5);
  });

  it('drop de sección cuyo type ya no existe en el schema', () => {
    const template = buildTemplate(2, {
      sections: [
        { type: 'hero', key: 'hero_main', props: { title: { type: 'text' } } },
      ],
    });
    const tree = buildTree(1, [
      { type: 'hero', key: 'hero_main', visible: true, props: { title: 'Hi' } },
      // 'gallery_v1' ya no existe en schema → drop
      { type: 'gallery_v1', key: 'gallery', visible: true, props: { items: [] } },
    ]);

    const result = migrateTreeToCurrentVersion(tree, template);
    expect(result.migrated).toBe(true);
    expect(result.tree.sections).toHaveLength(1);
    expect(result.tree.sections[0].type).toBe('hero');
    expect(result.tree.templateVersion).toBe(2);
  });

  it('prop nueva con default declarado se agrega; prop desconocida se dropea', () => {
    const template = buildTemplate(3, {
      sections: [
        {
          type: 'hero',
          key: 'hero_main',
          props: {
            title: { type: 'text' },
            subtitle: { type: 'text' },
            ctaText: { type: 'text' },
          },
          defaults: {
            ctaText: 'Comprar',
          },
        },
      ],
    });
    const tree = buildTree(2, [
      {
        type: 'hero',
        key: 'hero_main',
        visible: true,
        props: {
          title: 'Hi',
          subtitle: 'Sub',
          legacyOldProp: 'remove me', // dropear: no en schema
        },
      },
    ]);

    const result = migrateTreeToCurrentVersion(tree, template);
    expect(result.migrated).toBe(true);
    expect(result.tree.sections).toHaveLength(1);
    const props = result.tree.sections[0].props ?? {};
    expect(props.title).toBe('Hi');
    expect(props.subtitle).toBe('Sub');
    expect(props.ctaText).toBe('Comprar'); // default agregado
    expect(props.legacyOldProp).toBeUndefined(); // dropeado
  });

  it('default no se sobreescribe si la prop ya tiene valor seteado', () => {
    const template = buildTemplate(2, {
      sections: [
        {
          type: 'hero',
          key: 'hero_main',
          props: { ctaText: { type: 'text' } },
          defaults: { ctaText: 'Comprar' },
        },
      ],
    });
    const tree = buildTree(1, [
      { type: 'hero', key: 'hero_main', visible: true, props: { ctaText: 'Reservar' } },
    ]);

    const result = migrateTreeToCurrentVersion(tree, template);
    expect(result.migrated).toBe(true);
    expect(result.tree.sections[0].props?.ctaText).toBe('Reservar');
  });

  it('idempotencia: ejecutar dos veces produce el mismo resultado', () => {
    const template = buildTemplate(3, {
      sections: [
        {
          type: 'hero',
          key: 'hero_main',
          props: { title: { type: 'text' }, ctaText: { type: 'text' } },
          defaults: { ctaText: 'Comprar' },
        },
      ],
    });
    const tree = buildTree(1, [
      {
        type: 'hero',
        key: 'hero_main',
        visible: true,
        props: { title: 'Hi', oldProp: 'x' },
      },
      { type: 'gone', key: 'gone_1', visible: true, props: {} },
    ]);

    const first = migrateTreeToCurrentVersion(tree, template);
    expect(first.migrated).toBe(true);
    const second = migrateTreeToCurrentVersion(first.tree, template);
    expect(second.migrated).toBe(false); // ya está al día
    expect(second.tree).toEqual(first.tree);
  });

  it('múltiples cambios combinados en una sola pasada (drop + add default + drop unknown)', () => {
    const template = buildTemplate(4, {
      sections: [
        {
          type: 'hero',
          key: 'hero_main',
          props: {
            title: { type: 'text' },
            subtitle: { type: 'text' },
            ctaText: { type: 'text' },
          },
          defaults: { ctaText: 'Click' },
        },
        {
          type: 'features',
          key: 'feats',
          props: { items: { type: 'list' } },
        },
      ],
    });

    const tree = buildTree(1, [
      {
        type: 'hero',
        key: 'hero_main',
        visible: true,
        props: { title: 'A', removed: 'x' },
      },
      {
        type: 'gone',
        key: 'gone_1',
        visible: true,
        props: { junk: 1 },
      },
      {
        type: 'features',
        key: 'feats',
        visible: false,
        props: { items: [{ a: 1 }], extra: 'no' },
      },
    ]);

    const out = migrateTreeToCurrentVersion(tree, template);
    expect(out.migrated).toBe(true);
    expect(out.tree.templateVersion).toBe(4);
    expect(out.tree.sections).toHaveLength(2);

    const hero = out.tree.sections[0];
    expect(hero.type).toBe('hero');
    expect(hero.props?.title).toBe('A');
    expect(hero.props?.ctaText).toBe('Click');
    expect(hero.props?.removed).toBeUndefined();

    const feats = out.tree.sections[1];
    expect(feats.type).toBe('features');
    expect(feats.visible).toBe(false);
    expect(feats.props?.items).toEqual([{ a: 1 }]);
    expect(feats.props?.extra).toBeUndefined();
  });

  it('tree corrupto (sin sections array) devuelto tal cual sin migrated', () => {
    const template = buildTemplate(2, {
      sections: [{ type: 'hero', key: 'hero_main' }],
    });
    const broken = { template: 'vitrina', templateVersion: 1 } as unknown as MigratorTree;
    const out = migrateTreeToCurrentVersion(broken, template);
    expect(out.migrated).toBe(false);
    expect(out.tree).toBe(broken);
  });

  it('respeta variant si viene como string', () => {
    const template = buildTemplate(2, {
      sections: [{ type: 'hero', key: 'hero_main', props: {} }],
    });
    const tree = buildTree(1, [
      {
        type: 'hero',
        key: 'hero_main',
        visible: true,
        variant: 'dark',
        props: {},
      },
    ]);

    const out = migrateTreeToCurrentVersion(tree, template);
    expect(out.tree.sections[0].variant).toBe('dark');
  });
});
