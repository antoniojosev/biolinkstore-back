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

interface DemoAttribute {
  name: string;
  type: 'text' | 'color';
  // Sin role (o 'variant') = eje seleccionable en el detalle · 'spec'/'tag' =
  // ficha de inmueble · 'ingredient-included'/'ingredient-extra' = flujo
  // "arma tu…" del tema poster (mismos roles que los seeds verticales).
  role?: string;
  options: string[];
  optionsMeta?: Record<string, { hex?: string; priceDelta?: number }>;
}

interface DemoProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  isVisible: boolean;
  featured?: boolean;
  tagline?: string;
  category: string;
  sku?: string;
  attributes?: DemoAttribute[];
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
    // Sin `title`/`layout`: los temas con sección categorías (vitrina, luxora,
    // estate) tienen su UI de categorías propia y no leían esos props — eran
    // controles muertos en el inspector. `showCount` sí lo honran (conteo por
    // categoría en las pills).
    props: {
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
// Las tiendas demo son las MISMAS que se curaron para prod (ver
// prisma/seeds/seed-ropa.ts, seed-restaurant.ts, seed-inmuebles.ts y
// seed-servicios.ts): Noire Boutique, Brooklyn Burger House, Andrea Torres
// Propiedades y Daniel Mendoza. Ese demo data es parte del diseño de cada
// tema — si se toca un seed vertical hay que reflejarlo acá. Las fotos viven
// en frontend/public/demo-assets/**.

const ROPA = '/demo-assets/ropa';
const REST = '/demo-assets/restaurant';
const INMU = '/demo-assets/inmuebles';
const SERV = '/demo-assets/servicios';

/** Eje de color con hex por opción (swatches en el detalle de producto). */
function colorAxis(name: string, opts: Record<string, string>): DemoAttribute {
  return {
    name,
    type: 'color',
    options: Object.keys(opts),
    optionsMeta: Object.fromEntries(Object.entries(opts).map(([k, v]) => [k, { hex: v }])),
  };
}

/** Eje de texto simple (tallas, sabores, estampas…). */
function textAxis(name: string, options: string[]): DemoAttribute {
  return { name, type: 'text', options };
}

interface FashionDef {
  name: string;
  desc: string;
  price: number;
  compare?: number;
  cat: string;
  images: string[];
  featured?: boolean;
  attrs?: DemoAttribute[];
}

// Noire Boutique — catálogo completo de seed-ropa.ts (22 piezas, 8 categorías).
const FASHION_PRODUCTS: FashionDef[] = [
  {
    name: 'Vestido Midi Satín',
    desc: 'Vestido midi en satín fluido con tirantes regulables. Corte sesgado que estiliza. Forrado. Ideal para eventos y cenas.',
    price: 98,
    compare: 130,
    cat: 'Mujer',
    featured: true,
    images: ['vestidoSatin.jpg', 'vestidoSatinB.jpg'],
    attrs: [
      textAxis('Talla', ['XS', 'S', 'M', 'L', 'XL']),
      colorAxis('Color', { Negro: '#1A1413', Champagne: '#E8D4A8', 'Borgoña': '#6B1F2E' }),
    ],
  },
  {
    name: 'Blazer Oversize Estructurado',
    desc: 'Blazer de corte oversize con hombros estructurados. Doble botonadura dorada. Forro de viscosa. Atemporal.',
    price: 128,
    cat: 'Mujer',
    featured: true,
    images: ['blazerMujer.jpg', 'blazerMujerB.jpg'],
    attrs: [
      textAxis('Talla', ['XS', 'S', 'M', 'L']),
      colorAxis('Color', { Negro: '#1A1413', Crema: '#F1E4CF', Camel: '#C49A6C' }),
    ],
  },
  {
    name: 'Blusa de Seda Cuello V',
    desc: 'Blusa de seda natural con cuello en V y manga francesa. Caída impecable. Se combina tanto con jean como con traje.',
    price: 72,
    cat: 'Mujer',
    images: ['blusaSeda.jpg'],
    attrs: [
      textAxis('Talla', ['XS', 'S', 'M', 'L']),
      colorAxis('Color', { Marfil: '#F1E4CF', Negro: '#1A1413', 'Rosa Seco': '#C89B9B' }),
    ],
  },
  {
    name: 'Pantalón Palazzo de Crepe',
    desc: 'Pantalón palazzo de crepe con cintura alta y pinzas delanteras. Pierna ancha con caída fluida. Se ajusta con elástico interno.',
    price: 88,
    compare: 110,
    cat: 'Mujer',
    featured: true,
    images: ['pantalonPalazzo.jpg', 'pantalonPalazzoB.jpg'],
    attrs: [
      textAxis('Talla', ['XS', 'S', 'M', 'L', 'XL']),
      colorAxis('Color', { Negro: '#1A1413', Beige: '#D4C5A9', Chocolate: '#5B3A29' }),
    ],
  },
  {
    name: 'Falda Midi Plisada',
    desc: 'Falda midi plisada en satín con cintura elástica. Largo favorecedor. Movimiento elegante al caminar.',
    price: 68,
    cat: 'Mujer',
    images: ['faldaMidi.jpg'],
    attrs: [
      textAxis('Talla', ['XS', 'S', 'M', 'L']),
      colorAxis('Color', { Esmeralda: '#2E4A3C', Negro: '#1A1413', Marfil: '#F1E4CF' }),
    ],
  },
  {
    name: 'Top Crop Punto Fino',
    desc: 'Top crop en punto fino con escote cuadrado. Tejido elástico que se adapta al cuerpo. Pieza clave del guardarropa.',
    price: 48,
    cat: 'Mujer',
    images: ['topCrop.jpg'],
    attrs: [
      textAxis('Talla', ['XS', 'S', 'M', 'L']),
      colorAxis('Color', { Negro: '#1A1413', Blanco: '#FAFAFA', Rojo: '#9B2237' }),
    ],
  },
  {
    name: 'Abrigo Largo de Lana',
    desc: 'Abrigo largo 100% lana con solapa ancha y cinturón. Forrado completo. Invierno con estilo atemporal.',
    price: 220,
    compare: 280,
    cat: 'Mujer',
    featured: true,
    images: ['abrigoLana.jpg', 'abrigoLanaB.jpg'],
    attrs: [
      textAxis('Talla', ['S', 'M', 'L', 'XL']),
      colorAxis('Color', { Camel: '#C49A6C', Negro: '#1A1413', Gris: '#7A7A7A' }),
    ],
  },
  {
    name: 'Camisa de Lino Manga Larga',
    desc: 'Camisa de lino puro con corte regular. Fresca y transpirable. Ideal para looks casuales o smart casual.',
    price: 78,
    cat: 'Hombre',
    featured: true,
    images: ['camisaLino.jpg', 'camisaLinoB.jpg'],
    attrs: [
      textAxis('Talla', ['S', 'M', 'L', 'XL', 'XXL']),
      colorAxis('Color', { Blanco: '#FAFAFA', 'Azul Claro': '#A3C4D9', Arena: '#D4C5A9' }),
    ],
  },
  {
    name: 'Blazer Slim Fit',
    desc: 'Blazer slim fit con mezcla de lana y cashmere. Dos botones, forro interior, bolsillos funcionales. Corte moderno.',
    price: 195,
    cat: 'Hombre',
    images: ['blazerHombre.jpg', 'blazerHombreB.jpg'],
    attrs: [
      textAxis('Talla', ['46', '48', '50', '52', '54']),
      colorAxis('Color', { 'Azul Marino': '#1E2F4A', Gris: '#4A4A4A', Negro: '#1A1413' }),
    ],
  },
  {
    name: 'Pantalón Chino Slim',
    desc: 'Pantalón chino de algodón con elastano. Corte slim. Versátil para oficina o salida casual.',
    price: 72,
    compare: 92,
    cat: 'Hombre',
    featured: true,
    images: ['pantalonChino.jpg'],
    attrs: [
      textAxis('Talla', ['30', '32', '34', '36', '38']),
      colorAxis('Color', {
        Beige: '#D4C5A9',
        'Azul Marino': '#1E2F4A',
        'Verde Oliva': '#556B2F',
        Negro: '#1A1413',
      }),
    ],
  },
  {
    name: 'Camiseta Premium Pima',
    desc: 'Camiseta 100% algodón pima. Corte regular, costuras reforzadas. La base perfecta de cualquier look.',
    price: 38,
    cat: 'Hombre',
    images: ['camisetaBasic.jpg'],
    attrs: [
      textAxis('Talla', ['S', 'M', 'L', 'XL', 'XXL']),
      colorAxis('Color', {
        Blanco: '#FAFAFA',
        Negro: '#1A1413',
        'Gris Melange': '#8A8A8A',
        'Verde Botella': '#2E4A3C',
      }),
    ],
  },
  {
    name: 'Suéter de Lana Cuello Redondo',
    desc: 'Suéter de lana merino, cuello redondo. Tejido denso que abriga sin abultar. Corte clásico.',
    price: 98,
    cat: 'Hombre',
    images: ['sueterLana.jpg'],
    attrs: [
      textAxis('Talla', ['S', 'M', 'L', 'XL']),
      colorAxis('Color', {
        Camel: '#C49A6C',
        Negro: '#1A1413',
        'Azul Marino': '#1E2F4A',
        Gris: '#7A7A7A',
      }),
    ],
  },
  {
    name: 'Bolso Hobo de Cuero',
    desc: 'Bolso hobo en cuero genuino con forro de algodón. Bolsillo interior con cierre. Correa ajustable.',
    price: 165,
    compare: 210,
    cat: 'Accesorios',
    featured: true,
    images: ['bolsoCuero.jpg', 'bolsoCueroB.jpg'],
    attrs: [colorAxis('Color', { Negro: '#1A1413', Camel: '#C49A6C', Chocolate: '#5B3A29' })],
  },
  {
    name: 'Cinturón de Cuero Trenzado',
    desc: 'Cinturón de cuero trenzado con hebilla dorada. Ancho 3cm. Se adapta a cualquier atuendo.',
    price: 54,
    cat: 'Accesorios',
    images: ['cinturonCuero.jpg'],
    attrs: [
      textAxis('Talla', ['S', 'M', 'L']),
      colorAxis('Color', { Negro: '#1A1413', Miel: '#C8984B', 'Coñac': '#8B4513' }),
    ],
  },
  {
    name: 'Pañuelo de Seda Estampado',
    desc: 'Pañuelo cuadrado 90x90cm en seda pura con estampa editorial. Múltiples formas de llevarlo.',
    price: 62,
    cat: 'Accesorios',
    featured: true,
    images: ['panueloSeda.jpg'],
    attrs: [textAxis('Estampa', ['Clásico Floral', 'Geométrico', 'Marino'])],
  },
  {
    name: 'Sombrero de Fieltro',
    desc: 'Sombrero de fieltro de lana con banda grosgrain. Ala ancha. Complemento statement para cualquier look.',
    price: 89,
    cat: 'Accesorios',
    images: ['sombreroFieltro.jpg'],
    attrs: [
      textAxis('Talla', ['S', 'M', 'L']),
      colorAxis('Color', { Negro: '#1A1413', Camel: '#C49A6C', Gris: '#7A7A7A' }),
    ],
  },
  {
    name: 'Lentes de Sol Acetato',
    desc: 'Lentes de sol con montura de acetato y protección UV400. Diseño atemporal con forma redonda. Incluye estuche rígido.',
    price: 78,
    cat: 'Accesorios',
    images: ['lentesSol.jpg'],
    attrs: [
      colorAxis('Color', { 'Negro Mate': '#2D2D2D', Carey: '#8B6914', Transparente: '#E0E0E0' }),
    ],
  },
  {
    name: 'Botas de Cuero Altas',
    desc: 'Botas altas en cuero genuino italiano con forro de piel sintética. Cremallera lateral y suela antideslizante. Hormadas para comodidad todo el día.',
    price: 185,
    compare: 240,
    cat: 'Calzado',
    featured: true,
    images: ['botasCuero.jpg'],
    attrs: [
      textAxis('Talla', ['35', '36', '37', '38', '39', '40']),
      colorAxis('Color', { Negro: '#1A1413', 'Coñac': '#8B4513', 'Borgoña': '#6B1F2E' }),
    ],
  },
  {
    name: 'Jeans Mom Fit Tiro Alto',
    desc: 'Jeans mom fit en denim 100% algodón con tiro alto. Corte clásico que estiliza. Lavado medio con pequeños detalles vintage.',
    price: 72,
    cat: 'Denim',
    images: ['jeansMom.jpg'],
    attrs: [
      textAxis('Talla', ['24', '26', '28', '30', '32']),
      colorAxis('Lavado', { 'Azul Medio': '#5A7BA8', 'Azul Oscuro': '#1F3355', Negro: '#1A1413' }),
    ],
  },
  {
    name: 'Cárdigan Oversized',
    desc: 'Cárdigan oversized tejido a mano en mezcla de lana y cashmere. Botones de nácar y puños acanalados. Pieza clave para entretiempo.',
    price: 128,
    cat: 'Tejidos',
    featured: true,
    images: ['cardiganTejido.jpg'],
    attrs: [
      textAxis('Talla', ['S', 'M', 'L']),
      colorAxis('Color', { Crema: '#F0E6D2', Camel: '#C49A6C', 'Verde Musgo': '#4A5D23' }),
    ],
  },
  {
    name: 'Bikini Clásico Triángulo',
    desc: 'Bikini de dos piezas en tejido premium con protección UV. Top triángulo ajustable y braga de tiro medio. Secado rápido.',
    price: 68,
    cat: 'Trajes de Baño',
    images: ['bikiniClasico.jpg'],
    attrs: [
      textAxis('Talla', ['XS', 'S', 'M', 'L']),
      colorAxis('Color', { Negro: '#1A1413', Marfil: '#F5EEDC', Rojo: '#A81E2C' }),
    ],
  },
  {
    name: 'Set de Anillos Minimalistas',
    desc: 'Set de 3 anillos apilables en plata 925 con baño de oro 18k. Diseño minimalista que combina entre sí. Antialérgicos.',
    price: 58,
    compare: 78,
    cat: 'Joyería',
    images: ['anillosSet.jpg'],
    attrs: [
      textAxis('Talla', ['6', '7', '8', '9']),
      colorAxis('Acabado', { Plata: '#C0C0C0', Oro: '#D4A84B', 'Oro Rosa': '#E8A79A' }),
    ],
  },
];

function demoFashion(): DemoData {
  const cats = [
    'Mujer',
    'Hombre',
    'Accesorios',
    'Calzado',
    'Denim',
    'Tejidos',
    'Trajes de Baño',
    'Joyería',
  ];
  return {
    store: {
      name: 'Noire Boutique',
      slug: 'noire-boutique',
      logo: `${ROPA}/logo.jpg`,
      banner: `${ROPA}/banner.jpg`,
      phone: '+584147654321',
      address: 'Av. Principal, Lechería, Anzoátegui',
      email: 'hola@noireboutique.com',
      aboutShort:
        'Cápsulas editoriales en satín, lana y seda. Piezas pensadas para usarse, no para guardarse. Envíos a todo el país.',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/noire.boutique' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584147654321' },
      ],
    },
    categories: cats.map((name, i) => ({
      id: `cat-nb-${i + 1}`,
      name,
      slug: name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-'),
    })),
    products: FASHION_PRODUCTS.map((p, i) => ({
      id: `nb-${String(i + 1).padStart(2, '0')}`,
      name: p.name,
      description: p.desc,
      basePrice: p.price,
      compareAtPrice: p.compare,
      images: p.images.map((f) => `${ROPA}/${f}`),
      isVisible: true,
      featured: p.featured ?? false,
      category: p.cat,
      sku: `NB-${String(i + 1).padStart(3, '0')}`,
      attributes: p.attrs,
    })),
  };
}

