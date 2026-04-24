-- BE-117 — Exchange rate history + order snapshot

-- AlterTable: snapshot rate on each order intent
ALTER TABLE "order_intents"
  ADD COLUMN "exchangeRateSnapshot" DECIMAL(18, 8),
  ADD COLUMN "exchangeRateSourceSnapshot" TEXT;

-- CreateTable: exchange rate history per store
CREATE TABLE "exchange_rate_history" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "rate" DECIMAL(18, 8) NOT NULL,
    "source" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rate_history_storeId_effectiveFrom_idx"
    ON "exchange_rate_history"("storeId", "effectiveFrom" DESC);
