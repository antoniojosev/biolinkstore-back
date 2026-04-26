-- Team members: multi-miembro por tienda con roles fijos OWNER|ADMIN|STAFF.
-- Plan-gate (en codigo): FREE=1 (solo owner) / PRO=3 total / BUSINESS=ilimitado.
-- Reglas (en codigo): minimo 1 OWNER en todo momento.

-- CreateEnum
CREATE TYPE "StoreMemberRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateTable
CREATE TABLE "store_members" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StoreMemberRole" NOT NULL,
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_invitations" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StoreMemberRole" NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_members_storeId_userId_key" ON "store_members"("storeId", "userId");
CREATE INDEX "store_members_storeId_role_idx" ON "store_members"("storeId", "role");
CREATE INDEX "store_members_userId_idx" ON "store_members"("userId");

CREATE UNIQUE INDEX "store_invitations_token_key" ON "store_invitations"("token");
CREATE INDEX "store_invitations_storeId_idx" ON "store_invitations"("storeId");
CREATE INDEX "store_invitations_email_idx" ON "store_invitations"("email");

-- AddForeignKey
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_invitations" ADD CONSTRAINT "store_invitations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_invitations" ADD CONSTRAINT "store_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: insertar StoreMember role=OWNER para cada Store.ownerId existente.
-- Con esto, los stores legacy quedan con su creador como OWNER en la nueva tabla.
INSERT INTO "store_members" ("id", "storeId", "userId", "role", "joinedAt", "createdAt", "updatedAt")
SELECT
    'cm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24) AS id,
    s.id AS "storeId",
    s."ownerId" AS "userId",
    'OWNER'::"StoreMemberRole" AS role,
    s."createdAt" AS "joinedAt",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM "stores" s
ON CONFLICT ("storeId", "userId") DO NOTHING;
