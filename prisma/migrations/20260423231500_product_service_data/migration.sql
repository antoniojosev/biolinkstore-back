-- CreateEnum
CREATE TYPE "ServiceModality" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

-- CreateTable
CREATE TABLE "product_service_data" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "duration" INTEGER,
    "modality" "ServiceModality",
    "coverage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_service_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_service_data_productId_key" ON "product_service_data"("productId");

-- AddForeignKey
ALTER TABLE "product_service_data"
  ADD CONSTRAINT "product_service_data_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
