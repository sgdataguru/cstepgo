-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "availability" TEXT NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "coverPhotoUrl" TEXT,
ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languages" JSONB,
ADD COLUMN     "luggageCapacity" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "onTimePercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "passengerCapacity" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "responseTime" TEXT NOT NULL DEFAULT '< 1 hour',
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "verificationBadges" JSONB,
ADD COLUMN     "verificationLevel" TEXT NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "yearsExperience" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "passengerCapacity" INTEGER NOT NULL,
    "luggageCapacity" INTEGER NOT NULL,
    "amenities" JSONB NOT NULL,
    "photos" JSONB NOT NULL,
    "insuranceExpiryDate" TIMESTAMP(3),
    "registrationExpiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerPhotoUrl" TEXT,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "Vehicle"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_isActive_idx" ON "Vehicle"("isActive");

-- CreateIndex
CREATE INDEX "Review_driverId_idx" ON "Review"("driverId");

-- CreateIndex
CREATE INDEX "Review_tripId_idx" ON "Review"("tripId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "Driver_availability_idx" ON "Driver"("availability");

-- CreateIndex
CREATE INDEX "Driver_rating_idx" ON "Driver"("rating");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