interface MenuDef {
  name: string;
  desc: string;
  price: number; // USD (el seed vertical usa centavos; acá ya está /100)
  compare?: number;
  cat: string;
  img: string;
  featured?: boolean;
  tagline?: string;
  included?: string[];
  extras?: Array<[string, number]>; // [nombre, priceDelta USD]
}

const BURGER_EXTRAS: Array<[string, number]> = [
  ['Queso extra', 1],
  ['Doble carne', 3],
  ['Bacon', 2],
  ['Aguacate', 1.5],
  ['Jalapeños', 0.5],
  ['Cebolla caramelizada', 0.8],
  ['Huevo frito', 1.2],
  ['Aros de cebolla', 1],
];

// Brooklyn Burger House — carta completa de seed-restaurant.ts (21 items).
const MENU_PRODUCTS: MenuDef[] = [
  {
    name: 'Classic Cheeseburger',
    desc: 'Carne angus 150g, queso americano, lechuga, tomate, pickles y nuestra house sauce. Con papas fritas.',
    price: 11,
    cat: 'Burgers',
    img: 'classicBurger.jpg',
    featured: true,
    tagline: 'Como te gusta',
    included: ['Lechuga', 'Tomate', 'Pickles', 'Cebolla', 'House sauce'],
    extras: BURGER_EXTRAS,
  },
  {
    name: 'Buffalo Wings (8 piezas)',
    desc: 'Alitas de pollo bañadas en salsa buffalo clásica. Con blue cheese y bastones de apio.',
    price: 8.5,
    cat: 'Starters',
    img: 'wings.jpg',
    featured: true,
  },
  {
    name: 'Onion Rings Crispy',
    desc: 'Aros de cebolla empanizados con mezcla casera. Crujientes por fuera, tiernos por dentro. Con dip ranch.',
    price: 5.5,
    cat: 'Starters',
    img: 'onionRings.jpg',
  },
  {
    name: 'Loaded Nachos',
    desc: 'Tortillas con cheddar fundido, pico de gallo, guacamole, jalapeños y sour cream. Para compartir.',
    price: 7.5,
    cat: 'Starters',
    img: 'nachos.jpg',
    tagline: 'A tu manera',
    included: ['Cheddar fundido', 'Pico de gallo', 'Guacamole', 'Sour cream', 'Jalapeños'],
    extras: [
      ['Carne desmechada', 2.5],
      ['Pollo BBQ', 2.2],
      ['Extra queso', 1.2],
      ['Extra guacamole', 1],
      ['Chili beans', 0.8],
    ],
  },
  {
    name: 'Double Trouble Burger',
    desc: 'Doble carne angus 300g, doble cheddar, cebolla caramelizada, tocineta y BBQ sauce. Con papas.',
    price: 14.5,
    compare: 17,
    cat: 'Burgers',
    img: 'doubleBurger.jpg',
    featured: true,
    tagline: 'Como te gusta',
    included: ['Doble cheddar', 'Cebolla caramelizada', 'Tocineta', 'BBQ sauce', 'Pickles'],
    extras: BURGER_EXTRAS,
  },
  {
    name: 'Smokehouse Bacon Burger',
    desc: 'Carne 180g, queso pepper jack, tocineta ahumada, aros de cebolla crispy y salsa chipotle. Con papas.',
    price: 13.5,
    cat: 'Burgers',
    img: 'baconBurger.jpg',
    tagline: 'Como te gusta',
    included: ['Pepper jack', 'Tocineta ahumada', 'Aros de cebolla', 'Salsa chipotle', 'Lechuga'],
    extras: BURGER_EXTRAS,
  },
  {
    name: 'Smash Burger',
    desc: 'Dos patties smasheadas estilo American diner, queso americano, pickles, cebolla y mostaza. Con papas.',
    price: 12,
    cat: 'Burgers',
    img: 'smashBurger.jpg',
    tagline: 'Como te gusta',
    included: ['Queso americano', 'Pickles', 'Cebolla', 'Mostaza'],
    extras: BURGER_EXTRAS,
  },
  {
    name: 'Pulled Pork Sandwich',
    desc: 'Cerdo cocinado 12 horas desmechado en BBQ sauce, coleslaw fresco en pan brioche. Con papas.',
    price: 11.5,
    cat: 'Burgers',
    img: 'pulledPork.jpg',
    tagline: 'A tu manera',
    included: ['Coleslaw', 'Pan brioche', 'BBQ sauce'],
    extras: [
      ['Queso cheddar', 1],
      ['Jalapeños', 0.5],
      ['Aguacate', 1.5],
      ['Doble porción', 4],
    ],
  },
  {
    name: 'Club Sandwich',
    desc: 'Triple piso: pollo grillado, tocineta, lechuga, tomate, huevo y mayo. Con papas fritas.',
    price: 9.5,
    cat: 'Burgers',
    img: 'clubSandwich.jpg',
    tagline: 'A tu manera',
    included: ['Lechuga', 'Tomate', 'Tocineta', 'Huevo', 'Mayo'],
    extras: [
      ['Queso extra', 1],
      ['Aguacate', 1.5],
      ['Doble pollo', 3],
      ['Pan integral', 0],
    ],
  },
  {
    name: 'BBQ Ribs Rack',
    desc: 'Costillas de cerdo baby back glaseadas en BBQ sauce ahumada. Cocción lenta 6 horas. Con papas y coleslaw.',
    price: 18,
    cat: 'Grill',
    img: 'ribs.jpg',
    featured: true,
  },
  {
    name: 'BBQ Chicken Plate',
    desc: 'Medio pollo marinado y glaseado en salsa BBQ de la casa. Con mazorca grillada y papas rústicas.',
    price: 12.5,
    cat: 'Grill',
    img: 'chickenBBQ.jpg',
  },
  {
    name: 'Papas Fritas Grandes',
    desc: 'Porción grande de papas fritas crujientes. Opción con cheddar y tocineta (+$1.50).',
    price: 4,
    cat: 'Grill',
    img: 'fries.jpg',
  },
  {
    name: 'Homemade Lemonade',
    desc: 'Limonada casera con hierbabuena fresca. Fría y refrescante. 500ml.',
    price: 2.5,
    cat: 'Drinks',
    img: 'lemonade.jpg',
  },
  {
    name: 'Soft Drink',
    desc: 'Cola, limón, naranja o uva. Vaso de 400ml con hielo.',
    price: 2,
    cat: 'Drinks',
    img: 'cola.jpg',
  },
  {
    name: 'Craft Beer',
    desc: 'Cerveza artesanal seleccionada. IPA, Lager o Stout. 330ml bien fría.',
    price: 4.5,
    cat: 'Drinks',
    img: 'craftBeer.jpg',
  },
  {
    name: 'Classic Milkshake',
    desc: 'Malteada cremosa con helado artesanal. Sabores: chocolate, vainilla, fresa u Oreo. 400ml.',
    price: 5.5,
    cat: 'Drinks',
    img: 'milkshake.jpg',
  },
  {
    name: 'Drip Coffee',
    desc: 'Café recién colado. Opción con leche o espresso shot. 250ml.',
    price: 1.5,
    cat: 'Drinks',
    img: 'coffee.jpg',
  },
  {
    name: 'Warm Brownie Sundae',
    desc: 'Brownie tibio de chocolate belga con helado de vainilla, crema batida y salsa de chocolate.',
    price: 6,
    cat: 'Desserts',
    img: 'brownie.jpg',
    featured: true,
  },
  {
    name: 'NY Cheesecake',
    desc: 'Cheesecake estilo New York con coulis de frutos rojos. Base de galleta graham.',
    price: 5.5,
    cat: 'Desserts',
    img: 'cheesecake.jpg',
  },
  {
    name: 'Apple Pie',
    desc: 'Pie de manzana caliente con canela y masa hojaldrada. Con bola de helado de vainilla.',
    price: 5,
    cat: 'Desserts',
    img: 'applePie.jpg',
  },
  {
    name: 'Ice Cream Sundae',
    desc: 'Tres bolas de helado artesanal con topping: caramelo, chocolate o frutos rojos. Crema batida y cerezas.',
    price: 5,
    cat: 'Desserts',
    img: 'iceCream.jpg',
  },
];

