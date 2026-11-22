-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "onlineAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payOnSite" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "HostProfile" ALTER COLUMN "licenseNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Listing" ALTER COLUMN "licenseNumber" DROP NOT NULL;

-- Nouveau modèle : le voyageur paie en ligne la part Diyafa, le reste à l'hôte sur place.
-- Réservations existantes : tout avait été payé en ligne.
UPDATE "Booking" SET "onlineAmount" = "total", "payOnSite" = 0 WHERE "onlineAmount" = 0;
-- Commissions demandées par le propriétaire : 20 % hôte, 10 % voyageur.
UPDATE "CommissionSetting" SET "hostPercent" = 20, "guestFeePercent" = 10;
