/**
 * BE-120e — Seed completo del Page Builder.
 *
 * Inserta 8 PalettePresets + 9 Templates con `sectionSchema` y `demoDataJson`
 * realistas (reemplaza los stubs de BE-120a).
 *
 * Tipos de sección usados (base BE-120 + extensiones de este seed):
 *   hero, socials, product_grid, categories, gallery, hours, contact, map,
 *   about, stats, faq, cta_banner, testimonials, footer
 *   + featured_products  (BE-120e — destacados editoriales)
 *   + text_block         (BE-120e — texto editorial libre)
 *
 * Los nuevos types NO requieren cambios en el SectionSchemaValidator porque
 * éste valida props contra `schema.sections[].type` declarado en el propio
 * template — no mantiene whitelist de types. La adición es transparente.
 *
 * `previewImage` queda null en todos los templates (post-merge: subir a R2).
 *
 * Uso:
 *   npx ts-node prisma/seeds/page-builder.seed.ts
 *
 * Idempotente: usa `upsert` por `key`.
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

// ─── Tokens helpers ──────────────────────────────────────────────
type Tokens = {
  palette: {
    preset: string;
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: 'compact' | 'normal' | 'comfortable';
  };
  radius: 'sm' | 'md' | 'lg' | 'xl';
  spacing: 'compact' | 'normal' | 'comfortable';
  buttonStyle: 'solid' | 'outline' | 'ghost';
};

// ─── Section schema types ────────────────────────────────────────
interface PropDef {
  type:
    | 'text'
    | 'string'
    | 'enum'
    | 'boolean'
    | 'number'
    | 'color'
    | 'image'
    | 'list';
  max?: number;
  min?: number;
  pattern?: string;
  options?: string[];
  itemSchema?: Record<string, PropDef>;
  label?: string;
  default?: unknown;
}

interface SectionDef {
  type: string;
  key: string;
  removable: boolean;
  variants?: string[];
  props: Record<string, PropDef>;
  /**
   * Valores iniciales de las props — el "vestido" de la sección. Con esto
   * nace el árbol (previews Y el borrador del vendedor al activar el tema).
   * Regla: props que el renderer ya resuelve con datos reales de la tienda
   * (headline→nombre, subheadline/tagline/body→bio, contacto, redes) NO
   * llevan default para no pisar lo que el vendedor ya configuró.
   */
  defaults?: Record<string, unknown>;
}

function withDefaults(
  def: SectionDef,
  defaults: Record<string, unknown>,
): SectionDef {
  return { ...def, defaults };
}

interface SectionSchema {
  defaultOrder: string[];
  sections: SectionDef[];
}

// ─── Demo data types ─────────────────────────────────────────────
interface DemoStore {
  name: string;
  slug: string;
  logo: string;
  banner: string;
  phone: string;
  address: string;
  email: string;
  aboutShort: string;
  socials: Array<{ platform: string; url: string }>;
}

interface DemoProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: string[];
  isVisible: boolean;
  category: string;
  sku?: string;
}

interface DemoCategory {
  id: string;
  name: string;
  slug: string;
}

interface DemoData {
  store: DemoStore;
  products: DemoProduct[];
  categories: DemoCategory[];
}

// Receta alternativa curada por el diseñador ("compartimiento del kit de
// pizza"): un set COMPLETO de tokens que cambia la personalidad del tema sin
// romper su estética, aplicable con un tap desde la tab Diseño. La receta
// "Original" no se autora: el frontend la deriva de defaultTokens.
interface StylePreset {
  key: string;
  name: string;
  description?: string;
  tokens: Tokens;
  // Overrides opcionales de sección: solo pisan visible y/o las props que la
  // receta define — nunca el contenido que el vendedor escribió.
  sectionOverrides?: Array<{
    key: string;
    visible?: boolean;
    props?: Record<string, unknown>;
  }>;
}

interface TemplateSeed {
  key: string;
  name: string;
  niche: TemplateNiche;
  planRequired: Plan;
  sortOrder: number;
  defaultTokens: Tokens;
  sectionSchema: SectionSchema;
  demoDataJson: DemoData;
  stylePresets?: StylePreset[];
}

// ─── Helpers ─────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  'IG',
  'TIKTOK',
  'FACEBOOK',
  'TWITTER',
  'YOUTUBE',
  'THREADS',
  'WHATSAPP',
];

// Fotos demo reales (Unsplash — el mismo origen que usaba prod legacy).
// El demo data es parte del diseño del tema: un tema se entrega "vestido",
// con fotos y textos que muestran cómo puede quedar de verdad — nunca
// placeholders grises. Cada ID de este archivo está verificado (HTTP 200).
// Pendiente post-deploy: migrar estas fotos a R2 junto a los screenshots.
function uns(id: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;
}

// ─── Reusable section builders ───────────────────────────────────

function socialsSection(key = 'socials_bar', removable = true): SectionDef {
  return {
    type: 'socials',
    key,
    removable,
    props: {
      items: {
        type: 'list',
        max: 10,
        label: 'Redes sociales',
        itemSchema: {
          platform: { type: 'enum', options: SOCIAL_PLATFORMS, label: 'Plataforma' },
          url: { type: 'string', pattern: '^https?://', label: 'URL' },
        },
      },
    },
  };
}

function footerSection(): SectionDef {
  return {
    type: 'footer',
    key: 'footer_main',
    removable: false,
    props: {
      tagline: { type: 'text', max: 120, label: 'Tagline' },
      showBranding: { type: 'boolean', label: 'Mostrar "Powered by ByLink"' },
    },
  };
}

function contactSection(removable = true): SectionDef {
  return {
    type: 'contact',
    key: 'contact_main',
    removable,
    props: {
      title: { type: 'text', max: 60, label: 'Título' },
      phone: { type: 'string', label: 'Teléfono' },
      email: { type: 'string', label: 'Email' },
      address: { type: 'text', max: 200, label: 'Dirección' },
      showWhatsappCta: { type: 'boolean', label: 'CTA WhatsApp' },
    },
  };
}

function hoursSection(): SectionDef {
  return {
    type: 'hours',
    key: 'hours_main',
    removable: true,
    props: {
      title: { type: 'text', max: 40, label: 'Título' },
      schedule: {
        type: 'list',
        max: 7,
        label: 'Horario semanal',
        itemSchema: {
          day: {
            type: 'enum',
            options: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'],
            label: 'Día',
          },
          open: { type: 'string', pattern: '^[0-9]{2}:[0-9]{2}$', label: 'Apertura' },
          close: { type: 'string', pattern: '^[0-9]{2}:[0-9]{2}$', label: 'Cierre' },
          closed: { type: 'boolean', label: 'Cerrado' },
        },
      },
    },
  };
}

function aboutSection(removable = true, key = 'about_main'): SectionDef {
  return {
    type: 'about',
    key,
    removable,
    props: {
      title: { type: 'text', max: 80, label: 'Título' },
      body: { type: 'text', max: 600, label: 'Cuerpo' },
      image: { type: 'image', label: 'Imagen' },
      layout: {
        type: 'enum',
        options: ['split-left', 'split-right', 'centered'],
        label: 'Disposición',
      },
    },
  };
}