function demoRestaurant(): DemoData {
  const cats = ['Starters', 'Burgers', 'Grill', 'Drinks', 'Desserts'];
  return {
    store: {
      name: 'Brooklyn Burger House',
      slug: 'brooklyn-burger-house',
      logo: `${REST}/logo.jpg`,
      banner: `${REST}/banner.jpg`,
      phone: '+584121234567',
      address: 'C.C. Plaza Mayor local 12, Lechería',
      email: 'pedidos@brooklynburger.com',
      aboutShort:
        'Hamburguesas smash, BBQ ribs, wings y milkshakes. American grill hecho en casa. Pedidos por WhatsApp.',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/brooklynburgerhouse' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584121234567' },
      ],
    },
    categories: cats.map((name, i) => ({
      id: `cat-bb-${i + 1}`,
      name,
      slug: name.toLowerCase(),
    })),
    products: MENU_PRODUCTS.map((m, i) => {
      const attributes: DemoAttribute[] = [];
      // Ejes de variante (sabor/punto/topping/tamaño) — mismos criterios que
      // seed-restaurant.ts.
      if (m.name.includes('Milkshake')) {
        attributes.push(textAxis('Sabor', ['Chocolate', 'Vainilla', 'Fresa', 'Oreo']));
      } else if (m.cat === 'Burgers' && /Burger|Cheeseburger/.test(m.name)) {
        attributes.push(textAxis('Punto', ['Término medio', 'Tres cuartos', 'Bien cocida']));
      } else if (m.name.includes('Ice Cream Sundae')) {
        attributes.push(textAxis('Topping', ['Caramelo', 'Chocolate', 'Frutos rojos']));
      } else if (m.name.includes('BBQ Ribs')) {
        attributes.push(textAxis('Tamaño', ['Half Rack', 'Full Rack']));
      }
      // Flujo "arma tu…" del tema poster: ingredientes incluidos + extras con
      // priceDelta.
      if (m.included?.length) {
        attributes.push({
          name: 'Lleva incluido',
          type: 'text',
          role: 'ingredient-included',
          options: m.included,
        });
      }
      if (m.extras?.length) {
        attributes.push({
          name: 'Súmale extras',
          type: 'text',
          role: 'ingredient-extra',
          options: m.extras.map(([n]) => n),
          optionsMeta: Object.fromEntries(m.extras.map(([n, d]) => [n, { priceDelta: d }])),
        });
      }
      return {
        id: `bb-${String(i + 1).padStart(2, '0')}`,
        name: m.name,
        description: m.desc,
        basePrice: m.price,
        compareAtPrice: m.compare,
        images: [`${REST}/${m.img}`],
        isVisible: true,
        featured: m.featured ?? false,
        tagline: m.tagline,
        category: m.cat,
        attributes: attributes.length ? attributes : undefined,
      };
    }),
  };
}

