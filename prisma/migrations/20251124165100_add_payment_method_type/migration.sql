-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('ONLINE', 'CASH_TO_DRIVER');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "payment_method_type" "PaymentMethodType" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "stripeIntentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_payment_method_type_idx" ON "Booking"("payment_method_type");
