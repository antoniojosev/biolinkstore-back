-- AlterTable
ALTER TABLE "categories" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "categories_storeId_parentId_idx" ON "categories"("storeId", "parentId");

-- AddForeignKey
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
