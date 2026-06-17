// Usage:
//   ts-node prisma/seeds/seed-servicios.ts            → siembra store "real" (slug: daniel-mendoza-foto)
//   ts-node prisma/seeds/seed-servicios.ts --demo     → siembra store demo (slug: demo-daniel-mendoza-foto, User.isDemo=true)
//   DEMO=true ts-node prisma/seeds/seed-servicios.ts  → idem via env var
// Los modos usan emails distintos (foto@example.com vs demo-foto@example.com),
// asi que correr uno NO pisa los datos del otro. Cada modo es idempotente por email.
import { PrismaClient, Plan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IS_DEMO = process.argv.includes('--demo') || process.env.DEMO === 'true';
const DEMO_PREFIX = 'demo-';
const EMAIL = IS_DEMO ? 'demo-foto@example.com' : 'foto@example.com';
const STORE_SLUG = IS_DEMO ? `${DEMO_PREFIX}daniel-mendoza-foto` : 'daniel-mendoza-foto';

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const IMG = {
  logo: '/demo-assets/servicios/logo.jpg',
  banner: '/demo-assets/servicios/banner.jpg',
  // Retratos
  retrato1: '/demo-assets/servicios/retrato1.jpg',
  retrato2: '/demo-assets/servicios/retrato2.jpg',
  retrato3: '/demo-assets/servicios/retrato3.jpg',
  retrato4: '/demo-assets/servicios/retrato4.jpg',
  retrato5: '/demo-assets/servicios/retrato5.jpg',
  // Eventos
  evento1: '/demo-assets/servicios/evento1.jpg',
  evento2: '/demo-assets/servicios/evento2.jpg',
  evento3: '/demo-assets/servicios/evento3.jpg',
  evento4: '/demo-assets/servicios/evento4.jpg',
  // Producto
  producto1: '/demo-assets/servicios/producto1.jpg',
  producto2: '/demo-assets/servicios/producto2.jpg',
  producto3: '/demo-assets/servicios/producto3.jpg',
  // Parejas
  pareja1: '/demo-assets/servicios/pareja1.jpg',
  pareja2: '/demo-assets/servicios/pareja2.jpg',
  pareja3: '/demo-assets/servicios/pareja3.jpg',
  // Embarazo / Familia
  familia1: '/demo-assets/servicios/familia1.jpg',
  familia2: '/demo-assets/servicios/familia2.jpg',
};

const SERVICES = [
  // ─── Retratos ───
  {
    name: 'Sesión de Retrato Individual',
    desc: 'Sesión de 1 hora en locación o estudio. Incluye 15 fotos editadas en alta resolución. Ideal para redes sociales, LinkedIn o marca personal.',
    price: 30,
    cat: 'Retratos',
    images: [IMG.retrato1, IMG.retrato2, IMG.retrato3],
    featured: true,
  },
  {
    name: 'Retrato Profesional / Corporativo',
    desc: 'Sesión enfocada en headshots profesionales. 30 minutos, 8 fotos editadas. Fondo neutro o en tu oficina. Entrega en 48 horas.',
    price: 20,
    cat: 'Retratos',
    images: [IMG.retrato4, IMG.retrato5],
  },
  {
    name: 'Mini Sesión Express',
    desc: '20 minutos, 5 fotos editadas. Perfecta para actualizar tu foto de perfil. En exteriores o estudio.',
    price: 15,
    cat: 'Retratos',
    images: [IMG.retrato5, IMG.retrato1],
  },

  // ─── Eventos ───
  {
    name: 'Cobertura de Evento Completa',
    desc: 'Cobertura fotográfica de hasta 6 horas. Eventos corporativos, fiestas, graduaciones. Entrega de 80-120 fotos editadas. Incluye galería online privada.',
    price: 80,
    cat: 'Eventos',
    images: [IMG.evento1, IMG.evento2, IMG.evento3, IMG.evento4],
    featured: true,
  },
  {
    name: 'Cobertura de Boda',
    desc: 'Cobertura completa de tu boda: preparativos, ceremonia, recepción. Hasta 8 horas. 200+ fotos editadas. Álbum digital incluido.',
    price: 150,
    cat: 'Eventos',
    images: [IMG.evento2, IMG.evento1],
    featured: true,
  },
  {
    name: 'Cobertura Media Jornada',
    desc: 'Hasta 3 horas de cobertura. Ideal para cumpleaños, bautizos, reuniones. 40-60 fotos editadas.',
    price: 50,
    cat: 'Eventos',
    images: [IMG.evento3, IMG.evento4],
  },

  // ─── Producto ───
  {
    name: 'Fotos de Producto (10 unidades)',
    desc: 'Sesión de fotografía de producto. 10 fotos en fondo blanco o ambientadas. Ideal para e-commerce, redes sociales o catálogo. Entrega en 3 días.',
    price: 25,
    cat: 'Producto',
    images: [IMG.producto1, IMG.producto2, IMG.producto3],
  },
  {
    name: 'Fotos de Producto Pack Completo (30 unidades)',
    desc: '30 fotos de producto con variaciones. Incluye fondo blanco, lifestyle y detalle. Para tiendas online que necesitan contenido profesional.',
    price: 60,
    cat: 'Producto',
    images: [IMG.producto2, IMG.producto3, IMG.producto1],
    featured: true,
  },

  // ─── Parejas / Familia ───
  {
    name: 'Sesión de Pareja',
    desc: 'Sesión de 1.5 horas en locación. 20 fotos editadas. Engagement, aniversario o simplemente porque sí. Elegimos juntos la mejor locación.',
    price: 40,
    cat: 'Parejas y Familia',
    images: [IMG.pareja1, IMG.pareja2, IMG.pareja3],
  },
  {
    name: 'Sesión Familiar',
    desc: 'Sesión de 1 hora para familia (hasta 6 personas). 15 fotos editadas. En parque, playa o tu hogar. Momentos naturales y espontáneos.',
    price: 35,
    cat: 'Parejas y Familia',
    images: [IMG.familia1, IMG.familia2],
  },
  {
    name: 'Sesión de Embarazo',
    desc: 'Sesión especial de maternidad. 1 hora, 15 fotos editadas. En estudio o exteriores. Incluye guía de poses y qué vestir.',
    price: 35,
    cat: 'Parejas y Familia',
    images: [IMG.familia2, IMG.familia1],
  },
];

async function main() {
  console.log(`📷 Starting photographer seed${IS_DEMO ? ' (DEMO mode)' : ''}...\n`);

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
    console.log('🧹 Cleaned previous photographer data');
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      name: 'Daniel Fotografía',
      emailVerified: new Date(),
      isDemo: IS_DEMO,
    },
  });
  console.log(`✅ User: ${EMAIL} / password123${IS_DEMO ? ' (isDemo=true)' : ''}`);

  const store = await prisma.store.create({
    data: {
      slug: STORE_SLUG,
      username: STORE_SLUG,
      name: 'Daniel Mendoza',
      description: 'Fotógrafo profesional. Retratos, eventos, bodas y producto. Tu historia merece buenas fotos.',
      logo: IMG.logo,
      banner: IMG.banner,
      primaryColor: '#2D2D2D',
      secondaryColor: '#D4AF37',
      template: 'atelier',
      whatsappNumbers: ['+584149876543'],
      instagramHandle: 'danielmendozafoto',
      email: 'hola@danielfoto.com',
      currencyConfig: { code: 'USD', symbol: '$', locale: 'es-VE' },
      stockEnabled: false,
      showBranding: true,
      ownerId: user.id,
    },
  });
  console.log(`✅ Store: "${store.name}" (/${store.slug}) — template: atelier`);

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
    { name: 'Retratos', order: 1 },
    { name: 'Eventos', order: 2 },
    { name: 'Producto', order: 3 },
    { name: 'Parejas y Familia', order: 4 },
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

  for (let i = 0; i < SERVICES.length; i++) {
    const svc = SERVICES[i];
    await prisma.product.create({
      data: {
        storeId: store.id,
        name: svc.name,
        slug: slug(svc.name),
        description: svc.desc,
        basePrice: svc.price,
        images: svc.images,
        stock: 999,
        isVisible: true,
        isFeatured: svc.featured ?? false,
        sortOrder: i,
        categories: {
          create: { categoryId: categoryMap[svc.cat] },
        },
      },
    });
  }
  console.log(`✅ Services: ${SERVICES.length}`);

  console.log('\n🎉 Photographer seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`   Mode:       ${IS_DEMO ? 'DEMO (isDemo=true, slug prefix demo-)' : 'real'}`);
  console.log(`   Login:      ${EMAIL} / password123`);
  console.log(`   Store:      /${STORE_SLUG}`);
  console.log(`   Template:   atelier`);
  console.log(`   Services:   ${SERVICES.length}`);
  console.log(`   Categories: ${categoriesData.length}`);
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding photographer:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
