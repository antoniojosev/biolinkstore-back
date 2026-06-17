-- AlterTable: enforce VARCHAR(80) on the tagline column already added by 20260420194120_add_tagline_to_product
ALTER TABLE "products" ALTER COLUMN "tagline" TYPE VARCHAR(80);
