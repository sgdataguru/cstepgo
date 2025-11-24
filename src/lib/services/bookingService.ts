/**
 * Booking Service
 * Handles private trip booking logic including validation, pricing, and driver notifications
 */

import { PrismaClient } from '@prisma/client';
import { realtimeBroadcastService } from './realtimeBroadcastService';

const prisma = new PrismaClient();

export interface CreateBookingParams {
  userId: string;
  tripType: 'private' | 'shared';
  origin: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  departureTime: Date;
  returnTime?: Date;
  passengers: {
    name: string;
    phone?: string;
    email?: string;
  }[];
  seatsBooked: number;
  notes?: string;
  vehicleType?: string;
}

export interface BookingResult {
  booking: any;
  trip: any;
  message: string;
}

/**
 * Calculate trip price based on distance and other factors
 */
function calculateTripPrice(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  seatsBooked: number
): { basePrice: number; platformFee: number } {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const dLat = (destLat - originLat) * Math.PI / 180;
  const dLng = (destLng - originLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  // Base pricing: 300 KZT per km + 1000 KZT base fare
  const baseFare = 1000;
  const perKmRate = 300;
  const basePrice = baseFare + (distance * perKmRate * seatsBooked);
  
  // Platform fee: 15% of base price
  const platformFee = basePrice * 0.15;

  return {
    basePrice: Math.round(basePrice),
    platformFee: Math.round(platformFee)
  };
}

/**
 * Create a private trip booking for a customer
 * This creates both a Trip and a Booking record, then broadcasts to nearby drivers
 */
export async function createPrivateTripBooking(
  params: CreateBookingParams
): Promise<BookingResult> {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate pricing
    const { basePrice, platformFee } = calculateTripPrice(
      params.origin.lat,
      params.origin.lng,
      params.destination.lat,
      params.destination.lng,
      params.seatsBooked
    );

    const totalAmount = basePrice + platformFee;

    // Generate trip title
    const tripTitle = params.tripType === 'private' 
      ? `Private Ride: ${params.origin.name} → ${params.destination.name}`
      : `Shared Ride: ${params.origin.name} → ${params.destination.name}`;

    // Create trip and booking in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the trip
      const trip = await tx.trip.create({
        data: {
          title: tripTitle,
          description: params.notes || `Customer requested ${params.tripType} trip`,
          organizerId: params.userId,
          departureTime: params.departureTime,
          returnTime: params.returnTime || params.departureTime,
          timezone: 'Asia/Almaty',
          originName: params.origin.name,
          originAddress: params.origin.address,
          originLat: params.origin.lat,
          originLng: params.origin.lng,
          destName: params.destination.name,
          destAddress: params.destination.address,
          destLat: params.destination.lat,
          destLng: params.destination.lng,
          totalSeats: params.seatsBooked,
          availableSeats: params.seatsBooked,
          basePrice,
          currency: 'KZT',
          platformFee,
          status: 'PUBLISHED', // Immediately publish for driver discovery
          itinerary: {
            version: '1.0',
            days: [
              {
                dayNumber: 1,
                date: params.departureTime,
                title: 'Trip Day',
                activities: [
                  {
                    id: 'pickup',
                    startTime: params.departureTime.toISOString(),
                    location: params.origin,
                    type: 'transport',
                    description: `Pickup from ${params.origin.name}`,
                    order: 1
                  },
                  {
                    id: 'dropoff',
                    startTime: (params.returnTime || params.departureTime).toISOString(),
                    location: params.destination,
                    type: 'transport',
                    description: `Drop-off at ${params.destination.name}`,
                    order: 2
                  }
                ]
              }
            ]
          },
          metadata: {
            bookingType: params.tripType,
            vehicleType: params.vehicleType || 'sedan',
            customerBooked: true
          },
          // Driver discovery settings
          driverDiscoveryRadius: 25, // 25km default radius
          estimatedEarnings: Math.round(totalAmount * 0.85), // Driver gets 85%
          tripUrgency: 'normal'
        }
      });

      // Create the booking
      const booking = await tx.booking.create({
        data: {
          tripId: trip.id,
          userId: params.userId,
          status: 'PENDING', // Pending until driver accepts
          seatsBooked: params.seatsBooked,
          totalAmount,
          currency: 'KZT',
          passengers: params.passengers,
          notes: params.notes
        },
        include: {
          trip: {
            include: {
              organizer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      return { trip, booking };
    });

    // Broadcast trip to nearby drivers using existing infrastructure
    try {
      await realtimeBroadcastService.broadcastTripOffer(result.trip.id);
    } catch (broadcastError) {
      console.error('Failed to broadcast trip to drivers:', broadcastError);
      // Don't fail the booking if broadcast fails
    }

    return {
      booking: result.booking,
      trip: result.trip,
      message: 'Booking created successfully. Finding nearby drivers...'
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Get booking details
 */
export async function getBooking(bookingId: string) {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip: {
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true
            }
          },
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  avatar: true
                }
              }
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });
}

/**
 * Get all bookings for a user
 */
export async function getUserBookings(userId: string, status?: string) {
  const where: any = { userId };
  
  if (status && status !== 'all') {
    where.status = status.toUpperCase();
  }

  return await prisma.booking.findMany({
    where,
    include: {
      trip: {
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, userId: string, reason?: string) {
  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId
    },
    include: {
      trip: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'CANCELLED') {
    throw new Error('Booking already cancelled');
  }

  if (booking.status === 'COMPLETED') {
    throw new Error('Cannot cancel completed booking');
  }

  // Update booking and trip in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Cancel booking
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        notes: reason ? `${booking.notes || ''}\nCancellation reason: ${reason}` : booking.notes
      }
    });

    // If trip has no other bookings, cancel the trip too
    const otherBookings = await tx.booking.count({
      where: {
        tripId: booking.tripId,
        id: { not: bookingId },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (otherBookings === 0) {
      await tx.trip.update({
        where: { id: booking.tripId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });
    }

    return updatedBooking;
  });

  return result;
}

/**
 * Confirm booking (when driver accepts)
 */
export async function confirmBooking(bookingId: string) {
  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date()
    },
    include: {
      trip: true,
      user: true
    }
  });
}

export const bookingService = {
  createPrivateTripBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
  confirmBooking
};
