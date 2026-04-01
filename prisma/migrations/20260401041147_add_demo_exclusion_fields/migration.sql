-- CreateEnum
CREATE TYPE "ExcludeReason" AS ENUM ('OWNER', 'DEMO', 'BOT');

-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "isSeeded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "landing_visitors" ADD COLUMN     "excludedReason" "ExcludeReason",
ADD COLUMN     "isExcluded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "isExcluded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "landing_visitors_isExcluded_idx" ON "landing_visitors"("isExcluded");

-- CreateIndex
CREATE INDEX "users_isDemo_idx" ON "users"("isDemo");

-- CreateIndex
CREATE INDEX "visitors_storeId_isExcluded_idx" ON "visitors"("storeId", "isExcluded");