function gallerySection(key = 'gallery_main', removable = true): SectionDef {
  return {
    type: 'gallery',
    key,
    removable,
    variants: ['grid', 'masonry', 'carousel'],
    props: {
      title: { type: 'text', max: 80, label: 'Título' },
      layout: {
        type: 'enum',
        options: ['grid', 'masonry', 'carousel'],
        label: 'Layout',
      },
      items: {
        type: 'list',
        max: 24,
        label: 'Imágenes',
        itemSchema: {
          image: { type: 'image', label: 'Imagen' },
          caption: { type: 'text', max: 80, label: 'Pie de foto' },
        },
      },
    },
  };
}

function ctaBannerSection(): SectionDef {
  return {
    type: 'cta_banner',
    key: 'cta_banner_main',
    removable: true,
    props: {
      headline: { type: 'text', max: 80, label: 'Título' },
      subline: { type: 'text', max: 140, label: 'Subtítulo' },
      ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
      ctaType: {
        type: 'enum',
        options: ['whatsapp', 'scroll', 'external'],
        label: 'Tipo de acción',
      },
      ctaUrl: { type: 'string', label: 'URL' },
      backgroundColor: { type: 'color', label: 'Fondo' },
    },
  };
}

function statsSection(): SectionDef {
  return {
    type: 'stats',
    key: 'stats_main',
    removable: true,
    props: {
      items: {
        type: 'list',
        max: 4,
        label: 'Métricas',
        itemSchema: {
          value: { type: 'text', max: 12, label: 'Valor' },
          label: { type: 'text', max: 40, label: 'Etiqueta' },
        },
      },
    },
  };
}

function faqSection(): SectionDef {
  return {
    type: 'faq',
    key: 'faq_main',
    removable: true,
    props: {
      title: { type: 'text', max: 80, label: 'Título' },
      items: {
        type: 'list',
        max: 12,
        label: 'Preguntas',
        itemSchema: {
          question: { type: 'text', max: 140, label: 'Pregunta' },
          answer: { type: 'text', max: 600, label: 'Respuesta' },
        },
      },
    },
  };
}

function testimonialsSection(): SectionDef {
  return {
    type: 'testimonials',
    key: 'testimonials_main',
    removable: true,
    variants: ['cards', 'carousel'],
    props: {
      title: { type: 'text', max: 80, label: 'Título' },
      layout: {
        type: 'enum',
        options: ['cards', 'carousel'],
        label: 'Layout',
      },
      items: {
        type: 'list',
        max: 12,
        label: 'Testimonios',
        itemSchema: {
          author: { type: 'text', max: 60, label: 'Autor' },
          role: { type: 'text', max: 60, label: 'Rol' },
          quote: { type: 'text', max: 280, label: 'Cita' },
          avatar: { type: 'image', label: 'Foto' },
        },
      },
    },
  };
}

function categoriesSection(removable = true): SectionDef {
  return {
    type: 'categories',
    key: 'categories_strip',
    removable,
    variants: ['pills', 'cards', 'sidebar'],
    props: {
      title: { type: 'text', max: 60, label: 'Título' },
      layout: {
        type: 'enum',
        options: ['pills', 'cards', 'sidebar'],
        label: 'Layout',
      },
      showCount: { type: 'boolean', label: 'Mostrar conteo' },
    },
  };
}

function mapSection(): SectionDef {
  return {
    type: 'map',
    key: 'map_main',
    removable: true,
    props: {
      latitude: { type: 'number', min: -90, max: 90, label: 'Latitud' },
      longitude: { type: 'number', min: -180, max: 180, label: 'Longitud' },
      zoom: { type: 'number', min: 1, max: 20, label: 'Zoom' },
      title: { type: 'text', max: 60, label: 'Título' },
    },
  };
}

// ─── Niche-specific demo data ────────────────────────────────────

function demoFashion(brandKey: string, brandName: string): DemoData {
  const slug = `${brandKey}-demo`;
  return {
    store: {
      name: `${brandName} Demo`,
      slug,
      logo: uns('1539109136881-3be0616acf4b', 200, 200),
      banner: uns('1445205170230-053b83016050', 1600, 600),
      phone: '+584121234567',
      address: 'Av. Principal, Lechería, Anzoátegui',
      email: `hola@${brandKey}.com`,
      aboutShort: `${brandName} — diseño venezolano contemporáneo`,
      socials: [
        { platform: 'IG', url: `https://instagram.com/${brandKey}` },
        { platform: 'TIKTOK', url: `https://tiktok.com/@${brandKey}` },
        { platform: 'WHATSAPP', url: 'https://wa.me/584121234567' },
      ],
    },
    categories: [
      { id: 'cat-vestidos', name: 'Vestidos', slug: 'vestidos' },
      { id: 'cat-tops', name: 'Tops', slug: 'tops' },
      { id: 'cat-pantalones', name: 'Pantalones', slug: 'pantalones' },
      { id: 'cat-accesorios', name: 'Accesorios', slug: 'accesorios' },
    ],
    products: [
      {
        id: 'p-1',
        name: 'Vestido Lino Sahara',
        description:
          'Vestido midi en lino crudo, corte holgado, mangas francesas. Hecho en Caracas.',
        basePrice: 89,
        images: [
          uns('1515886657613-9f3515b0c78f', 600, 800),
          uns('1496747611176-843222e1e57c', 600, 800),
        ],
        isVisible: true,
        category: 'Vestidos',
        sku: 'SH-001',
      },
      {
        id: 'p-2',
        name: 'Top Origami',
        description: 'Blusa estructurada con drapeado asimétrico en seda lavada.',
        basePrice: 64,
        images: [uns('1434389677669-e08b4cac3105', 600, 800)],
        isVisible: true,
        category: 'Tops',
        sku: 'TO-002',
      },
      {
        id: 'p-3',
        name: 'Jean Wide Leg',
        description: 'Jean ancho de tiro alto, lavado índigo con caída.',
        basePrice: 72,
        images: [uns('1541099649105-f69ad21f3246', 600, 800)],
        isVisible: true,
        category: 'Pantalones',
        sku: 'PW-003',
      },
      {
        id: 'p-4',
        name: 'Vestido Jardín',
        description: 'Vestido midi con estampado floral, ideal para la temporada.',
        basePrice: 145,
        images: [uns('1623609163859-ca93c959b98a', 600, 800)],
        isVisible: true,
        category: 'Vestidos',
        sku: 'NO-004',
      },
      {
        id: 'p-5',
        name: 'Collar Sena',
        description: 'Collar de plata 925 con dije minimalista, hecho a mano.',
        basePrice: 38,
        images: [uns('1611591437281-460bfbe1220a', 600, 800)],
        isVisible: true,
        category: 'Accesorios',
        sku: 'CB-005',
      },
      {
        id: 'p-6',
        name: 'Bolso Mini Atelier',
        description: 'Bolso estructurado en piel grabada, asa removible.',
        basePrice: 95,
        images: [uns('1548036328-c9fa89d128fa', 600, 800)],
        isVisible: true,
        category: 'Accesorios',
        sku: 'BO-006',
      },
      {
        id: 'p-7',
        name: 'Chaqueta Cuero Roma',
        description: 'Chaqueta de cuero genuino, corte clásico y duradero.',
        basePrice: 78,
        images: [uns('1551028719-00167b16eac5', 600, 800)],
        isVisible: true,
        category: 'Tops',
        sku: 'CE-007',
      },
      {
        id: 'p-8',
        name: 'Aretes Dorados Luna',
        description: 'Aretes bañados en oro 18k, diseño artesanal.',
        basePrice: 68,
        images: [uns('1617038220319-276d3cfab638', 600, 800)],
        isVisible: true,
        category: 'Accesorios',
        sku: 'FP-008',
      },
    ],
  };
}

