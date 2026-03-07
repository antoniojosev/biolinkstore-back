/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `stores` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stores_username_key" ON "stores"("username");
