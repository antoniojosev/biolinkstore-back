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

interface TemplateSeed {
  key: string;
  name: string;
  niche: TemplateNiche;
  planRequired: Plan;
  sortOrder: number;
  defaultTokens: Tokens;
  sectionSchema: SectionSchema;
  demoDataJson: DemoData;
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

function img(
  size: string,
  bg = 'eeeeee',
  fg = '333333',
  text = 'demo',
): string {
  // placehold.co soporta /WxH/bg/fg?text=...
  const safe = encodeURIComponent(text);
  return `https://placehold.co/${size}/${bg}/${fg}?text=${safe}`;
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
      logo: img('200x200', '1a1a1a', 'f5f1e8', brandName),
      banner: img('1600x600', '1a1a1a', 'c9a86c', `${brandName} SS26`),
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
          img('600x800', 'f4ede0', '1a1a1a', 'Vestido+Sahara'),
          img('600x800', 'e8d5b7', '1a1a1a', 'Sahara+back'),
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
        images: [img('600x800', 'fafaf8', '0a0a0a', 'Top+Origami')],
        isVisible: true,
        category: 'Tops',
        sku: 'TO-002',
      },
      {
        id: 'p-3',
        name: 'Pantalón Wide Leg',
        description: 'Pantalón ancho de tiro alto, tela fluida con caída.',
        basePrice: 72,
        images: [img('600x800', '2b2620', 'f5f1e8', 'Wide+Leg')],
        isVisible: true,
        category: 'Pantalones',
        sku: 'PW-003',
      },
      {
        id: 'p-4',
        name: 'Vestido Noir',
        description: 'Vestido negro corte sirena, escote V profundo, ocasión especial.',
        basePrice: 145,
        images: [img('600x800', '0a0a0a', 'd4af37', 'Noir+Dress')],
        isVisible: true,
        category: 'Vestidos',
        sku: 'NO-004',
      },
      {
        id: 'p-5',
        name: 'Cinturón Trenzado',
        description: 'Cinturón en cuero italiano, hebilla dorada antiqua.',
        basePrice: 38,
        images: [img('600x800', 'c9a86c', '1a1a1a', 'Cinturon')],
        isVisible: true,
        category: 'Accesorios',
        sku: 'CB-005',
      },
      {
        id: 'p-6',
        name: 'Bolso Mini Atelier',
        description: 'Bolso estructurado en piel grabada, asa removible.',
        basePrice: 95,
        images: [img('600x800', 'e8d5b7', '0a0a0a', 'Bolso+Mini')],
        isVisible: true,
        category: 'Accesorios',
        sku: 'BO-006',
      },
      {
        id: 'p-7',
        name: 'Camisa Edición',
        description: 'Camisa fluida en algodón egipcio, cuello solapa.',
        basePrice: 78,
        images: [img('600x800', 'fafaf8', '4a423b', 'Camisa+Edicion')],
        isVisible: true,
        category: 'Tops',
        sku: 'CE-007',
      },
      {
        id: 'p-8',
        name: 'Falda Plisada',
        description: 'Falda midi plisada en satín, cintura elastizada.',
        basePrice: 68,
        images: [img('600x800', 'f9a8d4', '3f3047', 'Falda+Plisada')],
        isVisible: true,
        category: 'Vestidos',
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
      logo: img('200x200', '7a1818', 'f4a23a', brandName),
      banner: img('1600x600', '4a0a0a', 'fff4e0', `${brandName} Cocina`),
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
        name: 'Carpaccio de res',
        description:
          'Lonjas finas de solomillo, rúcula, parmesano y aceite de trufa.',
        basePrice: 12,
        images: [img('600x600', 'fdf6e3', '7a1818', 'Carpaccio')],
        isVisible: true,
        category: 'Entrantes',
      },
      {
        id: 'm-2',
        name: 'Burrata Caprese',
        description: 'Burrata fresca, tomate confitado, albahaca y pesto casero.',
        basePrice: 14,
        images: [img('600x600', 'fff4e0', '1f3330', 'Burrata')],
        isVisible: true,
        category: 'Entrantes',
      },
      {
        id: 'm-3',
        name: 'Risotto de hongos',
        description: 'Arroz arborio cremoso, mezcla de hongos, brandy y parmesano.',
        basePrice: 22,
        images: [img('600x600', '8a4f2a', 'fff4e0', 'Risotto')],
        isVisible: true,
        category: 'Principales',
      },
      {
        id: 'm-4',
        name: 'Lomo en salsa de vino',
        description:
          'Solomillo madurado 21 días, reducción de Malbec, papas anna.',
        basePrice: 32,
        images: [img('600x600', '4a0a0a', 'fff4e0', 'Lomo')],
        isVisible: true,
        category: 'Principales',
      },
      {
        id: 'm-5',
        name: 'Pasta del día',
        description: 'Pasta fresca artesanal con la salsa que prepara el chef.',
        basePrice: 18,
        images: [img('600x600', 'fcd29f', '4a0a0a', 'Pasta')],
        isVisible: true,
        category: 'Principales',
      },
      {
        id: 'm-6',
        name: 'Tiramisú clásico',
        description: 'Bizcocho empapado en café, mascarpone y cacao amargo.',
        basePrice: 9,
        images: [img('600x600', '8a4f2a', 'fff4e0', 'Tiramisu')],
        isVisible: true,
        category: 'Postres',
      },
      {
        id: 'm-7',
        name: 'Cheesecake de fresa',
        description: 'Cheesecake horneado, base de galleta, coulis de fresa.',
        basePrice: 8,
        images: [img('600x600', 'fff4e0', 'c8334c', 'Cheesecake')],
        isVisible: true,
        category: 'Postres',
      },
      {
        id: 'm-8',
        name: 'Limonada de menta',
        description: 'Limonada natural con hojas de menta y un toque de jengibre.',
        basePrice: 5,
        images: [img('600x600', 'd1fae5', '134e4a', 'Limonada')],
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
      logo: img('200x200', '1e3a8a', 'ffffff', 'EN'),
      banner: img('1600x600', '0f172a', '0ea5e9', 'Estudio+Norte'),
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
        images: [img('600x600', 'f8fafc', '1e3a8a', 'Branding')],
        isVisible: true,
        category: 'Branding',
      },
      {
        id: 's-2',
        name: 'Sitio web one-page',
        description:
          'Landing page responsive con copywriting y formularios. Entrega en 2 semanas.',
        basePrice: 360,
        images: [img('600x600', '0ea5e9', 'ffffff', 'One+Page')],
        isVisible: true,
        category: 'Web',
      },
      {
        id: 's-3',
        name: 'E-commerce básico',
        description: 'Tienda online lista para vender, hasta 50 productos cargados.',
        basePrice: 720,
        images: [img('600x600', '475569', 'ffffff', 'Ecommerce')],
        isVisible: true,
        category: 'Web',
      },
      {
        id: 's-4',
        name: 'Sesión de producto',
        description: 'Hasta 20 fotografías de producto en estudio, fondo blanco.',
        basePrice: 220,
        images: [img('600x600', 'e2e8f0', '0f172a', 'Producto')],
        isVisible: true,
        category: 'Fotografía',
      },
      {
        id: 's-5',
        name: 'Sesión lifestyle',
        description: 'Fotografía editorial en locación, hasta 30 imágenes finales.',
        basePrice: 320,
        images: [img('600x600', '64748b', 'ffffff', 'Lifestyle')],
        isVisible: true,
        category: 'Fotografía',
      },
      {
        id: 's-6',
        name: 'Auditoría UX',
        description:
          'Revisión heurística + recomendaciones priorizadas. Entrega en 1 semana.',
        basePrice: 180,
        images: [img('600x600', 'f8fafc', '475569', 'UX+Audit')],
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
      logo: img('200x200', '0d9488', 'ffffff', 'NI'),
      banner: img('1600x600', '134e4a', 'fcd34d', 'Norte+Inmuebles'),
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
          img('600x400', 'fcd34d', '134e4a', 'Lomas+del+Mar'),
          img('600x400', '0d9488', 'ffffff', 'Vista+al+mar'),
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
        images: [img('600x400', '14b8a6', 'ffffff', 'Casa+El+Morro')],
        isVisible: true,
        category: 'Casas',
      },
      {
        id: 'i-3',
        name: 'Apartamento Pueblo Viejo — 2hab',
        description: '85m², 2 habitaciones, balcón, edificio reciente con gym.',
        basePrice: 68000,
        images: [img('600x400', 'fb7185', 'ffffff', 'Pueblo+Viejo')],
        isVisible: true,
        category: 'Apartamentos',
      },
      {
        id: 'i-4',
        name: 'Local comercial CC Plaza Mayor',
        description:
          '60m² planta libre, alta circulación, ideal para tienda o oficina.',
        basePrice: 45000,
        images: [img('600x400', '0d9488', 'fcd34d', 'Local+Plaza+Mayor')],
        isVisible: true,
        category: 'Locales',
      },
      {
        id: 'i-5',
        name: 'Townhouse Costa Azul',
        description:
          '180m² en conjunto cerrado, 3 habitaciones, terraza, garaje techado.',
        basePrice: 145000,
        images: [img('600x400', '5f7e7c', 'ffffff', 'Townhouse')],
        isVisible: true,
        category: 'Casas',
      },
      {
        id: 'i-6',
        name: 'Apartamento Centro Lechería',
        description: '70m² recién remodelado, equipado, listo para habitar.',
        basePrice: 52000,
        images: [img('600x400', 'fde68a', '134e4a', 'Apto+Centro')],
        isVisible: true,
        category: 'Apartamentos',
      },
    ],
  };
}

