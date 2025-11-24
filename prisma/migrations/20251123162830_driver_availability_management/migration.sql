-- AlterTable: Add new availability management fields to Driver table
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "accepts_private_trips" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "accepts_shared_trips" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "accepts_long_distance" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "last_activity_at" TIMESTAMP(3);
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "auto_offline_minutes" INTEGER NOT NULL DEFAULT 30;

-- CreateTable: Driver availability schedules for break times and planned unavailability
CREATE TABLE IF NOT EXISTS "driver_availability_schedules" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "schedule_type" TEXT NOT NULL DEFAULT 'break',
    "reason" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_pattern" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_availability_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Track history of driver availability changes
CREATE TABLE IF NOT EXISTS "driver_availability_history" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "previous_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "change_reason" TEXT,
    "triggered_by" TEXT NOT NULL DEFAULT 'driver',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_availability_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Driver_last_activity_at_idx" ON "Driver"("last_activity_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "driver_availability_schedules_driver_id_start_time_end_time_idx" ON "driver_availability_schedules"("driver_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "driver_availability_schedules_is_active_start_time_idx" ON "driver_availability_schedules"("is_active", "start_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "driver_availability_history_driver_id_changed_at_idx" ON "driver_availability_history"("driver_id", "changed_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "driver_availability_history_triggered_by_changed_at_idx" ON "driver_availability_history"("triggered_by", "changed_at");

-- AddForeignKey
ALTER TABLE "driver_availability_schedules" ADD CONSTRAINT "driver_availability_schedules_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_availability_history" ADD CONSTRAINT "driver_availability_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