interface PropertyDef {
  name: string;
  desc: string;
  price: number;
  cat: string;
  images: string[];
  featured?: boolean;
  specs: Partial<Record<'Habitaciones' | 'Baños' | 'm²' | 'Año' | 'Estacionamiento', string>>;
  tags?: string[];
}

// Andrea Torres Propiedades — cartera completa de seed-inmuebles.ts (12).
const PROPERTY_PRODUCTS: PropertyDef[] = [
  {
    name: 'Casa con Piscina y Vista al Mar',
    desc: 'Espectacular casa con vista panorámica al mar. Piscina privada, jardín amplio, cocina remodelada, pisos de porcelanato. Estacionamiento para 3 vehículos. Zona tranquila con vigilancia 24h.',
    price: 185000,
    cat: 'Casas',
    images: ['casa1.jpg', 'casa1b.jpg', 'casa1c.jpg'],
    featured: true,
    specs: { Habitaciones: '4', 'Baños': '3', 'm²': '280', 'Año': '2018', Estacionamiento: '3' },
    tags: ['Piscina', 'Vista al mar', 'Vigilancia 24h'],
  },
  {
    name: 'Casa Moderna en Complejo Turístico',
    desc: 'Casa moderna de líneas limpias en complejo turístico cerrado. Acabados de primera, cocina americana, balcón con vista al mar. Área de BBQ.',
    price: 145000,
    cat: 'Casas',
    images: ['casa2.jpg', 'casa2b.jpg'],
    featured: true,
    specs: { Habitaciones: '3', 'Baños': '2', 'm²': '200', 'Año': '2020', Estacionamiento: '2' },
    tags: ['Vista al mar', 'BBQ'],
  },
  {
    name: 'Townhouse en Urbanización Privada',
    desc: 'Townhouse esquinero en urbanización cerrada. Sala-comedor amplia, cocina equipada, cuarto de servicio. Patio trasero. Vigilancia privada, parque infantil.',
    price: 95000,
    cat: 'Casas',
    images: ['casa3.jpg', 'casa3b.jpg'],
    specs: { Habitaciones: '3', 'Baños': '2', 'm²': '180', 'Año': '2016', Estacionamiento: '2' },
    tags: ['Urbanización cerrada', 'Parque infantil'],
  },
  {
    name: 'Casa de Playa Frente al Mar',
    desc: 'Lujosa casa frente al mar. Piscina infinity, terraza panorámica, suite principal con jacuzzi. Acabados importados. Personal de servicio.',
    price: 320000,
    cat: 'Casas',
    images: ['casa4.jpg'],
    featured: true,
    specs: { Habitaciones: '5', 'Baños': '4', 'm²': '350', 'Año': '2019', Estacionamiento: '4' },
    tags: ['Piscina', 'Frente al mar', 'Jacuzzi'],
  },
  {
    name: 'Apartamento con Vista al Mar',
    desc: 'Apartamento en piso alto con vista panorámica al mar. Balcón amplio, cocina empotrada, closets de madera. Piscina y gimnasio en el edificio.',
    price: 65000,
    cat: 'Apartamentos',
    images: ['apto1.jpg', 'apto1b.jpg'],
    featured: true,
    specs: { Habitaciones: '2', 'Baños': '2', 'm²': '95', 'Año': '2017', Estacionamiento: '1' },
    tags: ['Vista al mar', 'Piscina', 'Gimnasio'],
  },
  {
    name: 'Estudio Amoblado Céntrico',
    desc: 'Estudio completamente amoblado y equipado. Ideal para inversión o alquiler turístico. Cocina americana, AC split. Zona comercial.',
    price: 35000,
    cat: 'Apartamentos',
    images: ['apto2.jpg', 'apto2b.jpg'],
    specs: { Habitaciones: '1', 'Baños': '1', 'm²': '55', Estacionamiento: '1' },
    tags: ['Amoblado', 'Inversión'],
  },
  {
    name: 'Penthouse Duplex con Terraza',
    desc: 'Penthouse dúplex con terraza privada de 60m². Vista 360° al mar y montaña. Jacuzzi en terraza, cocina de diseño. Edificio con seguridad y piscina.',
    price: 195000,
    cat: 'Apartamentos',
    images: ['apto3.jpg'],
    featured: true,
    specs: { Habitaciones: '3', 'Baños': '3', 'm²': '180', 'Año': '2021', Estacionamiento: '2' },
    tags: ['Penthouse', 'Terraza', 'Jacuzzi', 'Vista 360°'],
  },
  {
    name: 'Apartamento Familiar en Zona Residencial',
    desc: 'Apartamento amplio en zona residencial céntrica. Cerca de colegios, supermercados y transporte. Cocina remodelada, pisos nuevos. Pozo de agua propio.',
    price: 42000,
    cat: 'Apartamentos',
    images: ['apto4.jpg'],
    specs: { Habitaciones: '3', 'Baños': '2', 'm²': '120', Estacionamiento: '1' },
    tags: ['Pozo de agua'],
  },
  {
    name: 'Terreno 500m² con Vista al Mar',
    desc: 'Terreno plano con todos los servicios (agua, luz, cloacas). Ubicación privilegiada con posibilidad de vista al mar. Documentos al día. Ideal para construir casa de playa.',
    price: 75000,
    cat: 'Terrenos',
    images: ['terreno1.jpg'],
    specs: { 'm²': '500' },
    tags: ['Servicios completos', 'Vista al mar'],
  },
  {
    name: 'Parcela 1200m² en Zona Industrial',
    desc: 'Parcela en zona industrial. Acceso por vía principal, servicios básicos disponibles. Ideal para galpón, taller o comercio. Documentos completos.',
    price: 55000,
    cat: 'Terrenos',
    images: ['terreno2.jpg'],
    specs: { 'm²': '1200' },
    tags: ['Zona industrial', 'Vía principal'],
  },
  {
    name: 'Local Comercial en Centro Comercial',
    desc: 'Local comercial en planta baja de centro comercial con alto tráfico peatonal. Ideal para tienda de ropa, restaurante o servicios. Baño propio. Disponible inmediatamente.',
    price: 48000,
    cat: 'Locales Comerciales',
    images: ['local1.jpg'],
    specs: { 'm²': '85' },
    tags: ['Alto tráfico', 'Planta baja'],
  },
  {
    name: 'Oficina Premium en Torre Empresarial',
    desc: 'Oficina en torre empresarial con recepción, 3 privados, sala de reuniones y baño. Vista a la ciudad. AC central. Planta eléctrica y pozo de agua.',
    price: 68000,
    cat: 'Locales Comerciales',
    images: ['local2.jpg'],
    featured: true,
    specs: { 'm²': '120', Estacionamiento: '2' },
    tags: ['Planta eléctrica', 'Pozo de agua', 'AC central'],
  },
];

