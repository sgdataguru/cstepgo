-- AlterTable: Add payout tracking fields to Booking
ALTER TABLE "Booking" ADD COLUMN "payout_id" TEXT;
ALTER TABLE "Booking" ADD COLUMN "payout_settled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN "settled_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_payout_settled_idx" ON "Booking"("payout_settled");
CREATE INDEX "Booking_payout_id_idx" ON "Booking"("payout_id");

-- AlterTable: Enhance Payout model
ALTER TABLE "Payout" ADD COLUMN "payout_method" TEXT NOT NULL DEFAULT 'MOCK';
ALTER TABLE "Payout" ADD COLUMN "payout_provider" TEXT NOT NULL DEFAULT 'MOCK';
ALTER TABLE "Payout" ADD COLUMN "provider_metadata" JSONB;
ALTER TABLE "Payout" ADD COLUMN "bookings_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payout" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "Payout" ADD COLUMN "failed_at" TIMESTAMP(3);
ALTER TABLE "Payout" ADD COLUMN "error_message" TEXT;

-- Rename columns in Payout for consistency
ALTER TABLE "Payout" RENAME COLUMN "periodStart" TO "period_start";
ALTER TABLE "Payout" RENAME COLUMN "periodEnd" TO "period_end";
ALTER TABLE "Payout" RENAME COLUMN "tripsCount" TO "trips_count";
ALTER TABLE "Payout" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "Payout" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "Payout" RENAME COLUMN "processedAt" TO "processed_at";
ALTER TABLE "Payout" RENAME COLUMN "stripeTransferId" TO "stripe_transfer_id";

-- CreateIndex
CREATE INDEX "Payout_tenant_id_idx" ON "Payout"("tenant_id");
CREATE INDEX "Payout_period_start_period_end_idx" ON "Payout"("period_start", "period_end");
