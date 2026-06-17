-- AlterTable
ALTER TABLE "order_intents" ADD COLUMN "paymentMethodId" TEXT;

-- CreateIndex
CREATE INDEX "order_intents_paymentMethodId_idx" ON "order_intents"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "order_intents"
  ADD CONSTRAINT "order_intents_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "store_payment_methods"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