function demoRealEstate(): DemoData {
  const cats = ['Casas', 'Apartamentos', 'Terrenos', 'Locales Comerciales'];
  return {
    store: {
      name: 'Andrea Torres Propiedades',
      slug: 'andrea-torres-propiedades',
      logo: `${INMU}/logo.jpg`,
      banner: `${INMU}/banner.jpg`,
      phone: '+584141234567',
      address: 'Lechería, Anzoátegui',
      email: 'andrea@torrespropiedades.com',
      aboutShort:
        'Agente inmobiliario certificado. Casas, apartamentos, terrenos y locales comerciales. +10 años asesorando compra y venta de inmuebles.',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/andreatorres.propiedades' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584141234567' },
      ],
    },
    categories: cats.map((name, i) => ({
      id: `cat-at-${i + 1}`,
      name,
      slug: name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-'),
    })),
    products: PROPERTY_PRODUCTS.map((p, i) => {
      const attributes: DemoAttribute[] = Object.entries(p.specs).map(([name, value]) => ({
        name,
        type: 'text',
        role: 'spec',
        options: [value as string],
      }));
      if (p.tags?.length) {
        attributes.push({ name: 'Características', type: 'text', role: 'tag', options: p.tags });
      }
      return {
        id: `at-${String(i + 1).padStart(2, '0')}`,
        name: p.name,
        description: p.desc,
        basePrice: p.price,
        images: p.images.map((f) => `${INMU}/${f}`),
        isVisible: true,
        featured: p.featured ?? false,
        category: p.cat,
        attributes,
      };
    }),
  };
}

