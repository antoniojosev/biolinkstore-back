/**
 * Backfill: ensure every existing Store has a StoreMember row marking its
 * `ownerId` user as OWNER (BE-131).
 *
 * Before BE-131 the store-owner relationship lived only in `Store.ownerId`.
 * BE-131 introduced the StoreMember table and the team-members guard now
 * looks up authorization there. Stores created before this fix have no
 * StoreMember row, so the owner gets 403 on their own store's /members
 * endpoints. This script creates the missing OWNER rows.
 *
 * Idempotent: skips stores that already have any StoreMember row for the
 * owner — safe to re-run.
 *
 * Run once after `prisma migrate deploy` in prod:
 *   npx ts-node prisma/scripts/backfill-store-owner-members.ts
 */

import { PrismaClient, StoreMemberRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, ownerId: true, slug: true, createdAt: true },
  });

  let created = 0;
  let skipped = 0;

  for (const store of stores) {
    const existing = await prisma.storeMember.findUnique({
      where: { storeId_userId: { storeId: store.id, userId: store.ownerId } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.storeMember.create({
      data: {
        storeId: store.id,
        userId: store.ownerId,
        role: StoreMemberRole.OWNER,
        invitedBy: null,
        joinedAt: store.createdAt,
      },
    });
    created++;
    console.log(`  + OWNER row created for store /${store.slug} (${store.id})`);
  }

  console.log(`\nBackfill done. ${created} created, ${skipped} already present.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
