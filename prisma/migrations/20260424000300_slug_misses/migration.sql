-- CreateTable: capture 404 slug misses for CTA and growth insights (BE-115)
CREATE TABLE "slug_misses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ip" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slug_misses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slug_misses_slug_idx" ON "slug_misses"("slug");

-- CreateIndex
CREATE INDEX "slug_misses_createdAt_idx" ON "slug_misses"("createdAt");