interface ServiceDef {
  name: string;
  desc: string;
  price: number;
  cat: string;
  images: string[];
  featured?: boolean;
}

// Daniel Mendoza (fotógrafo) — catálogo completo de seed-servicios.ts (11).
const SERVICE_PRODUCTS: ServiceDef[] = [
  {
    name: 'Sesión de Retrato Individual',
    desc: 'Sesión de 1 hora en locación o estudio. Incluye 15 fotos editadas en alta resolución. Ideal para redes sociales, LinkedIn o marca personal.',
    price: 30,
    cat: 'Retratos',
    images: ['retrato1.jpg', 'retrato2.jpg', 'retrato3.jpg'],
    featured: true,
  },
  {
    name: 'Retrato Profesional / Corporativo',
    desc: 'Sesión enfocada en headshots profesionales. 30 minutos, 8 fotos editadas. Fondo neutro o en tu oficina. Entrega en 48 horas.',
    price: 20,
    cat: 'Retratos',
    images: ['retrato4.jpg', 'retrato5.jpg'],
  },
  {
    name: 'Mini Sesión Express',
    desc: '20 minutos, 5 fotos editadas. Perfecta para actualizar tu foto de perfil. En exteriores o estudio.',
    price: 15,
    cat: 'Retratos',
    images: ['retrato5.jpg', 'retrato1.jpg'],
  },
  {
    name: 'Cobertura de Evento Completa',
    desc: 'Cobertura fotográfica de hasta 6 horas. Eventos corporativos, fiestas, graduaciones. Entrega de 80-120 fotos editadas. Incluye galería online privada.',
    price: 80,
    cat: 'Eventos',
    images: ['evento1.jpg', 'evento2.jpg', 'evento3.jpg', 'evento4.jpg'],
    featured: true,
  },
  {
    name: 'Cobertura de Boda',
    desc: 'Cobertura completa de tu boda: preparativos, ceremonia, recepción. Hasta 8 horas. 200+ fotos editadas. Álbum digital incluido.',
    price: 150,
    cat: 'Eventos',
    images: ['evento2.jpg', 'evento1.jpg'],
    featured: true,
  },
  {
    name: 'Cobertura Media Jornada',
    desc: 'Hasta 3 horas de cobertura. Ideal para cumpleaños, bautizos, reuniones. 40-60 fotos editadas.',
    price: 50,
    cat: 'Eventos',
    images: ['evento3.jpg', 'evento4.jpg'],
  },
  {
    name: 'Fotos de Producto (10 unidades)',
    desc: 'Sesión de fotografía de producto. 10 fotos en fondo blanco o ambientadas. Ideal para e-commerce, redes sociales o catálogo. Entrega en 3 días.',
    price: 25,
    cat: 'Producto',
    images: ['producto1.jpg', 'producto2.jpg', 'producto3.jpg'],
  },
  {
    name: 'Fotos de Producto Pack Completo (30 unidades)',
    desc: '30 fotos de producto con variaciones. Incluye fondo blanco, lifestyle y detalle. Para tiendas online que necesitan contenido profesional.',
    price: 60,
    cat: 'Producto',
    images: ['producto2.jpg', 'producto3.jpg', 'producto1.jpg'],
    featured: true,
  },
  {
    name: 'Sesión de Pareja',
    desc: 'Sesión de 1.5 horas en locación. 20 fotos editadas. Engagement, aniversario o simplemente porque sí. Elegimos juntos la mejor locación.',
    price: 40,
    cat: 'Parejas y Familia',
    images: ['pareja1.jpg', 'pareja2.jpg', 'pareja3.jpg'],
  },
  {
    name: 'Sesión Familiar',
    desc: 'Sesión de 1 hora para familia (hasta 6 personas). 15 fotos editadas. En parque, playa o tu hogar. Momentos naturales y espontáneos.',
    price: 35,
    cat: 'Parejas y Familia',
    images: ['familia1.jpg', 'familia2.jpg'],
  },
  {
    name: 'Sesión de Embarazo',
    desc: 'Sesión especial de maternidad. 1 hora, 15 fotos editadas. En estudio o exteriores. Incluye guía de poses y qué vestir.',
    price: 35,
    cat: 'Parejas y Familia',
    images: ['familia2.jpg', 'familia1.jpg'],
  },
];

