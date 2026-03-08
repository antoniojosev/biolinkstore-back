import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_EMAIL = 'demo@example.com';

async function main() {
  console.log(`🗑️  Deleting all users except ${KEEP_EMAIL}...\n`);

  const users = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log('✅ No users to delete.');
    return;
  }

  let deleted = 0;
  for (const user of users) {
    const stores = await prisma.store.findMany({ where: { ownerId: user.id } });

    for (const store of stores) {
      const orders = await prisma.orderIntent.findMany({ where: { storeId: store.id } });
      for (const order of orders) {
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      }
      await prisma.orderIntent.deleteMany({ where: { storeId: store.id } });
      await prisma.store.delete({ where: { id: store.id } });
    }

    await prisma.user.delete({ where: { id: user.id } });
    console.log(`  ❌ ${user.email}`);
    deleted++;
  }

  console.log(`\n✅ Deleted ${deleted} user(s). Demo account preserved.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
