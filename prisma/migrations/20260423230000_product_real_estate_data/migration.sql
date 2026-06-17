-- CreateEnum
CREATE TYPE "RealEstateListingType" AS ENUM ('SALE', 'RENT');

-- CreateTable
CREATE TABLE "product_real_estate_data" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" DECIMAL(10,2),
    "listingType" "RealEstateListingType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_real_estate_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_real_estate_data_productId_key" ON "product_real_estate_data"("productId");

-- AddForeignKey
ALTER TABLE "product_real_estate_data"
  ADD CONSTRAINT "product_real_estate_data_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