function demoRestaurant(brandKey: string, brandName: string): DemoData {
  const slug = `${brandKey}-demo`;
  return {
    store: {
      name: `${brandName} Demo`,
      slug,
      logo: uns('1414235077428-338989a2e8c0', 200, 200),
      banner: uns('1517248135467-4c7edcad34c4', 1600, 600),
      phone: '+584149998877',
      address: 'C.C. Plaza Mayor local 12, Lechería',
      email: `pedidos@${brandKey}.com`,
      aboutShort: `${brandName} — sabores que enamoran`,
      socials: [
        { platform: 'IG', url: `https://instagram.com/${brandKey}` },
        { platform: 'WHATSAPP', url: 'https://wa.me/584149998877' },
      ],
    },
    categories: [
      { id: 'cat-entrantes', name: 'Entrantes', slug: 'entrantes' },
      { id: 'cat-principales', name: 'Principales', slug: 'principales' },
      { id: 'cat-postres', name: 'Postres', slug: 'postres' },
      { id: 'cat-bebidas', name: 'Bebidas', slug: 'bebidas' },
    ],
    products: [
      {
        id: 'm-1',
        name: 'Bowl mediterráneo',
        description:
          'Quinoa, rúcula, tomates confitados, feta y aceite de oliva.',
        basePrice: 12,
        images: [uns('1546069901-ba9599a7e63c', 600, 600)],
        isVisible: true,
        category: 'Entrantes',
      },
      {
        id: 'm-2',
        name: 'Picada de la casa',
        description: 'Selección de quesos, embutidos y panes para compartir.',
        basePrice: 14,
        images: [uns('1504674900247-0877df9cc836', 600, 600)],
        isVisible: true,
        category: 'Entrantes',
      },
      {
        id: 'm-3',
        name: 'Pasta al tartufo',
        description: 'Pasta fresca artesanal, crema de trufa y parmesano.',
        basePrice: 22,
        images: [uns('1621996346565-e3dbc646d9a9', 600, 600)],
        isVisible: true,
        category: 'Principales',
      },
      {
        id: 'm-4',
        name: 'Costillas ahumadas',
        description:
          'Costillas ahumadas 8 horas, glaseado BBQ de la casa, papas rústicas.',
        basePrice: 32,
        images: [uns('1544025162-d76694265947', 600, 600)],
        isVisible: true,
        category: 'Principales',
      },
      {
        id: 'm-5',
        name: 'Pizza artesanal',
        description: 'Masa madre, mozzarella fresca, albahaca y tomate San Marzano.',
        basePrice: 18,
        images: [uns('1565299624946-b28f40a0ae38', 600, 600)],
        isVisible: true,
        category: 'Principales',
      },
      {
        id: 'm-6',
        name: 'Torre de pancakes',
        description: 'Pancakes esponjosos, frutos rojos y miel de maple.',
        basePrice: 9,
        images: [uns('1567620905732-2d1ec7ab7445', 600, 600)],
        isVisible: true,
        category: 'Postres',
      },
      {
        id: 'm-7',
        name: 'Sundae de la casa',
        description: 'Helado artesanal, brownie tibio y salsa de chocolate.',
        basePrice: 8,
        images: [uns('1563805042-7684c019e1cb', 600, 600)],
        isVisible: true,
        category: 'Postres',
      },
      {
        id: 'm-8',
        name: 'Limonada de menta',
        description: 'Limonada natural con hojas de menta y un toque de jengibre.',
        basePrice: 5,
        images: [uns('1513558161293-cdaf765ed2fd', 600, 600)],
        isVisible: true,
        category: 'Bebidas',
      },
    ],
  };
}

function demoServices(): DemoData {
  return {
    store: {
      name: 'Estudio Norte Demo',
      slug: 'servicios-demo',
      logo: uns('1581291518857-4e27b48ff24e', 200, 200),
      banner: uns('1497366216548-37526070297c', 1600, 600),
      phone: '+584125557788',
      address: 'Lechería, Anzoátegui',
      email: 'hola@estudionorte.com',
      aboutShort: 'Diseño y desarrollo digital — equipo de 4 con 8 años de experiencia',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/estudionorte' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584125557788' },
      ],
    },
    categories: [
      { id: 'cat-branding', name: 'Branding', slug: 'branding' },
      { id: 'cat-web', name: 'Web', slug: 'web' },
      { id: 'cat-fotografia', name: 'Fotografía', slug: 'fotografia' },
    ],
    products: [
      {
        id: 's-1',
        name: 'Identidad de marca',
        description:
          'Branding completo: logotipo, paleta, tipografía, manual y aplicaciones.',
        basePrice: 480,
        images: [uns('1499951360447-b19be8fe80f5', 600, 600)],
        isVisible: true,
        category: 'Branding',
      },
      {
        id: 's-2',
        name: 'Sitio web one-page',
        description:
          'Landing page responsive con copywriting y formularios. Entrega en 2 semanas.',
        basePrice: 360,
        images: [uns('1460925895917-afdab827c52f', 600, 600)],
        isVisible: true,
        category: 'Web',
      },
      {
        id: 's-3',
        name: 'E-commerce básico',
        description: 'Tienda online lista para vender, hasta 50 productos cargados.',
        basePrice: 720,
        images: [uns('1497366754035-f200968a6e72', 600, 600)],
        isVisible: true,
        category: 'Web',
      },
      {
        id: 's-4',
        name: 'Sesión de producto',
        description: 'Hasta 20 fotografías de producto en estudio, fondo blanco.',
        basePrice: 220,
        images: [uns('1526170375885-4d8ecf77b99f', 600, 600)],
        isVisible: true,
        category: 'Fotografía',
      },
      {
        id: 's-5',
        name: 'Sesión lifestyle',
        description: 'Fotografía editorial en locación, hasta 30 imágenes finales.',
        basePrice: 320,
        images: [uns('1531746020798-e6953c6e8e04', 600, 600)],
        isVisible: true,
        category: 'Fotografía',
      },
      {
        id: 's-6',
        name: 'Auditoría UX',
        description:
          'Revisión heurística + recomendaciones priorizadas. Entrega en 1 semana.',
        basePrice: 180,
        images: [uns('1497366811353-6870744d04b2', 600, 600)],
        isVisible: true,
        category: 'Branding',
      },
    ],
  };
}

