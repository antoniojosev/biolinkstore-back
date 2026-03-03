-- AlterTable
ALTER TABLE "product_attributes" ADD COLUMN     "optionsMeta" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text';
