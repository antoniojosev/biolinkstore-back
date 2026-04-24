-- BE-121: configurable CTA per store

-- CreateEnum
CREATE TYPE "StoreCtaType" AS ENUM ('WHATSAPP', 'EXTERNAL_LINK', 'CALL', 'NONE');

-- AlterTable
ALTER TABLE "stores"
  ADD COLUMN "ctaType" "StoreCtaType" NOT NULL DEFAULT 'WHATSAPP',
  ADD COLUMN "ctaLabel" VARCHAR(60),
  ADD COLUMN "ctaUrl" TEXT;