function demoRealEstate(): DemoData {
  return {
    store: {
      name: 'Norte Inmuebles Demo',
      slug: 'inmuebles-demo',
      logo: uns('1560518883-ce09059eeffa', 200, 200),
      banner: uns('1512917774080-9991f1c4c750', 1600, 600),
      phone: '+584145556677',
      address: 'Av. Diego Bautista Urbaneja, Lechería',
      email: 'ventas@norteinmuebles.com',
      aboutShort:
        'Inmobiliaria boutique en el oriente venezolano. 12 años conectando familias con sus hogares.',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/norteinmuebles' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584145556677' },
      ],
    },
    categories: [
      { id: 'cat-apartamentos', name: 'Apartamentos', slug: 'apartamentos' },
      { id: 'cat-casas', name: 'Casas', slug: 'casas' },
      { id: 'cat-locales', name: 'Locales', slug: 'locales' },
    ],
    products: [
      {
        id: 'i-1',
        name: 'Apartamento Lomas del Mar — 3hab',
        description:
          '120m², 3 habitaciones, 2 baños, vista al mar, edificio con piscina y conserje 24h.',
        basePrice: 95000,
        images: [
          uns('1522708323590-d24dbb6b0267', 600, 400),
          uns('1600607687939-ce8a6c25118c', 600, 400),
        ],
        isVisible: true,
        category: 'Apartamentos',
      },
      {
        id: 'i-2',
        name: 'Casa El Morro — 4hab',
        description:
          '280m², jardín, piscina privada, 4 habitaciones suite, 3 estacionamientos.',
        basePrice: 220000,
        images: [
          uns('1600596542815-ffad4c1539a9', 600, 400),
          uns('1613490493576-7fde63acd811', 600, 400),
        ],
        isVisible: true,
        category: 'Casas',
      },
      {
        id: 'i-3',
        name: 'Apartamento Pueblo Viejo — 2hab',
        description: '85m², 2 habitaciones, balcón, edificio reciente con gym.',
        basePrice: 68000,
        images: [uns('1560448204-e02f11c3d0e2', 600, 400)],
        isVisible: true,
        category: 'Apartamentos',
      },
      {
        id: 'i-4',
        name: 'Local comercial CC Plaza Mayor',
        description:
          '60m² planta libre, alta circulación, ideal para tienda o oficina.',
        basePrice: 45000,
        images: [uns('1441986300917-64674bd600d8', 600, 400)],
        isVisible: true,
        category: 'Locales',
      },
      {
        id: 'i-5',
        name: 'Townhouse Costa Azul',
        description:
          '180m² en conjunto cerrado, 3 habitaciones, terraza, garaje techado.',
        basePrice: 145000,
        images: [uns('1600585154340-be6161a56a0c', 600, 400)],
        isVisible: true,
        category: 'Casas',
      },
      {
        id: 'i-6',
        name: 'Apartamento Centro Lechería',
        description: '70m² recién remodelado, equipado, listo para habitar.',
        basePrice: 52000,
        images: [uns('1493809842364-78817add7ffb', 600, 400)],
        isVisible: true,
        category: 'Apartamentos',
      },
    ],
  };
}

function demoPortfolio(): DemoData {
  return {
    store: {
      name: 'Valentina Ríos Demo',
      slug: 'portfolio-demo',
      logo: uns('1494790108377-be9c29b29330', 200, 200),
      banner: uns('1452587925148-ce544e77e70d', 1600, 600),
      phone: '+584145559911',
      address: 'Caracas, Venezuela',
      email: 'hola@valentinarios.com',
      aboutShort: 'Fotógrafa y directora de arte — retratos, eventos y branding visual',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/valentinarios' },
        { platform: 'TIKTOK', url: 'https://tiktok.com/@valentinarios' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584145559911' },
      ],
    },
    categories: [
      { id: 'cat-retratos', name: 'Retratos', slug: 'retratos' },
      { id: 'cat-eventos', name: 'Eventos', slug: 'eventos' },
      { id: 'cat-branding', name: 'Branding', slug: 'branding' },
    ],
    products: [
      {
        id: 'p-1',
        name: 'Sesión de retratos',
        description:
          'Sesión de 1 hora en estudio o locación. 15 fotografías editadas, entrega digital en 5 días.',
        basePrice: 120,
        images: [
          uns('1529626455594-4ff0802cfb7e', 600, 600),
          uns('1531746020798-e6953c6e8e04', 600, 600),
        ],
        isVisible: true,
        category: 'Retratos',
      },
      {
        id: 'p-2',
        name: 'Cobertura de evento',
        description:
          'Hasta 4 horas de cobertura. 80+ fotografías editadas, galería online privada.',
        basePrice: 350,
        images: [
          uns('1511795409834-ef04bbd61622', 600, 600),
          uns('1519741497674-611481863552', 600, 600),
        ],
        isVisible: true,
        category: 'Eventos',
      },
      {
        id: 'p-3',
        name: 'Contenido para marcas',
        description:
          'Pack mensual: 12 fotografías de producto/lifestyle listas para redes, con dirección de arte.',
        basePrice: 280,
        images: [uns('1542038784456-1ea8e935640e', 600, 600)],
        isVisible: true,
        category: 'Branding',
      },
      {
        id: 'p-4',
        name: 'Retrato corporativo',
        description: 'Headshots profesionales para equipos, mínimo 3 personas. Fondo neutro.',
        basePrice: 60,
        images: [uns('1507003211169-0a1dd7228f2d', 600, 600)],
        isVisible: true,
        category: 'Retratos',
      },
      {
        id: 'p-5',
        name: 'Mini sesión express',
        description: '20 minutos, 5 fotografías editadas. Ideal para perfiles y CV.',
        basePrice: 45,
        images: [uns('1438761681033-6461ffad8d80', 600, 600)],
        isVisible: true,
        category: 'Retratos',
      },
      {
        id: 'p-6',
        name: 'Dirección de arte editorial',
        description:
          'Concepto, moodboard, producción y post para editoriales de moda o producto.',
        basePrice: 500,
        images: [uns('1539109136881-3be0616acf4b', 600, 600)],
        isVisible: true,
        category: 'Branding',
      },
    ],
  };
}

