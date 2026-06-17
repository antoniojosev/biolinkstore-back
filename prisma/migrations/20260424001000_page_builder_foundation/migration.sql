-- BE-120a — Page Builder foundation: templates, palette presets, store themes

-- CreateEnum
CREATE TYPE "TemplateNiche" AS ENUM ('FASHION', 'RESTAURANT', 'REAL_ESTATE', 'SERVICES', 'GENERAL');

-- CreateTable: templates catalog
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" "TemplateNiche" NOT NULL,
    "planRequired" "Plan" NOT NULL DEFAULT 'FREE',
    "previewImage" TEXT,
    "demoDataJson" JSONB NOT NULL,
    "sectionSchema" JSONB NOT NULL,
    "defaultTokens" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "templates_key_key" ON "templates"("key");
CREATE INDEX "templates_niche_isActive_idx" ON "templates"("niche", "isActive");

-- CreateTable: palette presets catalog
CREATE TABLE "palette_presets" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorsJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "palette_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "palette_presets_key_key" ON "palette_presets"("key");

-- CreateTable: per-store theme state (drafts + published + rollback)
CREATE TABLE "store_themes" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "activeTemplate" TEXT NOT NULL,
    "publishedTemplate" TEXT,
    "rollbackTemplate" TEXT,
    "draftsByTemplate" JSONB NOT NULL DEFAULT '{}',
    "publishedTree" JSONB,
    "publishedTokens" JSONB,
    "rollbackTree" JSONB,
    "rollbackTokens" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_themes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_themes_storeId_key" ON "store_themes"("storeId");

ALTER TABLE "store_themes"
  ADD CONSTRAINT "store_themes_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
