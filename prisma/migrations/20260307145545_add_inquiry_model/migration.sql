-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('DESIGN', 'CUSTOM_PLAN');

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "InquiryType" NOT NULL,
    "method" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiries_storeId_idx" ON "inquiries"("storeId");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