function demoGeneral(): DemoData {
  return {
    store: {
      name: 'Tienda Demo',
      slug: 'vitrina-demo',
      logo: uns('1560343090-f0409e92791a', 200, 200),
      banner: uns('1441986300917-64674bd600d8', 1600, 600),
      phone: '+584123334455',
      address: 'Lechería, Anzoátegui',
      email: 'hola@tienda.com',
      aboutShort: 'Productos seleccionados con cariño',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/tienda' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584123334455' },
      ],
    },
    categories: [
      { id: 'cat-novedades', name: 'Novedades', slug: 'novedades' },
      { id: 'cat-bestsellers', name: 'Bestsellers', slug: 'bestsellers' },
      { id: 'cat-ofertas', name: 'Ofertas', slug: 'ofertas' },
    ],
    products: [
      {
        id: 'g-1',
        name: 'Sneakers Urbanas',
        description: 'Lo que más se vende esta temporada, suela de goma.',
        basePrice: 25,
        images: [uns('1542291026-7eec264c27ff', 600, 600)],
        isVisible: true,
        category: 'Bestsellers',
      },
      {
        id: 'g-2',
        name: 'Audífonos Bluetooth',
        description: 'Recién llegados al catálogo, 30 horas de batería.',
        basePrice: 32,
        images: [uns('1505740420928-5e560c06d30e', 600, 600)],
        isVisible: true,
        category: 'Novedades',
      },
      {
        id: 'g-3',
        name: 'Lentes de Sol Retro',
        description: 'Protección UV400, montura liviana.',
        basePrice: 48,
        images: [uns('1572635196237-14b3f281503f', 600, 600)],
        isVisible: true,
        category: 'Ofertas',
      },
      {
        id: 'g-4',
        name: 'Cámara Instantánea',
        description: 'Edición limitada — solo 50 unidades disponibles.',
        basePrice: 65,
        images: [uns('1526170375885-4d8ecf77b99f', 600, 600)],
        isVisible: true,
        category: 'Novedades',
      },
      {
        id: 'g-5',
        name: 'Reloj Minimal',
        description: 'Clásico del catálogo: siempre disponible, siempre vigente.',
        basePrice: 22,
        images: [uns('1523275335684-37898b6baf30', 600, 600)],
        isVisible: true,
        category: 'Bestsellers',
      },
      {
        id: 'g-6',
        name: 'Perfume Noir',
        description: 'Oferta del mes: 30% de descuento por tiempo limitado.',
        basePrice: 18,
        images: [uns('1585386959984-a4155224a1ad', 600, 600)],
        isVisible: true,
        category: 'Ofertas',
      },
    ],
  };
}

// ─── Templates ───────────────────────────────────────────────────

// VITRINA — GENERAL FREE: hero + categorías + product grid + socials + footer
const vitrinaTemplate: TemplateSeed = {
  key: 'vitrina',
  name: 'Vitrina',
  niche: TemplateNiche.GENERAL,
  planRequired: Plan.FREE,
  sortOrder: 0,
  defaultTokens: {
    palette: {
      preset: 'vitrina',
      primary: '#0F6BA8',
      secondary: '#E7F2FA',
      accent: '#FF6B4A',
      bg: '#FAFAF7',
      surface: '#ffffff',
      text: '#1f2937',
      muted: '#64748b',
      border: '#e8e8e4',
    },
    typography: {
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'md',
    spacing: 'normal',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'categories_strip',
      'product_grid_main',
      'socials_bar',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
          ctaUrl: { type: 'string', label: 'URL CTA' },
        },
        defaults: {
          layout: 'compact',
          image: uns('1505740420928-5e560c06d30e', 1600, 900),
          kicker: 'Nueva temporada',
        },
      },
      categoriesSection(true),
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-2', 'grid-3', 'grid-4', 'list'],
        props: {
          title: { type: 'text', max: 60, label: 'Título sección' },
          layout: {
            type: 'enum',
            options: ['grid-2', 'grid-3', 'grid-4', 'list'],
            label: 'Layout',
          },
          filterByCategory: { type: 'boolean', label: 'Filtro por categoría' },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
          showSku: { type: 'boolean', label: 'Mostrar SKU' },
        },
      },
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoGeneral(),
  stylePresets: [
    {
      key: 'vitrina-calida',
      name: 'Vitrina Cálida',
      description: 'Terracota y crema con serifas — de corporativo a boutique.',
      tokens: {
        palette: {
          preset: 'tierra',
          primary: '#c2410c',
          secondary: '#78584a',
          accent: '#d97706',
          bg: '#fdf8f3',
          surface: '#f8f0e7',
          text: '#3d2c22',
          muted: '#8a7365',
          border: '#eadfd2',
        },
        typography: {
          headingFont: 'Lora',
          bodyFont: 'Inter',
          scale: 'normal',
        },
        radius: 'lg',
        spacing: 'comfortable',
        buttonStyle: 'solid',
      },
    },
  ],
};

// LUXORA — FASHION PRO: hero + product grid + featured + socials + footer
const luxoraTemplate: TemplateSeed = {
  key: 'luxora',
  name: 'Luxora',
  niche: TemplateNiche.FASHION,
  planRequired: Plan.PRO,
  sortOrder: 10,
  defaultTokens: {
    palette: {
      preset: 'monocromo',
      primary: '#1A1A1A',
      secondary: '#4a4a4a',
      accent: '#1A1A1A',
      bg: '#fafaf8',
      surface: '#F0F0EC',
      text: '#1A1A1A',
      muted: '#737373',
      border: '#EAEAE6',
    },
    typography: {
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'sm',
    spacing: 'comfortable',
    buttonStyle: 'outline',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'featured_main',
      'product_grid_main',
      'socials_bar',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
          ctaUrl: { type: 'string', label: 'URL CTA' },
          overlay: { type: 'boolean', label: 'Overlay oscuro' },
        },
        defaults: {
          layout: 'compact',
          image: uns('1515886657613-9f3515b0c78f', 900, 1100),
          kicker: 'Colección SS26',
        },
      },
      {
        type: 'featured_products',
        key: 'featured_main',
        removable: true,
        variants: ['grid', 'carousel', 'spotlight'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid', 'carousel', 'spotlight'],
            label: 'Layout',
          },
          productIds: {
            type: 'list',
            max: 6,
            label: 'IDs productos destacados',
            itemSchema: {
              id: { type: 'string', label: 'Product ID' },
            },
          },
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-2', 'grid-3', 'grid-4'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid-2', 'grid-3', 'grid-4'],
            label: 'Layout',
          },
          filterByCategory: { type: 'boolean', label: 'Filtro por categoría' },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoFashion('luxora', 'Luxora'),
};

