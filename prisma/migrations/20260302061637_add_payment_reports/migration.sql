-- CreateEnum
CREATE TYPE "PaymentReportType" AS ENUM ('PLAN_UPGRADE', 'DOMAIN', 'DESIGN');

-- CreateEnum
CREATE TYPE "PaymentReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "payment_reports" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "PaymentReportType" NOT NULL,
    "targetPlan" TEXT,
    "status" "PaymentReportStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_reports_storeId_idx" ON "payment_reports"("storeId");

-- AddForeignKey
ALTER TABLE "payment_reports" ADD CONSTRAINT "payment_reports_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
