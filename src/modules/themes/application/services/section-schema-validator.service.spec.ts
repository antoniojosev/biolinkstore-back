import {
  SectionSchema,
  validateSections,
} from './section-schema-validator.service';

const SCHEMA_BASE: SectionSchema = {
  defaultOrder: ['hero_main', 'product_grid'],
  sections: [
    {
      type: 'hero',
      key: 'hero_main',
      removable: false,
      props: {
        title: { type: 'text', max: 60 },
        subtitle: { type: 'text', max: 140 },
        layout: { type: 'enum', options: ['left', 'right', 'centered'] },
        showCta: { type: 'boolean' },
        accent: { type: 'color' },
        bg: { type: 'image' },
        weight: { type: 'number', min: 0, max: 100 },
        slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
      },
    },
    {
      type: 'product_grid',
      key: 'products_main',
      removable: false,
      props: {
        columns: { type: 'number', min: 1, max: 6 },
      },
    },
    {
      type: 'gallery',
      key: 'gallery_main',
      removable: true,
      props: {
        items: {
          type: 'list',
          max: 3,
          itemSchema: {
            caption: { type: 'text', max: 40 },
            url: { type: 'image' },
          },
        },
      },
    },
  ],
};

describe('validateSections', () => {
  it('valida text con max correcto', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { title: 'OK' } }],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid[0].props.title).toBe('OK');
  });

  it('rechaza text que excede max', () => {
    const result = validateSections(
      [
        {
          type: 'hero',
          key: 'hero_main',
          props: { title: 'x'.repeat(61) },
        },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/title.*excede max 60/);
  });

  it('descarta enum con valor fuera de options sin fallar el guardado (lenient)', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { layout: 'top' } }],
      SCHEMA_BASE,
    );
    // No falla: el valor inválido se descarta y la sección usa el default del
    // renderer (así quitar/cambiar options no brickea borradores existentes).
    expect(result.errors).toEqual([]);
    expect(result.valid[0].props.layout).toBeUndefined();
  });

  it('acepta enum con valor en options', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { layout: 'centered' } }],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid[0].props.layout).toBe('centered');
  });

  it('rechaza boolean con tipo number', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { showCta: 1 } }],
      SCHEMA_BASE,
    );
    expect(result.errors[0]).toMatch(/showCta.*boolean/);
  });

  it('rechaza string con pattern que no matchea', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { slug: 'NOT VALID' } }],
      SCHEMA_BASE,
    );
    expect(result.errors[0]).toMatch(/slug.*no coincide/);
  });

  it('rechaza number fuera de min/max', () => {
    const r1 = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { weight: -1 } }],
      SCHEMA_BASE,
    );
    expect(r1.errors[0]).toMatch(/weight.*menor que min/);

    const r2 = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { weight: 101 } }],
      SCHEMA_BASE,
    );
    expect(r2.errors[0]).toMatch(/weight.*mayor que max/);
  });

  it('rechaza color que no es hex válido', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { accent: 'red' } }],
      SCHEMA_BASE,
    );
    expect(result.errors[0]).toMatch(/accent.*hex/);
  });

  it('acepta color hex #RRGGBB', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { accent: '#FF00aa' } }],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid[0].props.accent).toBe('#FF00aa');
  });

  it('acepta image como URL string no vacía', () => {
    const result = validateSections(
      [
        {
          type: 'hero',
          key: 'hero_main',
          props: { bg: 'https://cdn.example.com/x.jpg' },
        },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid[0].props.bg).toBe('https://cdn.example.com/x.jpg');
  });

  it('rechaza image cuando es number', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: { bg: 42 } }],
      SCHEMA_BASE,
    );
    expect(result.errors[0]).toMatch(/bg.*URL/);
  });

  it('valida list con itemSchema correctamente', () => {
    const result = validateSections(
      [
        {
          type: 'gallery',
          key: 'gallery_main',
          props: {
            items: [
              { caption: 'Foto 1', url: 'https://x.com/a.jpg' },
              { caption: 'Foto 2', url: 'https://x.com/b.jpg' },
            ],
          },
        },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect((result.valid[0].props.items as unknown[]).length).toBe(2);
  });

  it('rechaza list que excede max', () => {
    const result = validateSections(
      [
        {
          type: 'gallery',
          key: 'gallery_main',
          props: {
            items: [
              { caption: 'a', url: 'https://x.com/a.jpg' },
              { caption: 'b', url: 'https://x.com/b.jpg' },
              { caption: 'c', url: 'https://x.com/c.jpg' },
              { caption: 'd', url: 'https://x.com/d.jpg' },
            ],
          },
        },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors[0]).toMatch(/items.*excede max 3 items/);
  });

  it('rechaza list cuando algún item viola itemSchema (caption max)', () => {
    const result = validateSections(
      [
        {
          type: 'gallery',
          key: 'gallery_main',
          props: {
            items: [
              {
                caption: 'x'.repeat(41),
                url: 'https://x.com/a.jpg',
              },
            ],
          },
        },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors.some((e) => /caption.*excede max/.test(e))).toBe(true);
  });

  it('ignora silenciosamente sección con type no declarado', () => {
    const result = validateSections(
      [
        { type: 'unknown_section', key: 'x', props: { foo: 'bar' } },
        { type: 'hero', key: 'hero_main', props: { title: 'OK' } },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].type).toBe('hero');
  });

  it('ignora silenciosamente props desconocidas dentro de una sección válida', () => {
    const result = validateSections(
      [
        {
          type: 'hero',
          key: 'hero_main',
          props: { title: 'OK', mysteryProp: 'should-be-stripped' },
        },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid[0].props).toEqual({ title: 'OK' });
  });

  it('rechaza key duplicado en el array', () => {
    const result = validateSections(
      [
        { type: 'hero', key: 'hero_main', props: { title: 'A' } },
        { type: 'hero', key: 'hero_main', props: { title: 'B' } },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors[0]).toMatch(/duplicado/);
    expect(result.valid).toHaveLength(1);
  });

  it('default visible=true cuando no viene; respeta variant cuando es string', () => {
    const result = validateSections(
      [
        { type: 'hero', key: 'hero_main', variant: 'compact' },
        { type: 'product_grid', key: 'products_main', visible: false },
      ],
      SCHEMA_BASE,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid[0].visible).toBe(true);
    expect(result.valid[0].variant).toBe('compact');
    expect(result.valid[1].visible).toBe(false);
    expect(result.valid[1].variant).toBeUndefined();
  });

  it('rechaza cuando sections no es un array', () => {
    const result = validateSections({ not: 'array' }, SCHEMA_BASE);
    expect(result.errors[0]).toMatch(/sections.*array/);
  });

  it('devuelve vacío sin errores cuando schema es null/undefined', () => {
    const result = validateSections(
      [{ type: 'hero', key: 'hero_main', props: {} }],
      null,
    );
    expect(result.valid).toEqual([]);
    expect(result.errors).toEqual([]);
  });
});