function demoGeneral(): DemoData {
  return {
    store: {
      name: 'Tienda Demo',
      slug: 'vitrina-demo',
      logo: img('200x200', '3b82f6', 'ffffff', 'TD'),
      banner: img('1600x600', '1e40af', 'ffffff', 'Tienda+Demo'),
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
        name: 'Producto destacado',
        description: 'Lo que más se vende esta temporada.',
        basePrice: 25,
        images: [img('600x600', '06b6d4', 'ffffff', 'Bestseller')],
        isVisible: true,
        category: 'Bestsellers',
      },
      {
        id: 'g-2',
        name: 'Novedad de la semana',
        description: 'Recién llegado al catálogo.',
        basePrice: 32,
        images: [img('600x600', '3b82f6', 'ffffff', 'Nuevo')],
        isVisible: true,
        category: 'Novedades',
      },
      {
        id: 'g-3',
        name: 'Combo familiar',
        description: 'Pack pensado para compartir.',
        basePrice: 48,
        images: [img('600x600', '1e40af', 'ffffff', 'Combo')],
        isVisible: true,
        category: 'Ofertas',
      },
      {
        id: 'g-4',
        name: 'Edición limitada',
        description: 'Solo 50 unidades disponibles.',
        basePrice: 65,
        images: [img('600x600', '0ea5e9', 'ffffff', 'Limited')],
        isVisible: true,
        category: 'Novedades',
      },
      {
        id: 'g-5',
        name: 'Clásico del catálogo',
        description: 'Siempre disponible, siempre vigente.',
        basePrice: 22,
        images: [img('600x600', '64748b', 'ffffff', 'Clasico')],
        isVisible: true,
        category: 'Bestsellers',
      },
      {
        id: 'g-6',
        name: 'Oferta del mes',
        description: '30% de descuento por tiempo limitado.',
        basePrice: 18,
        images: [img('600x600', 'f59e0b', 'ffffff', 'Oferta')],
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
      preset: 'corporate',
      primary: '#3b82f6',
      secondary: '#475569',
      accent: '#06b6d4',
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
      primary: '#0a0a0a',
      secondary: '#525252',
      accent: '#d4af37',
      bg: '#fafaf8',
      surface: '#ffffff',
      text: '#0a0a0a',
      muted: '#737373',
      border: '#e5e5e5',
    },
    typography: {
      headingFont: 'Playfair Display',
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
        variants: ['full-screen', 'editorial', 'split'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
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
      },
      {
        type: 'featured_products',
        key: 'featured_main',
        removable: true,
        variants: ['carousel', 'grid-2'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
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
      secondary: '#c9a96e',
      accent: '#d4af37',
      bg: '#0d0d0d',
      surface: '#1a1a1a',
      text: '#f5f1e8',
      muted: '#7a7268',
      border: '#2b2620',
    },
    typography: {
      headingFont: 'Playfair Display',
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
        variants: ['cinematic', 'full-screen'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
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
      },
      {
        type: 'featured_products',
        key: 'featured_main',
        removable: true,
        variants: ['editorial-pair', 'spotlight-single'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
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
      statsSection(),
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoFashion('noir', 'Noir'),
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
      secondary: '#65a30d',
      accent: '#d97706',
      bg: '#fffbf5',
      surface: '#fef9f0',
      text: '#3f2a14',
      muted: '#8a7152',
      border: '#e9d8c0',
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
        variants: ['banner', 'split'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grouped-by-category', 'list'],
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
        variants: ['split', 'banner'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['services-cards', 'list'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['services-cards', 'list'],
            label: 'Layout',
          },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      gallerySection('gallery_main', true),
      aboutSection(true),
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
      preset: 'tropical',
      primary: '#0d9488',
      secondary: '#475569',
      accent: '#fcd34d',
      bg: '#ffffff',
      surface: '#f8fafc',
      text: '#134e4a',
      muted: '#5f7e7c',
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
        variants: ['split', 'banner', 'with-search'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
          headline: { type: 'text', max: 80, label: 'Título' },
          subheadline: { type: 'text', max: 140, label: 'Subtítulo' },
          ctaLabel: { type: 'text', max: 24, label: 'Texto botón' },
          ctaType: {
            type: 'enum',
            options: ['whatsapp', 'scroll', 'external'],
            label: 'Tipo CTA',
          },
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['cards-real-estate', 'list-detailed'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['cards-real-estate', 'list-detailed'],
            label: 'Layout',
          },
          showFilters: { type: 'boolean', label: 'Mostrar filtros' },
          showPrice: { type: 'boolean', label: 'Mostrar precio' },
        },
      },
      aboutSection(true),
      contactSection(false),
      mapSection(),
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
        variants: ['full-screen-cta', 'cinematic'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
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
      },
      gallerySection('gallery_main', true),
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['grouped-by-category', 'showcase-poster'],
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
      aboutSection(true),
      contactSection(false),
      ctaBannerSection(),
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
      bg: '#f2ede2',
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
        variants: ['editorial', 'full-screen'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
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
      },
      {
        type: 'featured_products',
        key: 'featured_main',
        removable: true,
        variants: ['editorial-pair', 'collection-strip'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
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
        variants: ['centered-quote', 'two-column'],
        props: {
          kicker: { type: 'text', max: 40, label: 'Antetítulo' },
          headline: { type: 'text', max: 120, label: 'Título' },
          body: { type: 'text', max: 600, label: 'Texto' },
          align: {
            type: 'enum',
            options: ['left', 'center', 'right'],
            label: 'Alineación',
          },
        },
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['collections', 'grid-3'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['collections', 'grid-3', 'grid-4'],
            label: 'Layout',
          },
          filterByCategory: { type: 'boolean', label: 'Filtro por categoría' },
        },
      },
      aboutSection(true),
      gallerySection('gallery_main', true),
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
      accent: '#f5ece2',
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
        variants: ['rose-bloom', 'full-screen'],
        props: {
          image: { type: 'image', label: 'Imagen hero' },
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
      },
      {
        type: 'product_grid',
        key: 'product_grid_main',
        removable: false,
        variants: ['with-swatches', 'grid-2', 'grid-3'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
          layout: {
            type: 'enum',
            options: ['with-swatches', 'grid-2', 'grid-3'],
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
        variants: ['hero-card', 'split-pair'],
        props: {
          title: { type: 'text', max: 60, label: 'Título' },
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
      testimonialsSection(),
      socialsSection(),
      footerSection(),
    ],
  },
  demoDataJson: demoFashion('rosier', 'Rosier'),
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
        demoDataJson: demoData,
        sectionSchema,
        defaultTokens,
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
