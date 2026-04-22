-- Multi-currency rates: reemplaza el modelo BE-117 (ExchangeRate single + Store.exchangeRateMode/Code/customRate)
-- por catalogo Rate + RateSnapshot + StoreCustomRate (multi-custom por tienda con MANUAL|FORMULA|API).

-- Drop columnas BE-117 en Store/OrderIntent.
ALTER TABLE "stores" DROP COLUMN IF EXISTS "exchangeRateMode";
ALTER TABLE "stores" DROP COLUMN IF EXISTS "exchangeRateCode";
ALTER TABLE "stores" DROP COLUMN IF EXISTS "customRate";

ALTER TABLE "order_intents" DROP COLUMN IF EXISTS "exchangeRateSnapshot";
ALTER TABLE "order_intents" DROP COLUMN IF EXISTS "exchangeRateSourceSnapshot";

-- Drop tablas BE-117 (ExchangeRate cache + ExchangeRateHistory per-store).
DROP TABLE IF EXISTS "exchange_rate_history";
DROP TABLE IF EXISTS "exchange_rates";

-- Drop enum BE-117.
DROP TYPE IF EXISTS "ExchangeRateMode";

-- Drop legacy Product.prices (JSON sin uso).
ALTER TABLE "products" DROP COLUMN IF EXISTS "prices";

-- Snapshot nuevo en OrderIntent (tasa publica resuelta al crear la orden, lo que vio el cliente).
ALTER TABLE "order_intents" ADD COLUMN "rateCodeSnapshot" TEXT;
ALTER TABLE "order_intents" ADD COLUMN "valueVesSnapshot" DECIMAL(14,4);

-- CreateEnum
CREATE TYPE "CustomRateMode" AS ENUM ('MANUAL', 'FORMULA', 'API');

-- CreateTable
CREATE TABLE "rates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourcePath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_snapshots" (
    "id" TEXT NOT NULL,
    "rateCode" TEXT NOT NULL,
    "valueVes" DECIMAL(14,4) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_custom_rates" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "mode" "CustomRateMode" NOT NULL,
    "valueVes" DECIMAL(14,4),
    "formula" TEXT,
    "sourceUrl" TEXT,
    "sourcePath" TEXT,
    "lastValue" DECIMAL(14,4),
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_custom_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rates_code_key" ON "rates"("code");

-- CreateIndex
CREATE INDEX "rates_isActive_idx" ON "rates"("isActive");

-- CreateIndex
CREATE INDEX "rate_snapshots_rateCode_fetchedAt_idx" ON "rate_snapshots"("rateCode", "fetchedAt" DESC);

-- CreateIndex
CREATE INDEX "store_custom_rates_storeId_idx" ON "store_custom_rates"("storeId");

-- AddForeignKey
ALTER TABLE "rate_snapshots" ADD CONSTRAINT "rate_snapshots_rateCode_fkey" FOREIGN KEY ("rateCode") REFERENCES "rates"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_custom_rates" ADD CONSTRAINT "store_custom_rates_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
