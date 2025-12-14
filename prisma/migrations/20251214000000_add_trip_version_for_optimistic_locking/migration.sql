-- AlterTable: Add version field to Trip table for optimistic locking
-- This field helps prevent race conditions during concurrent seat bookings

ALTER TABLE "Trip" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

-- Add index on version for query optimization
CREATE INDEX "Trip_version_idx" ON "Trip"("version");

-- Update existing trips to have version 0
UPDATE "Trip" SET "version" = 0 WHERE "version" IS NULL;
