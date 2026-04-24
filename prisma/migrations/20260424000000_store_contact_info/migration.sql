-- AlterTable: add structured contact fields to stores (BE-112)
ALTER TABLE "stores"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "socialLinks" JSONB;