// NOIR — FASHION PRO editorial: hero + featured + product grid + stats + footer
const noirTemplate: TemplateSeed = {
  key: 'noir',
  name: 'Noir',
  niche: TemplateNiche.FASHION,
  planRequired: Plan.PRO,
  sortOrder: 11,
  defaultTokens: {
    palette: {
      preset: 'noir',
      primary: '#0a0a0a',
      secondary: '#C9A86C',
      accent: '#C9A86C',
      bg: '#0A0A0A',
      surface: '#161616',
      text: '#F0EDE8',
      muted: '#7a7268',
      border: '#1A1A1A',
    },
    typography: {
      headingFont: 'Source Serif 4',
      bodyFont: 'Inter',
      scale: 'comfortable',
    },
    radius: 'sm',
    spacing: 'comfortable',
    buttonStyle: 'outline',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'featured_main',
      'product_grid_main',
      'stats_main',
      'socials_bar',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
          videoUrl: { type: 'string', label: 'Video URL' },
          overlayOpacity: { type: 'number', min: 0, max: 1, label: 'Opacidad overlay' },
        },
        defaults: {
          layout: 'banner',
          image: uns('1558769132-cb1aea458c5e', 1600, 900),
          kicker: 'Édition Noir',
        },
      },
      {
        type: 'featured_products',
        key: 'featured_main',
        removable: true,
        variants: ['grid', 'carousel', 'spotlight'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid', 'carousel', 'spotlight'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          productIds: {
            type: 'list',
            max: 4,
            label: 'IDs destacados',
            itemSchema: {
              id: { type: 'string', label: 'Product ID' },
            },
          },
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-2', 'grid-3'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid-2', 'grid-3'],
            label: 'Layout',
          },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      withDefaults(statsSection(), {
        items: [
          { value: '+120', label: 'Piezas exclusivas' },
          { value: '8', label: 'Colecciones' },
          { value: '4.9★', label: 'Valoración' },
        ],
      }),
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoFashion('noir', 'Noir'),
  stylePresets: [
    {
      key: 'noir-calido',
      name: 'Noir Cálido',
      description: 'El mismo negro, pero con bronce y ámbar en vez de oro frío.',
      tokens: {
        palette: {
          preset: 'noir',
          primary: '#14100c',
          secondary: '#d9a066',
          accent: '#d97706',
          bg: '#14100c',
          surface: '#211a14',
          text: '#f7efe3',
          muted: '#8a7a68',
          border: '#332a20',
        },
        typography: {
          headingFont: 'Fraunces',
          bodyFont: 'Inter',
          scale: 'comfortable',
        },
        radius: 'sm',
        spacing: 'comfortable',
        buttonStyle: 'outline',
      },
    },
    {
      key: 'noir-contraste',
      name: 'Noir Contraste',
      description: 'Noir invertido: blanco y negro editorial con un rojo quirúrgico.',
      tokens: {
        palette: {
          preset: 'monocromo',
          primary: '#0a0a0a',
          secondary: '#404040',
          accent: '#dc2626',
          bg: '#ffffff',
          surface: '#f5f5f5',
          text: '#0a0a0a',
          muted: '#737373',
          border: '#e5e5e5',
        },
        typography: {
          headingFont: 'Space Grotesk',
          bodyFont: 'Inter',
          scale: 'comfortable',
        },
        radius: 'sm',
        spacing: 'comfortable',
        buttonStyle: 'solid',
      },
    },
  ],
};

// MENU — RESTAURANT FREE: hero + product_grid agrupado + hours + contact + footer
const menuTemplate: TemplateSeed = {
  key: 'menu',
  name: 'Menu',
  niche: TemplateNiche.RESTAURANT,
  planRequired: Plan.FREE,
  sortOrder: 20,
  defaultTokens: {
    palette: {
      preset: 'tierra',
      primary: '#b45309',
      secondary: '#16a34a',
      accent: '#B45309',
      bg: '#FFF8F0',
      surface: '#ffffff',
      text: '#111827',
      muted: '#8a7152',
      border: '#E8DDD3',
    },
    typography: {
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'md',
    spacing: 'normal',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'product_grid_main',
      'hours_main',
      'contact_main',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
        defaults: {
          layout: 'compact',
          image: uns('1414235077428-338989a2e8c0', 1600, 900),
          kicker: 'Cocina de autor',
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['category', 'none'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          groupBy: {
            type: 'enum',
            options: ['category', 'none'],
            label: 'Agrupar por',
          },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
          showImage: { type: 'boolean', label: 'Mostrar imagen' },
        },
      },
      hoursSection(),
      contactSection(false),
      footerSection(),
    ],
  },
  demoDataJson: demoRestaurant('menu', 'Cocina Norte'),
  stylePresets: [
    {
      key: 'menu-nocturno',
      name: 'Menú Nocturno',
      description: 'Versión de cena: fondo oscuro, ámbar cálido y serifas.',
      tokens: {
        palette: {
          preset: 'noir',
          primary: '#f59e0b',
          secondary: '#a3e635',
          accent: '#fbbf24',
          bg: '#1c1917',
          surface: '#292524',
          text: '#f5f0e8',
          muted: '#a89d8d',
          border: '#3f3a34',
        },
        typography: {
          headingFont: 'Lora',
          bodyFont: 'Inter',
          scale: 'normal',
        },
        radius: 'md',
        spacing: 'normal',
        buttonStyle: 'solid',
      },
    },
  ],
};

// SERVICIOS — SERVICES FREE: hero + product_grid + gallery + about + hours + contact + footer
const serviciosTemplate: TemplateSeed = {
  key: 'servicios',
  name: 'Servicios',
  niche: TemplateNiche.SERVICES,
  planRequired: Plan.FREE,
  sortOrder: 30,
  defaultTokens: {
    palette: {
      preset: 'corporate',
      primary: '#1e3a8a',
      secondary: '#475569',
      accent: '#0ea5e9',
      bg: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
    },
    typography: {
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'md',
    spacing: 'normal',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'product_grid_main',
      'gallery_main',
      'about_main',
      'hours_main',
      'contact_main',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
        defaults: {
          layout: 'split',
          image: uns('1497366811353-6870744d04b2', 900, 700),
          kicker: 'Estudio creativo',
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-2', 'list'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid-2', 'list'],
            label: 'Layout',
          },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      withDefaults(gallerySection('gallery_main', true), {
        items: [
          { image: uns('1499951360447-b19be8fe80f5', 600, 600) },
          { image: uns('1460925895917-afdab827c52f', 600, 600) },
          { image: uns('1526170375885-4d8ecf77b99f', 600, 600) },
          { image: uns('1497366216548-37526070297c', 600, 600) },
        ],
      }),
      withDefaults(aboutSection(true), { image: uns('1581291518857-4e27b48ff24e', 800, 600) }),
      hoursSection(),
      contactSection(false),
      footerSection(),
    ],
  },
  demoDataJson: demoServices(),
};

// INMUEBLES — REAL_ESTATE PRO: hero + product_grid (real-estate cards) + about + contact + map + footer
const inmueblesTemplate: TemplateSeed = {
  key: 'inmuebles',
  name: 'Inmuebles',
  niche: TemplateNiche.REAL_ESTATE,
  planRequired: Plan.PRO,
  sortOrder: 40,
  defaultTokens: {
    palette: {
      preset: 'premium',
      primary: '#1a3550',
      secondary: '#0a0a0a',
      accent: '#1a3550',
      bg: '#ffffff',
      surface: '#f6f5f3',
      text: '#0a0a0a',
      muted: '#4a4a4a',
      border: '#e5e3df',
    },
    typography: {
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'md',
    spacing: 'normal',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'product_grid_main',
      'about_main',
      'contact_main',
      'map_main',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
        defaults: {
          layout: 'banner',
          image: uns('1564013799919-ab600027ffc6', 1600, 900),
          kicker: 'Tu próximo hogar',
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-2', 'list'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid-2', 'list'],
            label: 'Layout',
          },
          showFilters: { type: 'boolean', label: 'Mostrar filtros' },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      withDefaults(aboutSection(true), { image: uns('1600607687939-ce8a6c25118c', 800, 600) }),
      contactSection(false),
      withDefaults(mapSection(), { latitude: 10.1907, longitude: -64.6883, zoom: 14 }),
      footerSection(),
    ],
  },
  demoDataJson: demoRealEstate(),
};

