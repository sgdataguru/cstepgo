/**
 * Receipt Service
 * Handles receipt generation for completed bookings
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReceiptData {
  bookingId: string;
  receiptNumber: string;
  issueDate: string;
  
  // Passenger Info
  passengerName: string;
  passengerEmail?: string;
  passengerPhone?: string;
  
  // Trip Info
  tripTitle: string;
  tripType: string;
  originName: string;
  originAddress: string;
  destinationName: string;
  destinationAddress: string;
  departureTime: string;
  returnTime?: string;
  
  // Booking Info
  bookingDate: string;
  seatsBooked: number;
  passengers: any[];
  
  // Payment Info
  paymentMethod: string;
  paymentStatus: string;
  last4?: string;
  transactionId?: string;
  paymentDate?: string;
  
  // Pricing Breakdown
  baseAmount: number;
  pricePerSeat?: number;
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  
  // Driver Info (if applicable)
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  
  // Status
  status: string;
  completedAt?: string;
  
  // Refund Info (if applicable)
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
}

/**
 * Get receipt data for a booking
 */
export async function getReceiptData(
  bookingId: string,
  userId: string
): Promise<ReceiptData | null> {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId: userId,
    },
    include: {
      trip: {
        include: {
          driver: {
            include: {
              user: true,
            },
          },
        },
      },
      user: true,
      payment: true,
    },
  });

  if (!booking) {
    return null;
  }

  // Only generate receipts for completed or confirmed bookings with successful payment
  const isEligible = 
    (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') &&
    booking.payment?.status === 'SUCCEEDED';

  if (!isEligible) {
    return null;
  }

  // Calculate pricing breakdown
  const totalAmount = Number(booking.totalAmount);
  // Assuming 15% platform fee as per pricing model
  const platformFeeRate = 0.15;
  const subtotal = totalAmount / (1 + platformFeeRate);
  const platformFee = subtotal * platformFeeRate;
  // For simplicity, no separate tax in current model (included in total)
  const taxAmount = 0;
  
  const pricePerSeat = booking.trip.pricePerSeat 
    ? Number(booking.trip.pricePerSeat)
    : subtotal / booking.seatsBooked;

  // Generate receipt number (format: RCP-YYYYMMDD-XXXXX)
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const shortId = bookingId.substring(0, 8).toUpperCase();
  const receiptNumber = `RCP-${dateStr}-${shortId}`;

  // Mask payment method (last 4 digits only)
  const maskedPaymentMethod = booking.payment?.last4 
    ? `****${booking.payment.last4}`
    : booking.paymentMethodType === 'CASH_TO_DRIVER' 
    ? 'Cash'
    : 'Online Payment';

  const receiptData: ReceiptData = {
    bookingId: booking.id,
    receiptNumber,
    issueDate: new Date().toISOString(),
    
    // Passenger Info
    passengerName: booking.user.name,
    passengerEmail: booking.user.email,
    passengerPhone: booking.user.phone || undefined,
    
    // Trip Info
    tripTitle: booking.trip.title,
    tripType: booking.trip.tripType,
    originName: booking.trip.originName,
    originAddress: booking.trip.originAddress,
    destinationName: booking.trip.destName,
    destinationAddress: booking.trip.destAddress,
    departureTime: booking.trip.departureTime.toISOString(),
    returnTime: booking.trip.returnTime?.toISOString(),
    
    // Booking Info
    bookingDate: booking.createdAt.toISOString(),
    seatsBooked: booking.seatsBooked,
    passengers: booking.passengers as any[],
    
    // Payment Info
    paymentMethod: maskedPaymentMethod,
    paymentStatus: booking.payment?.status || 'PENDING',
    last4: booking.payment?.last4 || undefined,
    transactionId: booking.payment?.stripeIntentId || booking.payment?.id,
    paymentDate: booking.payment?.succeededAt?.toISOString(),
    
    // Pricing Breakdown
    baseAmount: subtotal,
    pricePerSeat: booking.trip.tripType === 'SHARED' ? pricePerSeat : undefined,
    subtotal,
    platformFee,
    taxAmount,
    totalAmount,
    currency: booking.currency,
    
    // Driver Info
    driverName: booking.trip.driver?.user.name,
    driverPhone: booking.trip.driver?.user.phone || undefined,
    vehicleInfo: booking.trip.driver 
      ? `${booking.trip.driver.vehicleMake} ${booking.trip.driver.vehicleModel} (${booking.trip.driver.licensePlate})`
      : undefined,
    
    // Status
    status: booking.status,
    completedAt: booking.status === 'COMPLETED' ? booking.updatedAt.toISOString() : undefined,
    
    // Refund Info - placeholder for future implementation
    refundAmount: undefined,
    refundDate: undefined,
    refundReason: undefined,
  };

  return receiptData;
}

/**
 * Check if a booking is eligible for receipt generation
 */
export async function isEligibleForReceipt(
  bookingId: string,
  userId: string
): Promise<boolean> {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId: userId,
    },
    include: {
      payment: true,
    },
  });

  if (!booking) {
    return false;
  }

  // Eligible if completed or confirmed with successful payment
  return (
    (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') &&
    booking.payment?.status === 'SUCCEEDED'
  );
}

/**
 * Get receipt history for a user
 */
export async function getUserReceipts(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      status: {
        in: ['COMPLETED', 'CONFIRMED'],
      },
      payment: {
        status: 'SUCCEEDED',
      },
    },
    include: {
      trip: true,
      payment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return bookings.map(booking => ({
    bookingId: booking.id,
    tripTitle: booking.trip.title,
    departureTime: booking.trip.departureTime,
    totalAmount: Number(booking.totalAmount),
    currency: booking.currency,
    status: booking.status,
    paymentStatus: booking.payment?.status,
  }));
}
