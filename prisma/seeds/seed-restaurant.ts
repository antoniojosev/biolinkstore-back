// Usage:
//   ts-node prisma/seeds/seed-restaurant.ts            → siembra store "real" (slug: brooklyn-burger-house)
//   ts-node prisma/seeds/seed-restaurant.ts --demo     → siembra store demo (slug: demo-brooklyn-burger-house, User.isDemo=true)
//   DEMO=true ts-node prisma/seeds/seed-restaurant.ts  → idem via env var
// Los modos usan emails distintos (restaurante@example.com vs demo-restaurante@example.com),
// asi que correr uno NO pisa los datos del otro. Cada modo es idempotente por email.
import { PrismaClient, Plan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IS_DEMO = process.argv.includes('--demo') || process.env.DEMO === 'true';
const DEMO_PREFIX = 'demo-';
const EMAIL = IS_DEMO ? 'demo-restaurante@example.com' : 'restaurante@example.com';
const STORE_SLUG = IS_DEMO ? `${DEMO_PREFIX}brooklyn-burger-house` : 'brooklyn-burger-house';

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Food images from Unsplash ────────────────────────────
const IMG = {
  logo: '/demo-assets/restaurant/logo.jpg',
  banner: '/demo-assets/restaurant/banner.jpg',
  // Starters
  wings: '/demo-assets/restaurant/wings.jpg',
  onionRings: '/demo-assets/restaurant/onionRings.jpg',
  nachos: '/demo-assets/restaurant/nachos.jpg',
  // Burgers
  classicBurger: '/demo-assets/restaurant/classicBurger.jpg',
  doubleBurger: '/demo-assets/restaurant/doubleBurger.jpg',
  baconBurger: '/demo-assets/restaurant/baconBurger.jpg',
  smashBurger: '/demo-assets/restaurant/smashBurger.jpg',
  // Grill & Sandwiches
  ribs: '/demo-assets/restaurant/ribs.jpg',
  pulledPork: '/demo-assets/restaurant/pulledPork.jpg',
  chickenBBQ: '/demo-assets/restaurant/chickenBBQ.jpg',
  clubSandwich: '/demo-assets/restaurant/clubSandwich.jpg',
  // Sides
  fries: '/demo-assets/restaurant/fries.jpg',
  // Drinks
  lemonade: '/demo-assets/restaurant/lemonade.jpg',
  cola: '/demo-assets/restaurant/cola.jpg',
  craftBeer: '/demo-assets/restaurant/craftBeer.jpg',
  milkshake: '/demo-assets/restaurant/milkshake.jpg',
  coffee: '/demo-assets/restaurant/coffee.jpg',
  // Desserts
  brownie: '/demo-assets/restaurant/brownie.jpg',
  cheesecake: '/demo-assets/restaurant/cheesecake.jpg',
  applePie: '/demo-assets/restaurant/applePie.jpg',
  iceCream: '/demo-assets/restaurant/iceCream.jpg',
};

// ─── Ingredient presets (reused across burgers / sandwiches) ────────────────
// Each customizable item references one of these so the priceDelta for
// "Queso extra" is identical across Classic/Bacon/Smash, etc.
const BURGER_INCLUDED = ['Lechuga', 'Tomate', 'Pickles', 'Cebolla', 'House sauce'];
const BURGER_EXTRAS: Array<{ name: string; priceDelta: number }> = [
  { name: 'Queso extra', priceDelta: 100 },
  { name: 'Doble carne', priceDelta: 300 },
  { name: 'Bacon', priceDelta: 200 },
  { name: 'Aguacate', priceDelta: 150 },
  { name: 'Jalapeños', priceDelta: 50 },
  { name: 'Cebolla caramelizada', priceDelta: 80 },
  { name: 'Huevo frito', priceDelta: 120 },
  { name: 'Aros de cebolla', priceDelta: 100 },
];

const SANDWICH_INCLUDED_PULLED = ['Coleslaw', 'Pan brioche', 'BBQ sauce'];
const SANDWICH_EXTRAS_PULLED: Array<{ name: string; priceDelta: number }> = [
  { name: 'Queso cheddar', priceDelta: 100 },
  { name: 'Jalapeños', priceDelta: 50 },
  { name: 'Aguacate', priceDelta: 150 },
  { name: 'Doble porción', priceDelta: 400 },
];

const SANDWICH_INCLUDED_CLUB = ['Lechuga', 'Tomate', 'Tocineta', 'Huevo', 'Mayo'];
const SANDWICH_EXTRAS_CLUB: Array<{ name: string; priceDelta: number }> = [
  { name: 'Queso extra', priceDelta: 100 },
  { name: 'Aguacate', priceDelta: 150 },
  { name: 'Doble pollo', priceDelta: 300 },
  { name: 'Pan integral', priceDelta: 0 },
];

const NACHOS_INCLUDED = ['Cheddar fundido', 'Pico de gallo', 'Guacamole', 'Sour cream', 'Jalapeños'];
const NACHOS_EXTRAS: Array<{ name: string; priceDelta: number }> = [
  { name: 'Carne desmechada', priceDelta: 250 },
  { name: 'Pollo BBQ', priceDelta: 220 },
  { name: 'Extra queso', priceDelta: 120 },
  { name: 'Extra guacamole', priceDelta: 100 },
  { name: 'Chili beans', priceDelta: 80 },
];

interface MenuItem {
  name: string;
  desc: string;
  price: number;
  compare?: number;
  cat: string;
  img: string;
  featured?: boolean;
  tagline?: string;
  customizable?: boolean;
  included?: string[];
  extras?: Array<{ name: string; priceDelta: number }>;
}

const MENU_ITEMS: MenuItem[] = [
  // ─── Burgers & Sandwiches ───
  {
    name: 'Classic Cheeseburger',
    desc: 'Carne angus 150g, queso americano, lechuga, tomate, pickles y nuestra house sauce. Con papas fritas.',
    price: 1100,
    cat: 'Burgers',
    img: IMG.classicBurger,
    featured: true,
    tagline: 'Como te gusta',
    customizable: true,
    included: BURGER_INCLUDED,
    extras: BURGER_EXTRAS,
  },
  // ─── Starters ───
  { name: 'Buffalo Wings (8 piezas)', desc: 'Alitas de pollo bañadas en salsa buffalo clásica. Con blue cheese y bastones de apio.', price: 850, cat: 'Starters', img: IMG.wings, featured: true },
  { name: 'Onion Rings Crispy', desc: 'Aros de cebolla empanizados con mezcla casera. Crujientes por fuera, tiernos por dentro. Con dip ranch.', price: 550, cat: 'Starters', img: IMG.onionRings },
  {
    name: 'Loaded Nachos',
    desc: 'Tortillas con cheddar fundido, pico de gallo, guacamole, jalapeños y sour cream. Para compartir.',
    price: 750,
    cat: 'Starters',
    img: IMG.nachos,
    tagline: 'A tu manera',
    customizable: true,
    included: NACHOS_INCLUDED,
    extras: NACHOS_EXTRAS,
  },
  {
    name: 'Double Trouble Burger',
    desc: 'Doble carne angus 300g, doble cheddar, cebolla caramelizada, tocineta y BBQ sauce. Con papas.',
    price: 1450,
    compare: 1700,
    cat: 'Burgers',
    img: IMG.doubleBurger,
    featured: true,
    tagline: 'Como te gusta',
    customizable: true,
    included: ['Doble cheddar', 'Cebolla caramelizada', 'Tocineta', 'BBQ sauce', 'Pickles'],
    extras: BURGER_EXTRAS,
  },
  {
    name: 'Smokehouse Bacon Burger',
    desc: 'Carne 180g, queso pepper jack, tocineta ahumada, aros de cebolla crispy y salsa chipotle. Con papas.',
    price: 1350,
    cat: 'Burgers',
    img: IMG.baconBurger,
    tagline: 'Como te gusta',
    customizable: true,
    included: ['Pepper jack', 'Tocineta ahumada', 'Aros de cebolla', 'Salsa chipotle', 'Lechuga'],
    extras: BURGER_EXTRAS,
  },
  {
    name: 'Smash Burger',
    desc: 'Dos patties smasheadas estilo American diner, queso americano, pickles, cebolla y mostaza. Con papas.',
    price: 1200,
    cat: 'Burgers',
    img: IMG.smashBurger,
    tagline: 'Como te gusta',
    customizable: true,
    included: ['Queso americano', 'Pickles', 'Cebolla', 'Mostaza'],
    extras: BURGER_EXTRAS,
  },
  {
    name: 'Pulled Pork Sandwich',
    desc: 'Cerdo cocinado 12 horas desmechado en BBQ sauce, coleslaw fresco en pan brioche. Con papas.',
    price: 1150,
    cat: 'Burgers',
    img: IMG.pulledPork,
    tagline: 'A tu manera',
    customizable: true,
    included: SANDWICH_INCLUDED_PULLED,
    extras: SANDWICH_EXTRAS_PULLED,
  },
  {
    name: 'Club Sandwich',
    desc: 'Triple piso: pollo grillado, tocineta, lechuga, tomate, huevo y mayo. Con papas fritas.',
    price: 950,
    cat: 'Burgers',
    img: IMG.clubSandwich,
    tagline: 'A tu manera',
    customizable: true,
    included: SANDWICH_INCLUDED_CLUB,
    extras: SANDWICH_EXTRAS_CLUB,
  },

  // ─── Grill ───
  { name: 'BBQ Ribs Rack', desc: 'Costillas de cerdo baby back glaseadas en BBQ sauce ahumada. Cocción lenta 6 horas. Con papas y coleslaw.', price: 1800, cat: 'Grill', img: IMG.ribs, featured: true },
  { name: 'BBQ Chicken Plate', desc: 'Medio pollo marinado y glaseado en salsa BBQ de la casa. Con mazorca grillada y papas rústicas.', price: 1250, cat: 'Grill', img: IMG.chickenBBQ },
  { name: 'Papas Fritas Grandes', desc: 'Porción grande de papas fritas crujientes. Opción con cheddar y tocineta (+$150).', price: 400, cat: 'Grill', img: IMG.fries },

  // ─── Drinks ───
  { name: 'Homemade Lemonade', desc: 'Limonada casera con hierbabuena fresca. Fría y refrescante. 500ml.', price: 250, cat: 'Drinks', img: IMG.lemonade },
  { name: 'Soft Drink', desc: 'Cola, limón, naranja o uva. Vaso de 400ml con hielo.', price: 200, cat: 'Drinks', img: IMG.cola },
  { name: 'Craft Beer', desc: 'Cerveza artesanal seleccionada. IPA, Lager o Stout. 330ml bien fría.', price: 450, cat: 'Drinks', img: IMG.craftBeer },
  { name: 'Classic Milkshake', desc: 'Malteada cremosa con helado artesanal. Sabores: chocolate, vainilla, fresa u Oreo. 400ml.', price: 550, cat: 'Drinks', img: IMG.milkshake },
  { name: 'Drip Coffee', desc: 'Café recién colado. Opción con leche o espresso shot. 250ml.', price: 150, cat: 'Drinks', img: IMG.coffee },

  // ─── Desserts ───
  { name: 'Warm Brownie Sundae', desc: 'Brownie tibio de chocolate belga con helado de vainilla, crema batida y salsa de chocolate.', price: 600, cat: 'Desserts', img: IMG.brownie, featured: true },
  { name: 'NY Cheesecake', desc: 'Cheesecake estilo New York con coulis de frutos rojos. Base de galleta graham.', price: 550, cat: 'Desserts', img: IMG.cheesecake },
  { name: 'Apple Pie', desc: 'Pie de manzana caliente con canela y masa hojaldrada. Con bola de helado de vainilla.', price: 500, cat: 'Desserts', img: IMG.applePie },
  { name: 'Ice Cream Sundae', desc: 'Tres bolas de helado artesanal con topping: caramelo, chocolate o frutos rojos. Crema batida y cerezas.', price: 500, cat: 'Desserts', img: IMG.iceCream },
];

async function main() {
  console.log(`🍔 Starting restaurant seed${IS_DEMO ? ' (DEMO mode)' : ''}...\n`);

  // Clean existing restaurant data for this mode's email only
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
    console.log('🧹 Cleaned previous restaurant data');
  }

  // ─── 1. User ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      name: 'Brooklyn Burger House',
      emailVerified: new Date(),
      isDemo: IS_DEMO,
    },
  });
  console.log(`✅ User: ${EMAIL} / password123${IS_DEMO ? ' (isDemo=true)' : ''}`);

  // ─── 2. Store ─────────────────────────────────────────────
  const store = await prisma.store.create({
    data: {
      slug: STORE_SLUG,
      username: STORE_SLUG,
      name: 'Brooklyn Burger House',
      description: 'Hamburguesas smash, BBQ ribs, wings y milkshakes. American grill hecho en casa. Pedidos por WhatsApp.',
      logo: IMG.logo,
      banner: IMG.banner,
      primaryColor: '#B91C1C',
      secondaryColor: '#1F2937',
      template: 'poster',
      whatsappNumbers: ['+584121234567'],
      instagramHandle: 'brooklynburgerhouse',
      email: 'pedidos@brooklynburger.com',
      currencyConfig: { code: 'USD', symbol: '$', locale: 'es-VE' },
      stockEnabled: false,
      showBranding: true,
      ownerId: user.id,
    },
  });
  console.log(`✅ Store: "${store.name}" (/${store.slug}) — template: poster`);

  // ─── 3. Subscription (PRO) ────────────────────────────────
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

  // ─── 4. Categories ────────────────────────────────────────
  const categoryMap: Record<string, string> = {};
  const categoriesData = [
    { name: 'Starters', order: 1 },
    { name: 'Burgers', order: 2 },
    { name: 'Grill', order: 3 },
    { name: 'Drinks', order: 4 },
    { name: 'Desserts', order: 5 },
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

  // ─── 5. Products (menu items) ─────────────────────────────
  type AttrInput = {
    name: string;
    type: string;
    role: string;
    options: string[];
    optionsMeta?: Record<string, { priceDelta?: number; default?: boolean }>;
  };

  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const item = MENU_ITEMS[i];
    const isMilkshake = item.name.includes('Milkshake');
    const isBurger = item.cat === 'Burgers' && /Burger|Cheeseburger/.test(item.name);
    const isIceCream = item.name.includes('Ice Cream Sundae');
    const isRibs = item.name.includes('BBQ Ribs');

    const attrs: AttrInput[] = [];

    // Variant-style attributes (existing behavior)
    if (isMilkshake) {
      attrs.push({ name: 'Sabor', type: 'text', role: 'variant', options: ['Chocolate', 'Vainilla', 'Fresa', 'Oreo'] });
    } else if (isBurger) {
      attrs.push({ name: 'Punto', type: 'text', role: 'variant', options: ['Término medio', 'Tres cuartos', 'Bien cocida'] });
    } else if (isIceCream) {
      attrs.push({ name: 'Topping', type: 'text', role: 'variant', options: ['Caramelo', 'Chocolate', 'Frutos rojos'] });
    } else if (isRibs) {
      attrs.push({ name: 'Tamaño', type: 'text', role: 'variant', options: ['Half Rack', 'Full Rack'] });
    }

    // Ingredient attributes — power the "Arma tu …" flow in the poster template.
    // The renderer picks the first attribute with role='ingredient-included' and
    // the first with role='ingredient-extra', so one of each is enough.
    if (item.customizable && item.included && item.included.length > 0) {
      attrs.push({
        name: 'Lleva incluido',
        type: 'text',
        role: 'ingredient-included',
        options: item.included,
      });
    }
    if (item.customizable && item.extras && item.extras.length > 0) {
      const optionsMeta: Record<string, { priceDelta: number }> = {};
      for (const e of item.extras) optionsMeta[e.name] = { priceDelta: e.priceDelta };
      attrs.push({
        name: 'Súmale extras',
        type: 'text',
        role: 'ingredient-extra',
        options: item.extras.map((e) => e.name),
        optionsMeta,
      });
    }

    await prisma.product.create({
      data: {
        storeId: store.id,
        name: item.name,
        slug: slug(item.name),
        description: item.desc,
        tagline: item.tagline ?? null,
        basePrice: item.price,
        compareAtPrice: item.compare ?? null,
        images: [item.img],
        stock: 999,
        isVisible: true,
        isFeatured: item.featured ?? false,
        isOnSale: !!item.compare,
        sortOrder: i,
        categories: {
          create: { categoryId: categoryMap[item.cat] },
        },
        attributes: {
          create: attrs.map((a, idx) => ({
            name: a.name,
            type: a.type,
            role: a.role,
            options: a.options,
            optionsMeta: a.optionsMeta ?? undefined,
            sortOrder: idx,
          })),
        },
      },
    });

    // Create variants for Ribs (Half/Full Rack)
    if (isRibs) {
      const product = await prisma.product.findFirst({
        where: { storeId: store.id, slug: slug(item.name) },
      });
      if (product) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            combination: { Tamaño: 'Half Rack' },
            priceAdjustment: 0,
            stock: 999,
            isAvailable: true,
          },
        });
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            combination: { Tamaño: 'Full Rack' },
            priceAdjustment: 1200,
            stock: 999,
            isAvailable: true,
          },
        });
      }
    }
  }
  console.log(`✅ Menu items: ${MENU_ITEMS.length}`);

  // ─── Done ─────────────────────────────────────────────────
  console.log('\n🎉 Restaurant seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`   Mode:       ${IS_DEMO ? 'DEMO (isDemo=true, slug prefix demo-)' : 'real'}`);
  console.log(`   Login:      ${EMAIL} / password123`);
  console.log(`   Store:      /${STORE_SLUG}`);
  console.log(`   Preview:    /${STORE_SLUG} (template: poster)`);
  console.log(`   Products:   ${MENU_ITEMS.length}`);
  console.log(`   Categories: ${categoriesData.length}`);
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding restaurant:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
