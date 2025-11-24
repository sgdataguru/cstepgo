-- Add admin approval and document verification fields

-- Add approval workflow fields to Driver
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "approval_status" TEXT DEFAULT 'PENDING_REVIEW';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "approved_by" TEXT;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "approved_at_admin" TIMESTAMP;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "rejection_reason_admin" TEXT;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

-- Create index for approval status
CREATE INDEX IF NOT EXISTS "Driver_approval_status_idx" ON "Driver"("approval_status");

-- Create OTP table for SMS/WhatsApp verification
CREATE TABLE IF NOT EXISTS "OTP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "attempts" INTEGER DEFAULT 0,
    "verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "OTP_phone_idx" ON "OTP"("phone");
CREATE INDEX IF NOT EXISTS "OTP_expires_at_idx" ON "OTP"("expires_at");

-- Create DocumentVerification table
CREATE TABLE IF NOT EXISTS "DocumentVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT,
    "document_url" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP,
    "verified_by" TEXT,
    "rejection_reason" TEXT,
    "expiry_date" TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "DocumentVerification_user_id_idx" ON "DocumentVerification"("user_id");
CREATE INDEX IF NOT EXISTS "DocumentVerification_driver_id_idx" ON "DocumentVerification"("driver_id");
CREATE INDEX IF NOT EXISTS "DocumentVerification_status_idx" ON "DocumentVerification"("status");
CREATE INDEX IF NOT EXISTS "DocumentVerification_document_type_idx" ON "DocumentVerification"("document_type");

-- Create FileUpload table for tracking all uploads
CREATE TABLE IF NOT EXISTS "FileUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "s3_bucket" TEXT,
    "s3_key" TEXT,
    "url" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "FileUpload_user_id_idx" ON "FileUpload"("user_id");
CREATE INDEX IF NOT EXISTS "FileUpload_purpose_idx" ON "FileUpload"("purpose");
CREATE INDEX IF NOT EXISTS "FileUpload_created_at_idx" ON "FileUpload"("created_at");

-- Create AdminAction table for audit logging
CREATE TABLE IF NOT EXISTS "AdminAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admin_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AdminAction_admin_id_idx" ON "AdminAction"("admin_id");
CREATE INDEX IF NOT EXISTS "AdminAction_action_type_idx" ON "AdminAction"("action_type");
CREATE INDEX IF NOT EXISTS "AdminAction_target_type_target_id_idx" ON "AdminAction"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "AdminAction_created_at_idx" ON "AdminAction"("created_at");

-- Create RefreshToken table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL UNIQUE,
    "session_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "revoked" BOOLEAN DEFAULT false,
    "revoked_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");
CREATE INDEX IF NOT EXISTS "RefreshToken_token_hash_idx" ON "RefreshToken"("token_hash");
CREATE INDEX IF NOT EXISTS "RefreshToken_session_id_idx" ON "RefreshToken"("session_id");
CREATE INDEX IF NOT EXISTS "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");
