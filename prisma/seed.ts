import { PrismaClient, Plan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash,
      name: 'Demo User',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create demo store
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      slug: 'demo-store',
      name: 'Demo Store',
      description: 'This is a demo store for testing purposes',
      primaryColor: '#3b82f6',
      whatsappNumbers: ['+1234567890'],
      instagramHandle: '@demostore',
      ownerId: user.id,
    },
  });

  console.log('✅ Created demo store:', store.slug);

  // Create subscription for store
  await prisma.subscription.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      plan: Plan.FREE,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  console.log('✅ Created subscription for store');

  // Create demo categories
  const category1 = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Ropa',
      slug: 'ropa',
      sortOrder: 1,
    },
  });

  const category2 = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Accesorios',
      slug: 'accesorios',
      sortOrder: 2,
    },
  });

  console.log('✅ Created demo categories');

  // Create demo products
  const product1 = await prisma.product.create({
    data: {
      storeId: store.id,
      name: 'Camiseta Básica',
      slug: 'camiseta-basica',
      description: 'Camiseta de algodón 100%',
      basePrice: 19.99,
      compareAtPrice: 29.99,
      images: ['https://via.placeholder.com/400'],
      stock: 50,
      sku: 'SHIRT-001',
      isVisible: true,
      isFeatured: true,
      categories: {
        create: {
          categoryId: category1.id,
        },
      },
      attributes: {
        create: [
          {
            name: 'Talla',
            options: ['S', 'M', 'L', 'XL'],
            sortOrder: 1,
          },
          {
            name: 'Color',
            options: ['Negro', 'Blanco', 'Azul'],
            sortOrder: 2,
          },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      storeId: store.id,
      name: 'Gorra Snapback',
      slug: 'gorra-snapback',
      description: 'Gorra ajustable de alta calidad',
      basePrice: 15.99,
      images: ['https://via.placeholder.com/400'],
      stock: 30,
      sku: 'CAP-001',
      isVisible: true,
      categories: {
        create: {
          categoryId: category2.id,
        },
      },
    },
  });

  console.log('✅ Created demo products');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
