-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "bedGender" "Gender";

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "city" "City",
    "type" "ListingType",
    "gender" "Gender",
    "checkIn" DATE,
    "checkOut" DATE,
    "months" INTEGER,
    "guests" INTEGER,
    "maxPrice" INTEGER,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");


-- Appartements de lits existants : un seul public (hommes OU femmes), d'après la première chambre.
UPDATE "Listing" l SET "bedGender" = (
  SELECT r."gender" FROM "Room" r WHERE r."listingId" = l."id" ORDER BY r."name" LIMIT 1
) WHERE l."type" = 'SHARED_BED' AND l."bedGender" IS NULL;
UPDATE "Room" r SET "gender" = l."bedGender" FROM "Listing" l WHERE r."listingId" = l."id" AND l."bedGender" IS NOT NULL AND r."gender" <> l."bedGender";
-- Sécurité Supabase
ALTER TABLE "SearchLog" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON "SearchLog" FROM anon, authenticated';
  END IF;
END $$;
