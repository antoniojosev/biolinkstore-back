-- CreateTable: page-view analytics for public store (BE-114)
CREATE TABLE "store_views" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "device" TEXT,
    "scrollDepth" INTEGER,
    "timeOnPage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_views_storeId_createdAt_idx" ON "store_views"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "store_views" ADD CONSTRAINT "store_views_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
