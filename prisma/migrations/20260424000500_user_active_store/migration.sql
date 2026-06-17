-- BE-118 — User.activeStoreId for multi-catalog (BUSINESS plan)
ALTER TABLE "users"
  ADD COLUMN "activeStoreId" TEXT;

CREATE INDEX "users_activeStoreId_idx" ON "users"("activeStoreId");

ALTER TABLE "users"
  ADD CONSTRAINT "users_activeStoreId_fkey"
    FOREIGN KEY ("activeStoreId") REFERENCES "stores"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
