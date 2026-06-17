// Usage:
//   ts-node prisma/seeds/seed-ropa.ts            → siembra store "real" (slug: noire-boutique)
//   ts-node prisma/seeds/seed-ropa.ts --demo     → siembra store demo (slug: demo-noire-boutique, User.isDemo=true)
//   DEMO=true ts-node prisma/seeds/seed-ropa.ts  → idem via env var
// Los modos usan emails distintos (ropa@example.com vs demo-ropa@example.com),
// asi que correr uno NO pisa los datos del otro. Cada modo es idempotente por email.
import { PrismaClient, Plan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IS_DEMO = process.argv.includes('--demo') || process.env.DEMO === 'true';
const DEMO_PREFIX = 'demo-';
const EMAIL = IS_DEMO ? 'demo-ropa@example.com' : 'ropa@example.com';
const STORE_SLUG = IS_DEMO ? `${DEMO_PREFIX}noire-boutique` : 'noire-boutique';

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Fashion images from Unsplash ──────────────────────────
const IMG = {
  logo: '/demo-assets/ropa/logo.jpg',
  banner: '/demo-assets/ropa/banner.jpg',

  // ─── Mujer ───
  vestidoSatin: '/demo-assets/ropa/vestidoSatin.jpg',
  vestidoSatinB: '/demo-assets/ropa/vestidoSatinB.jpg',
  blazerMujer: '/demo-assets/ropa/blazerMujer.jpg',
  blazerMujerB: '/demo-assets/ropa/blazerMujerB.jpg',
  blusaSeda: '/demo-assets/ropa/blusaSeda.jpg',
  pantalonPalazzo: '/demo-assets/ropa/pantalonPalazzo.jpg',
  pantalonPalazzoB: '/demo-assets/ropa/pantalonPalazzoB.jpg',
  faldaMidi: '/demo-assets/ropa/faldaMidi.jpg',
  topCrop: '/demo-assets/ropa/topCrop.jpg',
  abrigoLana: '/demo-assets/ropa/abrigoLana.jpg',
  abrigoLanaB: '/demo-assets/ropa/abrigoLanaB.jpg',

  // ─── Hombre ───
  camisaLino: '/demo-assets/ropa/camisaLino.jpg',
  camisaLinoB: '/demo-assets/ropa/camisaLinoB.jpg',
  blazerHombre: '/demo-assets/ropa/blazerHombre.jpg',
  blazerHombreB: '/demo-assets/ropa/blazerHombreB.jpg',
  pantalonChino: '/demo-assets/ropa/pantalonChino.jpg',
  camisetaBasic: '/demo-assets/ropa/camisetaBasic.jpg',
  suéterLana: '/demo-assets/ropa/sueterLana.jpg',

  // ─── Accesorios ───
  bolsoCuero: '/demo-assets/ropa/bolsoCuero.jpg',
  bolsoCueroB: '/demo-assets/ropa/bolsoCueroB.jpg',
  cinturonCuero: '/demo-assets/ropa/cinturonCuero.jpg',
  pañueloSeda: '/demo-assets/ropa/panueloSeda.jpg',
  sombreroFieltro: '/demo-assets/ropa/sombreroFieltro.jpg',
  lentesSol: '/demo-assets/ropa/lentesSol.jpg',

  // ─── Calzado ───
  botasCuero: '/demo-assets/ropa/botasCuero.jpg',

  // ─── Denim ───
  jeansMom: '/demo-assets/ropa/jeansMom.jpg',

  // ─── Tejidos ───
  cardiganTejido: '/demo-assets/ropa/cardiganTejido.jpg',

  // ─── Trajes de Baño ───
  bikiniClasico: '/demo-assets/ropa/bikiniClasico.jpg',

  // ─── Joyería ───
  anillosSet: '/demo-assets/ropa/anillosSet.jpg',
};

interface ProductDef {
  name: string;
  desc: string;
  price: number;
  compare?: number;
  cat: string;
  images: string[];
  featured?: boolean;
  attrs: {
    name: string;
    type: string;
    options: string[];
    optionsMeta?: Record<string, { hex?: string }>;
  }[];
  stock: number;
}

const PRODUCTS: ProductDef[] = [
  // ─── Mujer ───
  {
    name: 'Vestido Midi Satín',
    desc: 'Vestido midi en satín fluido con tirantes regulables. Corte sesgado que estiliza. Forrado. Ideal para eventos y cenas.',
    price: 98,
    compare: 130,
    cat: 'Mujer',
    featured: true,
    images: [IMG.vestidoSatin, IMG.vestidoSatinB],
    attrs: [
      { name: 'Talla', type: 'text', options: ['XS', 'S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Champagne', 'Borgoña'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Champagne: { hex: '#E8D4A8' },
          'Borgoña': { hex: '#6B1F2E' },
        },
      },
    ],
    stock: 45,
  },
  {
    name: 'Blazer Oversize Estructurado',
    desc: 'Blazer de corte oversize con hombros estructurados. Doble botonadura dorada. Forro de viscosa. Atemporal.',
    price: 128,
    cat: 'Mujer',
    featured: true,
    images: [IMG.blazerMujer, IMG.blazerMujerB],
    attrs: [
      { name: 'Talla', type: 'text', options: ['XS', 'S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Crema', 'Camel'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Crema: { hex: '#F1E4CF' },
          Camel: { hex: '#C49A6C' },
        },
      },
    ],
    stock: 28,
  },
  {
    name: 'Blusa de Seda Cuello V',
    desc: 'Blusa de seda natural con cuello en V y manga francesa. Caída impecable. Se combina tanto con jean como con traje.',
    price: 72,
    cat: 'Mujer',
    images: [IMG.blusaSeda],
    attrs: [
      { name: 'Talla', type: 'text', options: ['XS', 'S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Marfil', 'Negro', 'Rosa Seco'],
        optionsMeta: {
          Marfil: { hex: '#F1E4CF' },
          Negro: { hex: '#1A1413' },
          'Rosa Seco': { hex: '#C89B9B' },
        },
      },
    ],
    stock: 52,
  },
  {
    name: 'Pantalón Palazzo de Crepe',
    desc: 'Pantalón palazzo de crepe con cintura alta y pinzas delanteras. Pierna ancha con caída fluida. Se ajusta con elástico interno.',
    price: 88,
    compare: 110,
    cat: 'Mujer',
    featured: true,
    images: [IMG.pantalonPalazzo, IMG.pantalonPalazzoB],
    attrs: [
      { name: 'Talla', type: 'text', options: ['XS', 'S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Beige', 'Chocolate'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Beige: { hex: '#D4C5A9' },
          Chocolate: { hex: '#5B3A29' },
        },
      },
    ],
    stock: 40,
  },
  {
    name: 'Falda Midi Plisada',
    desc: 'Falda midi plisada en satín con cintura elástica. Largo favorecedor. Movimiento elegante al caminar.',
    price: 68,
    cat: 'Mujer',
    images: [IMG.faldaMidi],
    attrs: [
      { name: 'Talla', type: 'text', options: ['XS', 'S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Esmeralda', 'Negro', 'Marfil'],
        optionsMeta: {
          Esmeralda: { hex: '#2E4A3C' },
          Negro: { hex: '#1A1413' },
          Marfil: { hex: '#F1E4CF' },
        },
      },
    ],
    stock: 35,
  },
  {
    name: 'Top Crop Punto Fino',
    desc: 'Top crop en punto fino con escote cuadrado. Tejido elástico que se adapta al cuerpo. Pieza clave del guardarropa.',
    price: 48,
    cat: 'Mujer',
    images: [IMG.topCrop],
    attrs: [
      { name: 'Talla', type: 'text', options: ['XS', 'S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Blanco', 'Rojo'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Blanco: { hex: '#FAFAFA' },
          Rojo: { hex: '#9B2237' },
        },
      },
    ],
    stock: 60,
  },
  {
    name: 'Abrigo Largo de Lana',
    desc: 'Abrigo largo 100% lana con solapa ancha y cinturón. Forrado completo. Invierno con estilo atemporal.',
    price: 220,
    compare: 280,
    cat: 'Mujer',
    featured: true,
    images: [IMG.abrigoLana, IMG.abrigoLanaB],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Camel', 'Negro', 'Gris'],
        optionsMeta: {
          Camel: { hex: '#C49A6C' },
          Negro: { hex: '#1A1413' },
          Gris: { hex: '#7A7A7A' },
        },
      },
    ],
    stock: 18,
  },

  // ─── Hombre ───
  {
    name: 'Camisa de Lino Manga Larga',
    desc: 'Camisa de lino puro con corte regular. Fresca y transpirable. Ideal para looks casuales o smart casual.',
    price: 78,
    cat: 'Hombre',
    featured: true,
    images: [IMG.camisaLino, IMG.camisaLinoB],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Blanco', 'Azul Claro', 'Arena'],
        optionsMeta: {
          Blanco: { hex: '#FAFAFA' },
          'Azul Claro': { hex: '#A3C4D9' },
          Arena: { hex: '#D4C5A9' },
        },
      },
    ],
    stock: 55,
  },
  {
    name: 'Blazer Slim Fit',
    desc: 'Blazer slim fit con mezcla de lana y cashmere. Dos botones, forro interior, bolsillos funcionales. Corte moderno.',
    price: 195,
    cat: 'Hombre',
    images: [IMG.blazerHombre, IMG.blazerHombreB],
    attrs: [
      { name: 'Talla', type: 'text', options: ['46', '48', '50', '52', '54'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Azul Marino', 'Gris', 'Negro'],
        optionsMeta: {
          'Azul Marino': { hex: '#1E2F4A' },
          Gris: { hex: '#4A4A4A' },
          Negro: { hex: '#1A1413' },
        },
      },
    ],
    stock: 22,
  },
  {
    name: 'Pantalón Chino Slim',
    desc: 'Pantalón chino de algodón con elastano. Corte slim. Versátil para oficina o salida casual.',
    price: 72,
    compare: 92,
    cat: 'Hombre',
    featured: true,
    images: [IMG.pantalonChino],
    attrs: [
      { name: 'Talla', type: 'text', options: ['30', '32', '34', '36', '38'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Beige', 'Azul Marino', 'Verde Oliva', 'Negro'],
        optionsMeta: {
          Beige: { hex: '#D4C5A9' },
          'Azul Marino': { hex: '#1E2F4A' },
          'Verde Oliva': { hex: '#556B2F' },
          Negro: { hex: '#1A1413' },
        },
      },
    ],
    stock: 48,
  },
  {
    name: 'Camiseta Premium Pima',
    desc: 'Camiseta 100% algodón pima. Corte regular, costuras reforzadas. La base perfecta de cualquier look.',
    price: 38,
    cat: 'Hombre',
    images: [IMG.camisetaBasic],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Blanco', 'Negro', 'Gris Melange', 'Verde Botella'],
        optionsMeta: {
          Blanco: { hex: '#FAFAFA' },
          Negro: { hex: '#1A1413' },
          'Gris Melange': { hex: '#8A8A8A' },
          'Verde Botella': { hex: '#2E4A3C' },
        },
      },
    ],
    stock: 80,
  },
  {
    name: 'Suéter de Lana Cuello Redondo',
    desc: 'Suéter de lana merino, cuello redondo. Tejido denso que abriga sin abultar. Corte clásico.',
    price: 98,
    cat: 'Hombre',
    images: [IMG.suéterLana],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Camel', 'Negro', 'Azul Marino', 'Gris'],
        optionsMeta: {
          Camel: { hex: '#C49A6C' },
          Negro: { hex: '#1A1413' },
          'Azul Marino': { hex: '#1E2F4A' },
          Gris: { hex: '#7A7A7A' },
        },
      },
    ],
    stock: 32,
  },

  // ─── Accesorios ───
  {
    name: 'Bolso Hobo de Cuero',
    desc: 'Bolso hobo en cuero genuino con forro de algodón. Bolsillo interior con cierre. Correa ajustable.',
    price: 165,
    compare: 210,
    cat: 'Accesorios',
    featured: true,
    images: [IMG.bolsoCuero, IMG.bolsoCueroB],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Camel', 'Chocolate'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Camel: { hex: '#C49A6C' },
          Chocolate: { hex: '#5B3A29' },
        },
      },
    ],
    stock: 20,
  },
  {
    name: 'Cinturón de Cuero Trenzado',
    desc: 'Cinturón de cuero trenzado con hebilla dorada. Ancho 3cm. Se adapta a cualquier atuendo.',
    price: 54,
    cat: 'Accesorios',
    images: [IMG.cinturonCuero],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Miel', 'Coñac'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Miel: { hex: '#C8984B' },
          Coñac: { hex: '#8B4513' },
        },
      },
    ],
    stock: 40,
  },
  {
    name: 'Pañuelo de Seda Estampado',
    desc: 'Pañuelo cuadrado 90x90cm en seda pura con estampa editorial. Múltiples formas de llevarlo.',
    price: 62,
    cat: 'Accesorios',
    featured: true,
    images: [IMG.pañueloSeda],
    attrs: [
      {
        name: 'Estampa',
        type: 'text',
        options: ['Clásico Floral', 'Geométrico', 'Marino'],
      },
    ],
    stock: 25,
  },
  {
    name: 'Sombrero de Fieltro',
    desc: 'Sombrero de fieltro de lana con banda grosgrain. Ala ancha. Complemento statement para cualquier look.',
    price: 89,
    cat: 'Accesorios',
    images: [IMG.sombreroFieltro],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Camel', 'Gris'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Camel: { hex: '#C49A6C' },
          Gris: { hex: '#7A7A7A' },
        },
      },
    ],
    stock: 18,
  },
  {
    name: 'Lentes de Sol Acetato',
    desc: 'Lentes de sol con montura de acetato y protección UV400. Diseño atemporal con forma redonda. Incluye estuche rígido.',
    price: 78,
    cat: 'Accesorios',
    images: [IMG.lentesSol],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro Mate', 'Carey', 'Transparente'],
        optionsMeta: {
          'Negro Mate': { hex: '#2D2D2D' },
          Carey: { hex: '#8B6914' },
          Transparente: { hex: '#E0E0E0' },
        },
      },
    ],
    stock: 35,
  },

  // ─── Calzado ───
  {
    name: 'Botas de Cuero Altas',
    desc: 'Botas altas en cuero genuino italiano con forro de piel sintética. Cremallera lateral y suela antideslizante. Hormadas para comodidad todo el día.',
    price: 185,
    compare: 240,
    cat: 'Calzado',
    featured: true,
    images: [IMG.botasCuero],
    attrs: [
      { name: 'Talla', type: 'text', options: ['35', '36', '37', '38', '39', '40'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Coñac', 'Borgoña'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Coñac: { hex: '#8B4513' },
          'Borgoña': { hex: '#6B1F2E' },
        },
      },
    ],
    stock: 22,
  },

  // ─── Denim ───
  {
    name: 'Jeans Mom Fit Tiro Alto',
    desc: 'Jeans mom fit en denim 100% algodón con tiro alto. Corte clásico que estiliza. Lavado medio con pequeños detalles vintage.',
    price: 72,
    cat: 'Denim',
    images: [IMG.jeansMom],
    attrs: [
      { name: 'Talla', type: 'text', options: ['24', '26', '28', '30', '32'] },
      {
        name: 'Lavado',
        type: 'color',
        options: ['Azul Medio', 'Azul Oscuro', 'Negro'],
        optionsMeta: {
          'Azul Medio': { hex: '#5A7BA8' },
          'Azul Oscuro': { hex: '#1F3355' },
          Negro: { hex: '#1A1413' },
        },
      },
    ],
    stock: 48,
  },

  // ─── Tejidos ───
  {
    name: 'Cárdigan Oversized',
    desc: 'Cárdigan oversized tejido a mano en mezcla de lana y cashmere. Botones de nácar y puños acanalados. Pieza clave para entretiempo.',
    price: 128,
    cat: 'Tejidos',
    featured: true,
    images: [IMG.cardiganTejido],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Crema', 'Camel', 'Verde Musgo'],
        optionsMeta: {
          Crema: { hex: '#F0E6D2' },
          Camel: { hex: '#C49A6C' },
          'Verde Musgo': { hex: '#4A5D23' },
        },
      },
    ],
    stock: 30,
  },

  // ─── Trajes de Baño ───
  {
    name: 'Bikini Clásico Triángulo',
    desc: 'Bikini de dos piezas en tejido premium con protección UV. Top triángulo ajustable y braga de tiro medio. Secado rápido.',
    price: 68,
    cat: 'Trajes de Baño',
    images: [IMG.bikiniClasico],
    attrs: [
      { name: 'Talla', type: 'text', options: ['XS', 'S', 'M', 'L'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Marfil', 'Rojo'],
        optionsMeta: {
          Negro: { hex: '#1A1413' },
          Marfil: { hex: '#F5EEDC' },
          Rojo: { hex: '#A81E2C' },
        },
      },
    ],
    stock: 40,
  },

  // ─── Joyería ───
  {
    name: 'Set de Anillos Minimalistas',
    desc: 'Set de 3 anillos apilables en plata 925 con baño de oro 18k. Diseño minimalista que combina entre sí. Antialérgicos.',
    price: 58,
    compare: 78,
    cat: 'Joyería',
    images: [IMG.anillosSet],
    attrs: [
      { name: 'Talla', type: 'text', options: ['6', '7', '8', '9'] },
      {
        name: 'Acabado',
        type: 'color',
        options: ['Plata', 'Oro', 'Oro Rosa'],
        optionsMeta: {
          Plata: { hex: '#C0C0C0' },
          Oro: { hex: '#D4A84B' },
          'Oro Rosa': { hex: '#E8A79A' },
        },
      },
    ],
    stock: 55,
  },
];

