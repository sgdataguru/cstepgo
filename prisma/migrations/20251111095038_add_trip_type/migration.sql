-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('PRIVATE', 'SHARED');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "tripType" "TripType" NOT NULL DEFAULT 'SHARED';

-- CreateIndex
CREATE INDEX "Trip_tripType_idx" ON "Trip"("tripType");