// POSTER — RESTAURANT PRO premium: hero + gallery + product_grid + about + contact + cta_banner + footer
const posterTemplate: TemplateSeed = {
  key: 'poster',
  name: 'Poster',
  niche: TemplateNiche.RESTAURANT,
  planRequired: Plan.PRO,
  sortOrder: 21,
  defaultTokens: {
    palette: {
      preset: 'atardecer',
      primary: '#7a1818',
      secondary: '#f4a23a',
      accent: '#ffd07a',
      bg: '#4a0a0a',
      surface: '#2e0606',
      text: '#fff4e0',
      muted: '#a08070',
      border: '#5a1a1a',
    },
    typography: {
      headingFont: 'Anton',
      bodyFont: 'Inter',
      scale: 'comfortable',
    },
    radius: 'lg',
    spacing: 'comfortable',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'gallery_main',
      'product_grid_main',
      'about_main',
      'contact_main',
      'cta_banner_main',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
          overlayOpacity: { type: 'number', min: 0, max: 1, label: 'Opacidad overlay' },
        },
        defaults: {
          layout: 'compact',
          image: uns('1555939594-58d7cb561ad1', 1600, 900),
          kicker: 'Del horno a tu mesa',
        },
      },
      withDefaults(gallerySection('gallery_main', true), {
        items: [
          { image: uns('1546069901-ba9599a7e63c', 600, 600) },
          { image: uns('1565299624946-b28f40a0ae38', 600, 600) },
          { image: uns('1567620905732-2d1ec7ab7445', 600, 600) },
          { image: uns('1544025162-d76694265947', 600, 600) },
        ],
      }),
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['category', 'none'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          groupBy: {
            type: 'enum',
            options: ['category', 'none'],
            label: 'Agrupar por',
          },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      withDefaults(aboutSection(true), { image: uns('1517248135467-4c7edcad34c4', 800, 600) }),
      contactSection(false),
      withDefaults(ctaBannerSection(), {
        headline: '¿Se te antojó?',
        subline: 'Pedidos por WhatsApp — entregamos el mismo día en Lechería y Puerto La Cruz.',
        ctaLabel: 'Pedir ahora',
      }),
      footerSection(),
    ],
  },
  demoDataJson: demoRestaurant('poster', 'Poster Cocina'),
};

// ATELIER — FASHION PRO editorial: hero + featured + product_grid + about + gallery + socials + footer
const atelierTemplate: TemplateSeed = {
  key: 'atelier',
  name: 'Atelier',
  niche: TemplateNiche.FASHION,
  planRequired: Plan.PRO,
  sortOrder: 12,
  defaultTokens: {
    palette: {
      preset: 'monocromo',
      primary: '#1f1b18',
      secondary: '#4a423b',
      accent: '#8a4f2a',
      bg: '#e9e2d3',
      surface: '#fbf8f2',
      text: '#1f1b18',
      muted: '#7a6f63',
      border: '#e7e0d0',
    },
    typography: {
      headingFont: 'Fraunces',
      bodyFont: 'Inter',
      scale: 'comfortable',
    },
    radius: 'sm',
    spacing: 'comfortable',
    buttonStyle: 'outline',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'featured_main',
      'editorial_block',
      'product_grid_main',
      'about_main',
      'gallery_main',
      'socials_bar',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
        defaults: {
          layout: 'banner',
          image: uns('1483985988355-763728e1935b', 1600, 900),
          kicker: 'Hecho a mano',
        },
      },
      {
        type: 'featured_products',
        key: 'featured_main',
        removable: true,
        variants: ['grid', 'carousel', 'spotlight'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid', 'carousel', 'spotlight'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          productIds: {
            type: 'list',
            max: 4,
            label: 'IDs destacados',
            itemSchema: {
              id: { type: 'string', label: 'Product ID' },
            },
          },
        },
      },
      {
        type: 'text_block',
        key: 'editorial_block',
        removable: true,
        variants: ['editorial', 'centered-quote', 'two-column'],
        props: {
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 120, label: 'Título' },
          body: { type: 'text', max: 600, label: 'Texto' },
          layout: {
            type: 'enum',
            options: ['editorial', 'centered-quote', 'two-column'],
            label: 'Layout',
          },
          align: {
            type: 'enum',
            options: ['left', 'center', 'right'],
            label: 'Alineación',
          },
        },
        defaults: {
          kicker: 'Nuestra historia',
          headline: 'Cada pieza cuenta una historia',
          body:
            'Trabajamos con artesanos locales y producciones pequeñas: telas nobles, tintes naturales y cortes pensados para durar. Lo que ves en la tienda se hizo a mano, sin apuro.',
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-3', 'grid-4'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid-3', 'grid-4'],
            label: 'Layout',
          },
          filterByCategory: { type: 'boolean', label: 'Filtro por categoría' },
        },
      },
      withDefaults(aboutSection(true), { image: uns('1445205170230-053b83016050', 800, 600) }),
      withDefaults(gallerySection('gallery_main', true), {
        items: [
          { image: uns('1521572163474-6864f9cf17ab', 600, 600) },
          { image: uns('1542272604-787c3835535d', 600, 600) },
          { image: uns('1551028719-00167b16eac5', 600, 600) },
          { image: uns('1611591437281-460bfbe1220a', 600, 600) },
        ],
      }),
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoFashion('atelier', 'Atelier'),
};

// ROSIER — FASHION luxury rose+cream: hero + product_grid (swatches) + featured + socials + footer
const rosierTemplate: TemplateSeed = {
  key: 'rosier',
  name: 'Rosier',
  niche: TemplateNiche.FASHION,
  planRequired: Plan.PRO,
  sortOrder: 13,
  defaultTokens: {
    palette: {
      preset: 'pastel',
      primary: '#c8334c',
      secondary: '#1a1413',
      accent: '#c8334c',
      bg: '#fdfaf6',
      surface: '#f5ece2',
      text: '#1a1413',
      muted: '#78685f',
      border: '#e8dfd8',
    },
    typography: {
      headingFont: 'Fraunces',
      bodyFont: 'Inter',
      scale: 'comfortable',
    },
    radius: 'lg',
    spacing: 'comfortable',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'product_grid_main',
      'featured_main',
      'testimonials_main',
      'socials_bar',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['split', 'compact', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['split', 'compact', 'banner'],
            label: 'Layout',
          },
          headline: { type: 'text', max: 120, label: 'Título' },
          subheadline: { type: 'text', max: 200, label: 'Descripción' },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          ctaPrimaryLabel: { type: 'text', max: 24, label: 'CTA principal' },
          ctaSecondaryLabel: { type: 'text', max: 24, label: 'CTA secundario' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
        defaults: {
          layout: 'split',
          image: uns('1496747611176-843222e1e57c', 900, 1100),
          kicker: 'Nueva colección',
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-2', 'grid-3'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid-2', 'grid-3'],
            label: 'Layout',
          },
          showSwatches: { type: 'boolean', label: 'Mostrar variantes color' },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      {
        type: 'featured_products',
        key: 'featured_main',
        removable: true,
        variants: ['grid', 'carousel', 'spotlight'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['grid', 'carousel', 'spotlight'],
            label: 'Layout',
          },
          productIds: {
            type: 'list',
            max: 4,
            label: 'IDs destacados',
            itemSchema: {
              id: { type: 'string', label: 'Product ID' },
            },
          },
        },
      },
      withDefaults(testimonialsSection(), {
        items: [
          { quote: 'Las piezas son más lindas en persona — la calidad se nota apenas abres la caja.', author: 'María Fernanda', role: 'Clienta desde 2024', avatar: uns('1494790108377-be9c29b29330', 200, 200) },
          { quote: 'Pedí el jueves y el sábado ya lo tenía en Puerto La Cruz. Impecable.', author: 'Andreína G.', role: 'Compra online', avatar: uns('1438761681033-6461ffad8d80', 200, 200) },
          { quote: 'Compré un regalo para mi esposa y quedó encantada con el empaque.', author: 'Luis D.', role: 'Cliente', avatar: uns('1500648767791-00dcc994a43e', 200, 200) },
        ],
      }),
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoFashion('rosier', 'Rosier'),
};