async function main() {
  console.log(`👗 Starting boutique seed${IS_DEMO ? ' (DEMO mode)' : ''}...\n`);

  const existingUser = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existingUser) {
    const existingStores = await prisma.store.findMany({ where: { ownerId: existingUser.id } });
    for (const s of existingStores) {
      const orders = await prisma.orderIntent.findMany({ where: { storeId: s.id } });
      for (const o of orders) {
        await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
      }
      await prisma.orderIntent.deleteMany({ where: { storeId: s.id } });
      await prisma.store.delete({ where: { id: s.id } });
    }
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log('🧹 Cleaned previous boutique data');
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      name: 'Noire Boutique',
      emailVerified: new Date(),
      isDemo: IS_DEMO,
    },
  });
  console.log(`✅ User: ${EMAIL} / password123${IS_DEMO ? ' (isDemo=true)' : ''}`);

  const store = await prisma.store.create({
    data: {
      slug: STORE_SLUG,
      username: STORE_SLUG,
      name: 'Noire Boutique',
      description: 'Cápsulas editoriales en satín, lana y seda. Piezas pensadas para usarse, no para guardarse. Envíos a todo el país.',
      logo: IMG.logo,
      banner: IMG.banner,
      primaryColor: '#c8334c',
      secondaryColor: '#1a1413',
      template: 'rosier',
      whatsappNumbers: ['+584147654321'],
      instagramHandle: 'noire.boutique',
      email: 'hola@noireboutique.com',
      currencyConfig: { code: 'USD', symbol: '$', locale: 'es-VE' },
      stockEnabled: true,
      showBranding: true,
      ownerId: user.id,
    },
  });
  console.log(`✅ Store: "${store.name}" (/${store.slug}) — template: rosier`);

  await prisma.subscription.create({
    data: {
      storeId: store.id,
      plan: Plan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Subscription: PRO (active)');

  const categoryMap: Record<string, string> = {};
  const categoriesData = [
    { name: 'Mujer', order: 1, image: IMG.vestidoSatin },
    { name: 'Hombre', order: 2, image: IMG.camisaLino },
    { name: 'Accesorios', order: 3, image: IMG.bolsoCuero },
    { name: 'Calzado', order: 4, image: IMG.botasCuero },
    { name: 'Denim', order: 5, image: IMG.jeansMom },
    { name: 'Tejidos', order: 6, image: IMG.cardiganTejido },
    { name: 'Trajes de Baño', order: 7, image: IMG.bikiniClasico },
    { name: 'Joyería', order: 8, image: IMG.anillosSet },
  ];

  for (const c of categoriesData) {
    const cat = await prisma.category.create({
      data: {
        storeId: store.id,
        name: c.name,
        slug: slug(c.name),
        sortOrder: c.order,
        image: c.image,
      },
    });
    categoryMap[c.name] = cat.id;
  }
  console.log(`✅ Categories: ${categoriesData.length}`);

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: p.name,
        slug: slug(p.name),
        description: p.desc,
        basePrice: p.price,
        compareAtPrice: p.compare ?? null,
        images: p.images,
        stock: p.stock,
        sku: `NB-${String(i + 1).padStart(3, '0')}`,
        isVisible: true,
        isFeatured: p.featured ?? false,
        isOnSale: !!p.compare,
        sortOrder: i,
        categories: {
          create: { categoryId: categoryMap[p.cat] },
        },
        attributes: {
          create: p.attrs.map((a, idx) => ({
            name: a.name,
            type: a.type,
            options: a.options,
            optionsMeta: a.optionsMeta ?? undefined,
            sortOrder: idx,
          })),
        },
      },
    });

    // Create variants when product has both size & color
    const colorAttr = p.attrs.find((a) => a.type === 'color');
    const sizeAttr = p.attrs.find((a) => a.type === 'text' && a.name.toLowerCase().includes('talla'));
    if (colorAttr && sizeAttr) {
      const colors = colorAttr.options.slice(0, 2);
      const sizes = sizeAttr.options.slice(0, 3);
      for (const color of colors) {
        for (const size of sizes) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              combination: { [colorAttr.name]: color, [sizeAttr.name]: size },
              priceAdjustment: 0,
              stock: Math.floor(Math.random() * 10) + 3,
              isAvailable: Math.random() > 0.1,
            },
          });
        }
      }
    }
  }
  console.log(`✅ Products: ${PRODUCTS.length} (with attributes & variants)`);

  console.log('\n🎉 Boutique seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`   Mode:       ${IS_DEMO ? 'DEMO (isDemo=true, slug prefix demo-)' : 'real'}`);
  console.log(`   Login:      ${EMAIL} / password123`);
  console.log(`   Store:      /${STORE_SLUG}`);
  console.log(`   Template:   rosier`);
  console.log(`   Products:   ${PRODUCTS.length}`);
  console.log(`   Categories: ${categoriesData.length}`);
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding boutique:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
