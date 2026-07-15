-- CreateEnum
CREATE TYPE "InstagramImportStatus" AS ENUM ('RUNNING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "instagramImportId" TEXT;

-- CreateTable
CREATE TABLE "instagram_imports" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "status" "InstagramImportStatus" NOT NULL DEFAULT 'RUNNING',
    "apifyRunId" TEXT,
    "apifyDatasetId" TEXT,
    "postsFound" INTEGER NOT NULL DEFAULT 0,
    "postsProcessed" INTEGER NOT NULL DEFAULT 0,
    "postsSkipped" INTEGER NOT NULL DEFAULT 0,
    "productsCreated" INTEGER NOT NULL DEFAULT 0,
    "profileName" TEXT,
    "profileFollowers" INTEGER,
    "error" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instagram_imports_storeId_requestedAt_idx" ON "instagram_imports"("storeId", "requestedAt");

-- CreateIndex
CREATE INDEX "products_instagramImportId_idx" ON "products"("instagramImportId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_instagramImportId_fkey" FOREIGN KEY ("instagramImportId") REFERENCES "instagram_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_imports" ADD CONSTRAINT "instagram_imports_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