function demoServices(): DemoData {
  const cats = ['Retratos', 'Eventos', 'Producto', 'Parejas y Familia'];
  return {
    store: {
      name: 'Daniel Mendoza',
      slug: 'daniel-mendoza-foto',
      logo: `${SERV}/logo.jpg`,
      banner: `${SERV}/banner.jpg`,
      phone: '+584149876543',
      address: 'Lechería, Anzoátegui',
      email: 'hola@danielfoto.com',
      aboutShort:
        'Fotógrafo profesional. Retratos, eventos, bodas y producto. Tu historia merece buenas fotos.',
      socials: [
        { platform: 'IG', url: 'https://instagram.com/danielmendozafoto' },
        { platform: 'WHATSAPP', url: 'https://wa.me/584149876543' },
      ],
    },
    categories: cats.map((name, i) => ({
      id: `cat-dm-${i + 1}`,
      name,
      slug: name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-'),
    })),
    products: SERVICE_PRODUCTS.map((s, i) => ({
      id: `dm-${String(i + 1).padStart(2, '0')}`,
      name: s.name,
      description: s.desc,
      basePrice: s.price,
      images: s.images.map((f) => `${SERV}/${f}`),
      isVisible: true,
      featured: s.featured ?? false,
      category: s.cat,
    })),
  };
}

