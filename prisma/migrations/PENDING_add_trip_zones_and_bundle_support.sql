-- CreateEnum for TripZone
CREATE TYPE "TripZone" AS ENUM ('ZONE_A', 'ZONE_B', 'ZONE_C');

-- AlterTable Trip - Add zone classification fields
ALTER TABLE "Trip" ADD COLUMN "zone" "TripZone",
ADD COLUMN "estimated_days" INTEGER,
ADD COLUMN "distance" DOUBLE PRECISION;

-- CreateTable TripBundle
CREATE TABLE "TripBundle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripIds" TEXT[],
    "totalDays" INTEGER NOT NULL,
    "adjustedDays" INTEGER,
    "rideType" TEXT NOT NULL,
    "estimatedFare" DECIMAL(65,30) NOT NULL,
    "farePerSeat" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_zone_idx" ON "Trip"("zone");

-- CreateIndex
CREATE INDEX "Trip_zone_status_idx" ON "Trip"("zone", "status");

-- CreateIndex
CREATE INDEX "TripBundle_userId_idx" ON "TripBundle"("userId");

-- CreateIndex
CREATE INDEX "TripBundle_status_idx" ON "TripBundle"("status");
