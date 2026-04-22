// Usage:
//   ts-node prisma/seeds/seed-inmuebles.ts            → siembra store "real" (slug: andrea-torres-propiedades)
//   ts-node prisma/seeds/seed-inmuebles.ts --demo     → siembra store demo (slug: demo-andrea-torres-propiedades, User.isDemo=true)
//   DEMO=true ts-node prisma/seeds/seed-inmuebles.ts  → idem via env var
// Los modos usan emails distintos (inmuebles@example.com vs demo-inmuebles@example.com),
// asi que correr uno NO pisa los datos del otro. Cada modo es idempotente por email.
import { PrismaClient, Plan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IS_DEMO = process.argv.includes('--demo') || process.env.DEMO === 'true';
const DEMO_PREFIX = 'demo-';
const EMAIL = IS_DEMO ? 'demo-inmuebles@example.com' : 'inmuebles@example.com';
const STORE_SLUG = IS_DEMO ? `${DEMO_PREFIX}andrea-torres-propiedades` : 'andrea-torres-propiedades';

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const IMG = {
  logo: '/demo-assets/inmuebles/logo.jpg',
  banner: '/demo-assets/inmuebles/banner.jpg',
  casa1: '/demo-assets/inmuebles/casa1.jpg',
  casa1b: '/demo-assets/inmuebles/casa1b.jpg',
  casa1c: '/demo-assets/inmuebles/casa1c.jpg',
  casa2: '/demo-assets/inmuebles/casa2.jpg',
  casa2b: '/demo-assets/inmuebles/casa2b.jpg',
  casa3: '/demo-assets/inmuebles/casa3.jpg',
  casa3b: '/demo-assets/inmuebles/casa3b.jpg',
  casa4: '/demo-assets/inmuebles/casa4.jpg',
  apto1: '/demo-assets/inmuebles/apto1.jpg',
  apto1b: '/demo-assets/inmuebles/apto1b.jpg',
  apto2: '/demo-assets/inmuebles/apto2.jpg',
  apto2b: '/demo-assets/inmuebles/apto2b.jpg',
  apto3: '/demo-assets/inmuebles/apto3.jpg',
  apto4: '/demo-assets/inmuebles/apto4.jpg',
  terreno1: '/demo-assets/inmuebles/terreno1.jpg',
  terreno2: '/demo-assets/inmuebles/terreno2.jpg',
  local1: '/demo-assets/inmuebles/local1.jpg',
  local2: '/demo-assets/inmuebles/local2.jpg',
};

interface PropertySpec {
  hab?: string;
  bath?: string;
  m2?: string;
  year?: string;
  parking?: string;
}

const PROPERTIES: {
  name: string;
  desc: string;
  price: number;
  cat: string;
  images: string[];
  featured?: boolean;
  specs: PropertySpec;
  tags?: string[];
}[] = [
  // ─── Casas ───
  {
    name: 'Casa con Piscina y Vista al Mar',
    desc: 'Espectacular casa con vista panorámica al mar. Piscina privada, jardín amplio, cocina remodelada, pisos de porcelanato. Estacionamiento para 3 vehículos. Zona tranquila con vigilancia 24h.',
    price: 185000,
    cat: 'Casas',
    images: [IMG.casa1, IMG.casa1b, IMG.casa1c],
    featured: true,
    specs: { hab: '4', bath: '3', m2: '280', year: '2018', parking: '3' },
    tags: ['Piscina', 'Vista al mar', 'Vigilancia 24h'],
  },
  {
    name: 'Casa Moderna en Complejo Turístico',
    desc: 'Casa moderna de líneas limpias en complejo turístico cerrado. Acabados de primera, cocina americana, balcón con vista al mar. Área de BBQ.',
    price: 145000,
    cat: 'Casas',
    images: [IMG.casa2, IMG.casa2b],
    featured: true,
    specs: { hab: '3', bath: '2', m2: '200', year: '2020', parking: '2' },
    tags: ['Vista al mar', 'BBQ'],
  },
  {
    name: 'Townhouse en Urbanización Privada',
    desc: 'Townhouse esquinero en urbanización cerrada. Sala-comedor amplia, cocina equipada, cuarto de servicio. Patio trasero. Vigilancia privada, parque infantil.',
    price: 95000,
    cat: 'Casas',
    images: [IMG.casa3, IMG.casa3b],
    specs: { hab: '3', bath: '2', m2: '180', year: '2016', parking: '2' },
    tags: ['Urbanización cerrada', 'Parque infantil'],
  },
  {
    name: 'Casa de Playa Frente al Mar',
    desc: 'Lujosa casa frente al mar. Piscina infinity, terraza panorámica, suite principal con jacuzzi. Acabados importados. Personal de servicio.',
    price: 320000,
    cat: 'Casas',
    images: [IMG.casa4],
    featured: true,
    specs: { hab: '5', bath: '4', m2: '350', year: '2019', parking: '4' },
    tags: ['Piscina', 'Frente al mar', 'Jacuzzi'],
  },

  // ─── Apartamentos ───
  {
    name: 'Apartamento con Vista al Mar',
    desc: 'Apartamento en piso alto con vista panorámica al mar. Balcón amplio, cocina empotrada, closets de madera. Piscina y gimnasio en el edificio.',
    price: 65000,
    cat: 'Apartamentos',
    images: [IMG.apto1, IMG.apto1b],
    featured: true,
    specs: { hab: '2', bath: '2', m2: '95', year: '2017', parking: '1' },
    tags: ['Vista al mar', 'Piscina', 'Gimnasio'],
  },
  {
    name: 'Estudio Amoblado Céntrico',
    desc: 'Estudio completamente amoblado y equipado. Ideal para inversión o alquiler turístico. Cocina americana, AC split. Zona comercial.',
    price: 35000,
    cat: 'Apartamentos',
    images: [IMG.apto2, IMG.apto2b],
    specs: { hab: '1', bath: '1', m2: '55', parking: '1' },
    tags: ['Amoblado', 'Inversión'],
  },
  {
    name: 'Penthouse Duplex con Terraza',
    desc: 'Penthouse dúplex con terraza privada de 60m². Vista 360° al mar y montaña. Jacuzzi en terraza, cocina de diseño. Edificio con seguridad y piscina.',
    price: 195000,
    cat: 'Apartamentos',
    images: [IMG.apto3],
    featured: true,
    specs: { hab: '3', bath: '3', m2: '180', year: '2021', parking: '2' },
    tags: ['Penthouse', 'Terraza', 'Jacuzzi', 'Vista 360°'],
  },
  {
    name: 'Apartamento Familiar en Zona Residencial',
    desc: 'Apartamento amplio en zona residencial céntrica. Cerca de colegios, supermercados y transporte. Cocina remodelada, pisos nuevos. Pozo de agua propio.',
    price: 42000,
    cat: 'Apartamentos',
    images: [IMG.apto4],
    specs: { hab: '3', bath: '2', m2: '120', parking: '1' },
    tags: ['Pozo de agua'],
  },

  // ─── Terrenos ───
  {
    name: 'Terreno 500m² con Vista al Mar',
    desc: 'Terreno plano con todos los servicios (agua, luz, cloacas). Ubicación privilegiada con posibilidad de vista al mar. Documentos al día. Ideal para construir casa de playa.',
    price: 75000,
    cat: 'Terrenos',
    images: [IMG.terreno1],
    specs: { m2: '500' },
    tags: ['Servicios completos', 'Vista al mar'],
  },
  {
    name: 'Parcela 1200m² en Zona Industrial',
    desc: 'Parcela en zona industrial. Acceso por vía principal, servicios básicos disponibles. Ideal para galpón, taller o comercio. Documentos completos.',
    price: 55000,
    cat: 'Terrenos',
    images: [IMG.terreno2],
    specs: { m2: '1200' },
    tags: ['Zona industrial', 'Vía principal'],
  },

  // ─── Locales ───
  {
    name: 'Local Comercial en Centro Comercial',
    desc: 'Local comercial en planta baja de centro comercial con alto tráfico peatonal. Ideal para tienda de ropa, restaurante o servicios. Baño propio. Disponible inmediatamente.',
    price: 48000,
    cat: 'Locales Comerciales',
    images: [IMG.local1],
    specs: { m2: '85' },
    tags: ['Alto tráfico', 'Planta baja'],
  },
  {
    name: 'Oficina Premium en Torre Empresarial',
    desc: 'Oficina en torre empresarial con recepción, 3 privados, sala de reuniones y baño. Vista a la ciudad. AC central. Planta eléctrica y pozo de agua.',
    price: 68000,
    cat: 'Locales Comerciales',
    images: [IMG.local2],
    featured: true,
    specs: { m2: '120', parking: '2' },
    tags: ['Planta eléctrica', 'Pozo de agua', 'AC central'],
  },
];

function buildAttributes(specs: PropertySpec, tags?: string[]) {
  const attrs: { name: string; options: string[]; type: string; role: string; sortOrder: number }[] = [];
  let order = 0;

  if (specs.hab) {
    attrs.push({ name: 'Habitaciones', options: [specs.hab], type: 'text', role: 'spec', sortOrder: order++ });
  }
  if (specs.bath) {
    attrs.push({ name: 'Baños', options: [specs.bath], type: 'text', role: 'spec', sortOrder: order++ });
  }
  if (specs.m2) {
    attrs.push({ name: 'm²', options: [specs.m2], type: 'text', role: 'spec', sortOrder: order++ });
  }
  if (specs.year) {
    attrs.push({ name: 'Año', options: [specs.year], type: 'text', role: 'spec', sortOrder: order++ });
  }
  if (specs.parking) {
    attrs.push({ name: 'Estacionamiento', options: [specs.parking], type: 'text', role: 'spec', sortOrder: order++ });
  }
  if (tags?.length) {
    attrs.push({ name: 'Características', options: tags, type: 'text', role: 'tag', sortOrder: order++ });
  }

  return attrs;
}

async function main() {
  console.log(`🏠 Starting real estate seed${IS_DEMO ? ' (DEMO mode)' : ''}...\n`);

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
    console.log('🧹 Cleaned previous real estate data');
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      name: 'Andrea Torres',
      emailVerified: new Date(),
      isDemo: IS_DEMO,
    },
  });
  console.log(`✅ User: ${EMAIL} / password123${IS_DEMO ? ' (isDemo=true)' : ''}`);

  const store = await prisma.store.create({
    data: {
      slug: STORE_SLUG,
      username: STORE_SLUG,
      name: 'Andrea Torres Propiedades',
      description: 'Agente inmobiliario certificado. Casas, apartamentos, terrenos y locales comerciales. +10 años asesorando compra y venta de inmuebles.',
      logo: IMG.logo,
      banner: IMG.banner,
      primaryColor: '#1A3A52',
      secondaryColor: '#D4AF37',
      template: 'inmuebles',
      whatsappNumbers: ['+584141234567'],
      instagramHandle: 'andreatorres.propiedades',
      email: 'andrea@torrespropiedades.com',
      currencyConfig: { code: 'USD', symbol: '$', locale: 'es-VE' },
      stockEnabled: false,
      showBranding: true,
      ownerId: user.id,
    },
  });
  console.log(`✅ Store: "${store.name}" (/${store.slug}) — template: inmuebles`);

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
    { name: 'Casas', order: 1 },
    { name: 'Apartamentos', order: 2 },
    { name: 'Terrenos', order: 3 },
    { name: 'Locales Comerciales', order: 4 },
  ];

  for (const c of categoriesData) {
    const cat = await prisma.category.create({
      data: {
        storeId: store.id,
        name: c.name,
        slug: slug(c.name),
        sortOrder: c.order,
      },
    });
    categoryMap[c.name] = cat.id;
  }
  console.log(`✅ Categories: ${categoriesData.length}`);

  for (let i = 0; i < PROPERTIES.length; i++) {
    const prop = PROPERTIES[i];
    const attrs = buildAttributes(prop.specs, prop.tags);
    await prisma.product.create({
      data: {
        storeId: store.id,
        name: prop.name,
        slug: slug(prop.name),
        description: prop.desc,
        basePrice: prop.price,
        images: prop.images,
        stock: 1,
        isVisible: true,
        isFeatured: prop.featured ?? false,
        sortOrder: i,
        categories: {
          create: { categoryId: categoryMap[prop.cat] },
        },
        attributes: {
          create: attrs,
        },
      },
    });
  }
  console.log(`✅ Properties: ${PROPERTIES.length}`);

  console.log('\n🎉 Real estate seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`   Mode:       ${IS_DEMO ? 'DEMO (isDemo=true, slug prefix demo-)' : 'real'}`);
  console.log(`   Login:      ${EMAIL} / password123`);
  console.log(`   Store:      /${STORE_SLUG}`);
  console.log(`   Template:   inmuebles`);
  console.log(`   Properties: ${PROPERTIES.length}`);
  console.log(`   Categories: ${categoriesData.length}`);
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding real estate:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
