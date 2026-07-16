-- AlterEnum
ALTER TYPE "TemplateNiche" ADD VALUE 'PORTFOLIO';

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "stylePresets" JSONB;