// Persona (portafolio) usa la misma tienda demo del fotógrafo — es el mismo
// perfil mostrado como marca personal.
function demoPortfolio(): DemoData {
  return demoServices();
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
      headingFont: 'Inter',
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
          showProductCount: { type: 'boolean', label: 'Mostrar conteo de productos' },
        },
        defaults: {
          layout: 'compact',
          image: uns('1505740420928-5e560c06d30e', 1600, 900),
          kicker: 'Nueva temporada',
          showProductCount: true,
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
  demoDataJson: demoFashion(),
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
      muted: '#999999',
      border: '#EAEAE6',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    radius: 'lg',
    spacing: 'comfortable',
    buttonStyle: 'solid',
  },
  sectionSchema: {
    defaultOrder: [
      'hero_main',
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
  demoDataJson: demoFashion(),
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
  demoDataJson: demoFashion(),
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
        },
        defaults: {
          layout: 'compact',
          image: uns('1414235077428-338989a2e8c0', 1600, 900),
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
      footerSection(),
    ],
  },
  demoDataJson: demoRestaurant(),
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
      preset: 'monocromo',
      primary: '#2d2d2d',
      secondary: '#6b7280',
      accent: '#2d2d2d',
      bg: '#ffffff',
      surface: '#f7f7f7',
      text: '#1a1a1a',
      muted: '#64748b',
      border: '#e5e7eb',
    },
    typography: {
      headingFont: 'Inter',
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
        },
        defaults: {
          layout: 'split',
          image: uns('1497366811353-6870744d04b2', 900, 700),
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
      accent: '#d4a04f',
      bg: '#ffffff',
      surface: '#f6f5f3',
      text: '#0a0a0a',
      muted: '#4a4a4a',
      border: '#e5e3df',
    },
    typography: {
      headingFont: 'Inter',
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
      'product_grid_main',
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
      footerSection(),
    ],
  },
  demoDataJson: demoRestaurant(),
};

// ATELIER — FASHION PRO editorial: hero + featured + product_grid + about + gallery + socials + footer
const atelierTemplate: TemplateSeed = {
  key: 'atelier',
  name: 'Atelier',
  // Decisión 2026-07-17: atelier vive en Servicios — su tienda demo canónica
  // es el fotógrafo y su flujo es "Reservar sesión", no catálogo de moda.
  niche: TemplateNiche.SERVICES,
  planRequired: Plan.PRO,
  sortOrder: 31,
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
      'editorial_block',
      'product_grid_main',
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
  // Tienda demo canonica del atelier: el fotografo (seed-servicios usa
  // template atelier y el HTML aprobado dice "Reservar sesion").
  demoDataJson: demoServices(),
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
  demoDataJson: demoFashion(),
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
      headingFont: 'Inter',
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
