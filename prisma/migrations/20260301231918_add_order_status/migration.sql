-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "order_intents" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';
