-- BE-124: store social links as a relational table

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('IG', 'TIKTOK', 'FACEBOOK', 'TWITTER', 'YOUTUBE', 'THREADS', 'WHATSAPP');

-- CreateTable
CREATE TABLE "store_social_links" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "label" VARCHAR(60),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_social_links_storeId_sortOrder_idx" ON "store_social_links"("storeId", "sortOrder");

-- CreateIndex
CREATE INDEX "store_social_links_storeId_visible_sortOrder_idx" ON "store_social_links"("storeId", "visible", "sortOrder");

-- AddForeignKey
ALTER TABLE "store_social_links"
  ADD CONSTRAINT "store_social_links_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTE: data migration from Store.socialLinks JSON is performed lazily at read-time
-- (see infrastructure/persistence/prisma-store-social-link.repository.ts).
-- We do NOT touch the legacy column here.
