-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PAGO_MOVIL', 'ZELLE', 'BINANCE', 'TRANSFER', 'CASH', 'OTHER');

-- CreateTable
CREATE TABLE "store_payment_methods" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "details" JSONB NOT NULL,
    "instructions" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_payment_methods_storeId_enabled_displayOrder_idx" ON "store_payment_methods"("storeId", "enabled", "displayOrder");

-- AddForeignKey
ALTER TABLE "store_payment_methods" ADD CONSTRAINT "store_payment_methods_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
