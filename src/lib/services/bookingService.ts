/**
 * Booking Service
 * Handles all booking-related business logic for passengers
 */

import { Booking, BookingStatus, TripStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { emitBookingCancelled } from '@/lib/realtime/unifiedEventEmitter';


export interface BookingWithDetails extends Booking {
  trip: {
    id: string;
    title: string;
    description: string;
    originName: string;
    originAddress: string;
    destName: string;
    destAddress: string;
    departureTime: Date;
    returnTime: Date;
    status: TripStatus;
    basePrice: Prisma.Decimal;
    currency: string;
    totalSeats: number;
    availableSeats: number;
    organizerId: string;
    driverId: string | null;
    tripType: string;
    pricePerSeat: Prisma.Decimal | null;
    driver?: {
      id: string;
      userId: string;
      vehicleType: string;
      vehicleModel: string;
      vehicleMake: string;
      vehicleColor: string | null;
      licensePlate: string;
      rating: number;
      reviewCount: number;
      user: {
        id: string;
        name: string;
        phone: string | null;
        avatar: string | null;
      };
    } | null;
  };
  payment?: {
    id: string;
    status: string;
    amount: Prisma.Decimal;
    currency: string;
    paymentMethod: string | null;
    createdAt: Date;
    succeededAt: Date | null;
  } | null;
}

export interface BookingSummary {
  id: string;
  tripId: string;
  status: BookingStatus;
  seatsBooked: number;
  totalAmount: Prisma.Decimal;
  currency: string;
  createdAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  paymentMethodType: string;
  trip: {
    title: string;
    originName: string;
    destName: string;
    departureTime: Date;
    status: TripStatus;
    driverId: string | null;
    tripType: string;
    pricePerSeat: Prisma.Decimal | null;
  };
  paymentStatus?: string;
}

/**
 * Get all bookings for a user with optional filtering and pagination
 */
export async function getUserBookings(
  userId: string,
  filters?: {
    status?: BookingStatus | BookingStatus[];
    upcoming?: boolean;
    past?: boolean;
    tripType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<BookingSummary[]> {
  const where: Prisma.BookingWhereInput = {
    userId,
  };

  // Filter by status
  if (filters?.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  // Filter by time (upcoming vs past)
  const tripConditions: any = {};
  
  if (filters?.upcoming) {
    tripConditions.departureTime = { gte: new Date() };
  } else if (filters?.past) {
    tripConditions.departureTime = { lt: new Date() };
  }

  // Filter by date range
  if (filters?.startDate || filters?.endDate) {
    tripConditions.departureTime = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  // Filter by trip type
  if (filters?.tripType) {
    tripConditions.tripType = filters.tripType;
  }

  if (Object.keys(tripConditions).length > 0) {
    where.trip = tripConditions;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      trip: {
        select: {
          title: true,
          originName: true,
          destName: true,
          departureTime: true,
          status: true,
          driverId: true,
          tripType: true,
          pricePerSeat: true,
        },
      },
      payment: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters?.limit,
    skip: filters?.offset,
  });

  return bookings.map((booking) => ({
    id: booking.id,
    tripId: booking.tripId,
    status: booking.status,
    seatsBooked: booking.seatsBooked,
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    createdAt: booking.createdAt,
    confirmedAt: booking.confirmedAt,
    cancelledAt: booking.cancelledAt,
    paymentMethodType: booking.paymentMethodType,
    trip: {
      ...booking.trip,
      tripType: booking.trip.tripType,
      pricePerSeat: booking.trip.pricePerSeat,
    },
    paymentStatus: booking.payment?.status,
  }));
}

/**
 * Get detailed booking information
 */
export async function getBookingDetails(
  bookingId: string,
  userId: string
): Promise<BookingWithDetails | null> {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId, // Ensure user can only access their own bookings
    },
    include: {
      trip: {
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          paymentMethod: true,
          createdAt: true,
          succeededAt: true,
        },
      },
    },
  });

  return booking as BookingWithDetails | null;
}

/**
 * Check if a booking can be cancelled
 */
export function canCancelBooking(booking: BookingWithDetails): {
  canCancel: boolean;
  reason?: string;
} {
  // Cannot cancel if already cancelled
  if (booking.status === 'CANCELLED') {
    return {
      canCancel: false,
      reason: 'Booking is already cancelled',
    };
  }

  // Cannot cancel if already completed
  if (booking.status === 'COMPLETED') {
    return {
      canCancel: false,
      reason: 'Cannot cancel a completed booking',
    };
  }

  // Cannot cancel if trip has already started or is in the past
  const now = new Date();
  const departureTime = new Date(booking.trip.departureTime);
  
  if (departureTime <= now) {
    return {
      canCancel: false,
      reason: 'Cannot cancel a trip that has already started or passed',
    };
  }

  // Check if trip is too close (less than 2 hours before departure)
  const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilDeparture < 2) {
    return {
      canCancel: false,
      reason: 'Cannot cancel within 2 hours of departure time',
    };
  }

  return { canCancel: true };
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  userId: string,
  reason?: string
): Promise<{
  success: boolean;
  booking?: BookingWithDetails;
  error?: string;
}> {
  try {
    // Get the booking with full details
    const booking = await getBookingDetails(bookingId, userId);

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    // Check if booking can be cancelled
    const { canCancel, reason: cancelReason } = canCancelBooking(booking);
    if (!canCancel) {
      return {
        success: false,
        error: cancelReason,
      };
    }

    // Perform cancellation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          notes: reason
            ? `${booking.notes || ''}\nCancellation reason: ${reason}`.trim()
            : booking.notes,
        },
        include: {
          trip: {
            include: {
              driver: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              paymentMethod: true,
              createdAt: true,
              succeededAt: true,
            },
          },
        },
      });

      // Release seats back to the trip
      await tx.trip.update({
        where: { id: booking.tripId },
        data: {
          availableSeats: {
            increment: booking.seatsBooked,
          },
        },
      });

      return updatedBooking;
    });

    // Broadcast cancellation to realtime channels (both SSE and Socket.IO)
    try {
      await emitBookingCancelled({
        tripId: result.trip.id,
        tripType: result.trip.tripType as 'PRIVATE' | 'SHARED',
        bookingId: result.id,
        passengerId: userId,
        passengerName: 'Passenger', // Could be enhanced to pass actual name
        seatsFreed: result.seatsBooked,
        availableSeats: result.trip.availableSeats + result.seatsBooked, // Include incremented value
        totalSeats: result.trip.totalSeats,
        reason: reason || 'Cancelled by passenger',
        tenantId: result.trip.tenantId || undefined,
      });
    } catch (error) {
      console.error('Error broadcasting cancellation:', error);
      // Don't fail the cancellation if broadcast fails
    }

    return {
      success: true,
      booking: result as BookingWithDetails,
    };
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel booking',
    };
  }
}

/**
 * Get upcoming bookings count for a user
 */
export async function getUpcomingBookingsCount(userId: string): Promise<number> {
  return prisma.booking.count({
    where: {
      userId,
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
      trip: {
        departureTime: { gte: new Date() },
      },
    },
  });
}

/**
 * Get booking statistics for a user
 */
export async function getUserBookingStats(userId: string): Promise<{
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}> {
  const [total, upcoming, completed, cancelled] = await Promise.all([
    prisma.booking.count({ where: { userId } }),
    prisma.booking.count({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        trip: { departureTime: { gte: new Date() } },
      },
    }),
    prisma.booking.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.booking.count({
      where: { userId, status: 'CANCELLED' },
    }),
  ]);

  return { total, upcoming, completed, cancelled };
}
