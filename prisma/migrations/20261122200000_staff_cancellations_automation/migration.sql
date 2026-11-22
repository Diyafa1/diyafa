-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ADD COLUMN     "requestedAt" TIMESTAMP(3),
ADD COLUMN     "reviewAskedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[];

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);


-- Annulations passées : date approximative = dernière mise à jour
UPDATE "Booking" SET "cancelledAt" = "updatedAt" WHERE "status" = 'CANCELLED' AND "cancelledAt" IS NULL;
UPDATE "Booking" SET "requestedAt" = "updatedAt" WHERE "status" = 'REQUESTED' AND "requestedAt" IS NULL;
-- Réglage par défaut : suspension automatique après 3 annulations par l'hôte sur 12 mois
INSERT INTO "AppSetting" ("key", "value", "updatedAt") VALUES ('autoSuspendHostCancellations', '3', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "AppSetting" ("key", "value", "updatedAt") VALUES ('requestAutoDeclineHours', '24', NOW()) ON CONFLICT DO NOTHING;
-- Sécurité Supabase
ALTER TABLE "AppSetting" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON "AppSetting" FROM anon, authenticated';
  END IF;
END $$;
