-- BE-125: granular storefront events table.

-- CreateEnum
CREATE TYPE "StoreEventType" AS ENUM ('PRODUCT_VIEW', 'ADD_TO_CART', 'WHATSAPP_CLICK', 'SOCIAL_CLICK', 'CATEGORY_CLICK', 'SECTION_VIEW');

-- CreateTable
CREATE TABLE "store_events" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "StoreEventType" NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "sessionId" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_events_storeId_timestamp_idx" ON "store_events"("storeId", "timestamp");

-- CreateIndex
CREATE INDEX "store_events_storeId_type_timestamp_idx" ON "store_events"("storeId", "type", "timestamp");

-- CreateIndex
CREATE INDEX "store_events_storeId_type_targetId_idx" ON "store_events"("storeId", "type", "targetId");

-- AddForeignKey
ALTER TABLE "store_events" ADD CONSTRAINT "store_events_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
