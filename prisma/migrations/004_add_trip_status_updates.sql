-- Migration: Add Trip Status Updates and Enhanced Status Types
-- Description: Extends trip status enum and adds tracking table for status changes

-- Add new status types to TripStatus enum
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'DEPARTED';
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'EN_ROUTE';
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'DELAYED';
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'ARRIVED';

-- Create trip_status_updates table
CREATE TABLE IF NOT EXISTS "trip_status_updates" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "previous_status" "TripStatus" NOT NULL,
    "new_status" "TripStatus" NOT NULL,
    "notes" TEXT,
    "location" JSONB,
    "notifications_sent" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_status_updates_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "trip_status_updates_trip_id_created_at_idx" ON "trip_status_updates"("trip_id", "created_at");
CREATE INDEX IF NOT EXISTS "trip_status_updates_driver_id_created_at_idx" ON "trip_status_updates"("driver_id", "created_at");
CREATE INDEX IF NOT EXISTS "trip_status_updates_new_status_created_at_idx" ON "trip_status_updates"("new_status", "created_at");

-- Add foreign key constraints
ALTER TABLE "trip_status_updates" ADD CONSTRAINT "trip_status_updates_trip_id_fkey" 
    FOREIGN KEY ("trip_id") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_status_updates" ADD CONSTRAINT "trip_status_updates_driver_id_fkey" 
    FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comment to document the table
COMMENT ON TABLE "trip_status_updates" IS 'Tracks all status changes for trips with timestamps and context';
COMMENT ON COLUMN "trip_status_updates"."location" IS 'JSON object containing latitude, longitude, accuracy, speed, and heading';
COMMENT ON COLUMN "trip_status_updates"."notifications_sent" IS 'Count of notifications sent to passengers for this status change';
