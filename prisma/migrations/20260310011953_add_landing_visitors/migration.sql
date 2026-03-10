-- CreateTable
CREATE TABLE "landing_visitors" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "firstVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_visitors_fingerprint_key" ON "landing_visitors"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "landing_visitors_userId_key" ON "landing_visitors"("userId");

-- AddForeignKey
ALTER TABLE "landing_visitors" ADD CONSTRAINT "landing_visitors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
