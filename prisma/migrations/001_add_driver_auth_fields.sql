-- Migration: Add driver authentication fields
-- Date: 2025-11-22
-- Purpose: Extend existing schema for driver portal authentication

-- Add missing fields to User table for role-based auth
-- (Some fields already exist, adding only missing ones)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "driver_status" VARCHAR(20);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approved_by" TEXT REFERENCES "User"("id");

-- Add missing fields to Driver table for authentication
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "background_check_status" VARCHAR(20) DEFAULT 'pending';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "background_check_date" TIMESTAMP;

-- Create driver_documents table for document verification
CREATE TABLE IF NOT EXISTS "DriverDocuments" (
  "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "driver_profile_id" TEXT NOT NULL REFERENCES "Driver"("id") ON DELETE CASCADE,
  "document_type" VARCHAR(50) NOT NULL, -- 'license', 'insurance', 'registration'
  "file_url" VARCHAR(500) NOT NULL,
  "file_name" VARCHAR(200) NOT NULL,
  "verification_status" VARCHAR(20) DEFAULT 'pending',
  "verified_at" TIMESTAMP,
  "verified_by" TEXT REFERENCES "User"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "User"("role");
CREATE INDEX IF NOT EXISTS "idx_driver_documents_profile_id" ON "DriverDocuments"("driver_profile_id");
CREATE INDEX IF NOT EXISTS "idx_driver_documents_status" ON "DriverDocuments"("verification_status");

-- Update Driver table to include service preferences
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "service_radius" INTEGER DEFAULT 10;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "accepts_shared_trips" BOOLEAN DEFAULT true;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "accepts_long_distance" BOOLEAN DEFAULT true;
