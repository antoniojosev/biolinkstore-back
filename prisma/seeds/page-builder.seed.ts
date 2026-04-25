/**
 * BE-120a — Seeds para el Page Builder.
 *
 * Inserta 8 PalettePresets y 9 Templates (stubs).
 *
 * NOTA: Los `sectionSchema` y `demoDataJson` aqui son MINIMOS / placeholder.
 * El detalle real de cada template (secciones reales, demo data completa,
 * preview images) se completa en BE-120e.
 *
 * Uso:
 *   npx ts-node prisma/seeds/page-builder.seed.ts
 *
 * Idempotente: usa `upsert` por `key`, asi puede correrse multiples veces.
 */

import { PrismaClient, TemplateNiche, Plan, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Palette presets ────────────────────────────────────────────
type PaletteColors = {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
};

interface PaletteSeed {
  key: string;
  name: string;
  colorsJson: PaletteColors;
  sortOrder: number;
}

const PALETTES: PaletteSeed[] = [
  {
    key: 'atardecer',
    name: 'Atardecer',
    sortOrder: 0,
    colorsJson: {
      primary: '#e85d2b',
      secondary: '#f4a261',
      accent: '#fcd29f',
      bg: '#fff8f1',
      surface: '#ffffff',
      text: '#2b1810',
      muted: '#8a6f5f',
      border: '#f1d9c2',
    },
  },
  {
    key: 'noir',
    name: 'Noir',
    sortOrder: 1,
    colorsJson: {
      primary: '#0a0a0a',
      secondary: '#c9a96e',
      accent: '#d4af37',
      bg: '#0d0d0d',
      surface: '#1a1a1a',
      text: '#f5f1e8',
      muted: '#7a7268',
      border: '#2b2620',
    },
  },
  {
    key: 'menta',
    name: 'Menta',
    sortOrder: 2,
    colorsJson: {
      primary: '#10b981',
      secondary: '#6ee7b7',
      accent: '#34d399',
      bg: '#ffffff',
      surface: '#f0fdf4',
      text: '#1f2937',
      muted: '#6b7280',
      border: '#d1fae5',
    },
  },
  {
    key: 'pastel',
    name: 'Pastel',
    sortOrder: 3,
    colorsJson: {
      primary: '#f9a8d4',
      secondary: '#c4b5fd',
      accent: '#fde68a',
      bg: '#fffaf5',
      surface: '#fff5fb',
      text: '#3f3047',
      muted: '#9c8aa5',
      border: '#fad6e8',
    },
  },
  {
    key: 'corporate',
    name: 'Corporate',
    sortOrder: 4,
    colorsJson: {
      primary: '#1e3a8a',
      secondary: '#475569',
      accent: '#0ea5e9',
      bg: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
    },
  },
  {
    key: 'tropical',
    name: 'Tropical',
    sortOrder: 5,
    colorsJson: {
      primary: '#0d9488',
      secondary: '#fb7185',
      accent: '#fcd34d',
      bg: '#fffbeb',
      surface: '#ffffff',
      text: '#134e4a',
      muted: '#5f7e7c',
      border: '#fde68a',
    },
  },
  {
    key: 'monocromo',
    name: 'Monocromo',
    sortOrder: 6,
    colorsJson: {
      primary: '#0a0a0a',
      secondary: '#525252',
      accent: '#737373',
      bg: '#ffffff',
      surface: '#fafafa',
      text: '#0a0a0a',
      muted: '#737373',
      border: '#e5e5e5',
    },
  },
  {
    key: 'tierra',
    name: 'Tierra',
    sortOrder: 7,
    colorsJson: {
      primary: '#b45309',
      secondary: '#65a30d',
      accent: '#d97706',
      bg: '#fffbf5',
      surface: '#fef9f0',
      text: '#3f2a14',
      muted: '#8a7152',
      border: '#e9d8c0',
    },
  },
];

// ─── Default tokens stub helper ──────────────────────────────────
function defaultTokens(primary: string, accent: string) {
  return {
    palette: {
      preset: 'custom',
      primary,
      secondary: '#64748b',
      accent,
      bg: '#ffffff',
      surface: '#fafafa',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e5e7eb',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'md',
    spacing: 'comfortable',
    buttonStyle: 'solid',
  };
}

// ─── Templates ───────────────────────────────────────────────────
interface TemplateSeed {
  key: string;
  name: string;
  niche: TemplateNiche;
  planRequired: Plan;
  sortOrder: number;
  defaultTokens: ReturnType<typeof defaultTokens>;
  sectionSchema: {
    defaultOrder: string[];
    sections: Array<{
      type: string;
      key: string;
      removable: boolean;
      props: Record<string, unknown>;
    }>;
  };
  demoDataJson: {
    store: Record<string, unknown>;
    products: unknown[];
    categories: unknown[];
  };
}

const STUB_DEMO = {
  store: {},
  products: [],
  categories: [],
};

const STUB_SECTION_SCHEMA = {
  defaultOrder: ['hero_main', 'product_grid'],
  sections: [
    { type: 'hero', key: 'hero_main', removable: false, props: {} },
    { type: 'product_grid', key: 'products_main', removable: false, props: {} },
  ],
};

const TEMPLATES: TemplateSeed[] = [
  {
    key: 'vitrina',
    name: 'Vitrina',
    niche: TemplateNiche.GENERAL,
    planRequired: Plan.FREE,
    sortOrder: 0,
    defaultTokens: defaultTokens('#3b82f6', '#06b6d4'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'luxora',
    name: 'Luxora',
    niche: TemplateNiche.FASHION,
    planRequired: Plan.PRO,
    sortOrder: 10,
    defaultTokens: defaultTokens('#0a0a0a', '#d4af37'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'noir',
    name: 'Noir',
    niche: TemplateNiche.FASHION,
    planRequired: Plan.PRO,
    sortOrder: 11,
    defaultTokens: defaultTokens('#0a0a0a', '#c9a96e'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'menu',
    name: 'Menu',
    niche: TemplateNiche.RESTAURANT,
    planRequired: Plan.FREE,
    sortOrder: 20,
    defaultTokens: defaultTokens('#b45309', '#d97706'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'servicios',
    name: 'Servicios',
    niche: TemplateNiche.SERVICES,
    planRequired: Plan.FREE,
    sortOrder: 30,
    defaultTokens: defaultTokens('#1e3a8a', '#0ea5e9'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'inmuebles',
    name: 'Inmuebles',
    niche: TemplateNiche.REAL_ESTATE,
    planRequired: Plan.PRO,
    sortOrder: 40,
    defaultTokens: defaultTokens('#0d9488', '#fb7185'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'poster',
    name: 'Poster',
    niche: TemplateNiche.RESTAURANT,
    planRequired: Plan.PRO,
    sortOrder: 21,
    defaultTokens: defaultTokens('#e85d2b', '#fcd29f'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'atelier',
    name: 'Atelier',
    niche: TemplateNiche.FASHION,
    planRequired: Plan.PRO,
    sortOrder: 12,
    defaultTokens: defaultTokens('#3f3047', '#f9a8d4'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
  {
    key: 'rosier',
    name: 'Rosier',
    niche: TemplateNiche.FASHION,
    planRequired: Plan.PRO,
    sortOrder: 13,
    defaultTokens: defaultTokens('#9d174d', '#fbcfe8'),
    sectionSchema: STUB_SECTION_SCHEMA,
    demoDataJson: STUB_DEMO,
  },
];

// ─── Seed runner ─────────────────────────────────────────────────
async function seedPalettes() {
  for (const palette of PALETTES) {
    const colors = palette.colorsJson as unknown as Prisma.InputJsonValue;
    await prisma.palettePreset.upsert({
      where: { key: palette.key },
      create: {
        key: palette.key,
        name: palette.name,
        colorsJson: colors,
        sortOrder: palette.sortOrder,
        isActive: true,
      },
      update: {
        name: palette.name,
        colorsJson: colors,
        sortOrder: palette.sortOrder,
      },
    });
  }
  console.log(`[page-builder] palettes seeded: ${PALETTES.length}`);
}

async function seedTemplates() {
  for (const template of TEMPLATES) {
    const demoData = template.demoDataJson as unknown as Prisma.InputJsonValue;
    const sectionSchema = template.sectionSchema as unknown as Prisma.InputJsonValue;
    const defaultTokens = template.defaultTokens as unknown as Prisma.InputJsonValue;
    await prisma.template.upsert({
      where: { key: template.key },
      create: {
        key: template.key,
        name: template.name,
        niche: template.niche,
        planRequired: template.planRequired,
        previewImage: null,
        demoDataJson: demoData,
        sectionSchema,
        defaultTokens,
        version: 1,
        sortOrder: template.sortOrder,
        isActive: true,
      },
      update: {
        name: template.name,
        niche: template.niche,
        planRequired: template.planRequired,
        sortOrder: template.sortOrder,
      },
    });
  }
  console.log(`[page-builder] templates seeded: ${TEMPLATES.length}`);
}

export async function runPageBuilderSeed() {
  await seedPalettes();
  await seedTemplates();
}

// Permite correr este archivo directamente.
async function main() {
  await runPageBuilderSeed();
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
