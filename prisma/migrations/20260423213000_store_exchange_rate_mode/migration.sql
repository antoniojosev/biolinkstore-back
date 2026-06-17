-- CreateEnum
CREATE TYPE "ExchangeRateMode" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "stores"
  ADD COLUMN "exchangeRateMode" "ExchangeRateMode" NOT NULL DEFAULT 'AUTO',
  ADD COLUMN "exchangeRateCode" TEXT NOT NULL DEFAULT 'USD_BCV',
  ADD COLUMN "customRate" DECIMAL(18,8);