// ESTATE — REAL_ESTATE premium (port del legacy components/templates/estate,
// rama feat/multi-currency-rates): navy #1A3A52 + dorado #D4AF37, header de
// asesor, chips de filtro, grid 2 col. Aproximación por secciones — la
// versión pixel-fiel (specs hab/baños/m², guardados) llegará con su renderer
// custom en una fase futura (ver docs/plan-temas-recetas.md Fase E).
const estateTemplate: TemplateSeed = {
  key: 'estate',
  name: 'Estate',
  niche: TemplateNiche.REAL_ESTATE,
  planRequired: Plan.PRO,
  sortOrder: 41,
  defaultTokens: {
    palette: {
      preset: 'corporate',
      primary: '#1A3A52',
      secondary: '#4a6076',
      accent: '#D4AF37',
      bg: '#F8F9FA',
      surface: '#ffffff',
      text: '#1A3A52',
      muted: '#6b7684',
      border: '#e5e8ec',
    },
    typography: {
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'lg',
    spacing: 'normal',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'categories_strip',
      'product_grid_main',
      'about_main',
      'testimonials_main',
      'contact_main',
      'map_main',
      'socials_bar',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['compact', 'split', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          layout: {
            type: 'enum',
            options: ['compact', 'split', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
        defaults: {
          layout: 'compact',
          kicker: 'Asesor inmobiliario',
        },
      },
      categoriesSection(true),
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grid-2', 'grid-3', 'list'],
        props: {
          title: { type: 'text', max: 60, label: 'Título sección' },
          layout: {
            type: 'enum',
            options: ['grid-2', 'grid-3', 'list'],
            label: 'Layout',
          },
          filterByCategory: { type: 'boolean', label: 'Filtro por categoría' },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      withDefaults(aboutSection(true), { image: uns('1600566753190-17f0baa2a6c3', 800, 600) }),
      withDefaults(testimonialsSection(), {
        items: [
          { quote: 'Vendieron mi apartamento en 3 semanas, con todo el proceso transparente.', author: 'Gabriela M.', role: 'Vendedora', avatar: uns('1494790108377-be9c29b29330', 200, 200) },
          { quote: 'Nos acompañaron en la compra desde el exterior — papeles, visitas por video, todo.', author: 'Ricardo P.', role: 'Comprador', avatar: uns('1507003211169-0a1dd7228f2d', 200, 200) },
        ],
      }),
      contactSection(true),
      withDefaults(mapSection(), { latitude: 10.1907, longitude: -64.6883, zoom: 14 }),
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoRealEstate(),
};

// PERSONA — PORTFOLIO (port del legacy components/templates/persona, rama
// feat/multi-currency-rates): perfil social minimal, acento casi negro,
// servicios en lista + portfolio en grid. Aproximación por secciones — las
// tabs Servicios/Portfolio del legacy las recupera el renderer custom
// PersonaRenderer (Fase E, esta misma iteración).
const personaTemplate: TemplateSeed = {
  key: 'persona',
  name: 'Persona',
  niche: TemplateNiche.PORTFOLIO,
  planRequired: Plan.FREE,
  sortOrder: 50,
  defaultTokens: {
    palette: {
      preset: 'monocromo',
      primary: '#2d2d2d',
      secondary: '#6b7280',
      accent: '#2d2d2d',
      bg: '#ffffff',
      surface: '#f7f7f7',
      text: '#1a1a1a',
      muted: '#6b7280',
      border: '#e5e7eb',
    },
    typography: {
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'lg',
    spacing: 'normal',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
      'stats_main',
      'product_grid_main',
      'gallery_main',
      'about_main',
      'socials_bar',
      'footer_main',
    ],
    sections: [
      {
        type: 'hero',
        key: 'hero_main',
        removable: false,
        variants: ['compact', 'split', 'banner'],
        props: {
          image: { type: 'image', label: 'Foto de perfil / cover' },
          layout: {
            type: 'enum',
            options: ['compact', 'split', 'banner'],
            label: 'Layout',
          },
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 80, label: 'Nombre / título' },
          subheadline: { type: 'text', max: 140, label: 'Bio corta' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
        defaults: {
          layout: 'compact',
          image: uns('1452587925148-ce544e77e70d', 1200, 600),
        },
      },
      withDefaults(statsSection(), {
        items: [
          { value: '+180', label: 'Sesiones' },
          { value: '+90', label: 'Clientes felices' },
          { value: '6', label: 'Años de oficio' },
        ],
      }),
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['list', 'grid-2', 'grid-3'],
        props: {
          title: { type: 'text', max: 60, label: 'Título sección' },
          layout: {
            type: 'enum',
            options: ['list', 'grid-2', 'grid-3'],
            label: 'Layout',
          },
          filterByCategory: { type: 'boolean', label: 'Filtro por categoría' },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      withDefaults(gallerySection('gallery_main', true), {
        items: [
          { image: uns('1529626455594-4ff0802cfb7e', 600, 600) },
          { image: uns('1511795409834-ef04bbd61622', 600, 600) },
          { image: uns('1519741497674-611481863552', 600, 600) },
          { image: uns('1531746020798-e6953c6e8e04', 600, 600) },
          { image: uns('1542038784456-1ea8e935640e', 600, 600) },
          { image: uns('1539109136881-3be0616acf4b', 600, 600) },
        ],
      }),
      withDefaults(aboutSection(true), { image: uns('1531746020798-e6953c6e8e04', 800, 600) }),
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoPortfolio(),
};

const TEMPLATES: TemplateSeed[] = [
  vitrinaTemplate,
  luxoraTemplate,
  noirTemplate,
  menuTemplate,
  serviciosTemplate,
  inmueblesTemplate,
  posterTemplate,
  atelierTemplate,
  rosierTemplate,
  estateTemplate,
  personaTemplate,
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
    // JsonNull explícito cuando el template no define recetas: mantiene la DB
    // sincronizada con el seed (si una receta se retira, desaparece).
    const stylePresets = template.stylePresets
      ? (template.stylePresets as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull;
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
        stylePresets,
        version: 1,
        sortOrder: template.sortOrder,
        isActive: true,
      },
      update: {
        name: template.name,
        niche: template.niche,
        planRequired: template.planRequired,
        sortOrder: template.sortOrder,
        demoDataJson: demoData,
        sectionSchema,
        defaultTokens,
        stylePresets,
        // version intencionalmente NO se bumpea aquí: BE-120 nunca publicó nada,
        // y bumpear forzaría migración lazy innecesaria.
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
