import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TripType } from '@prisma/client';

/**
 * GET /api/trips/[id]/availability - Check seat availability for a trip
 * 
 * Query Parameters:
 * - seats: Number of seats to check (default: 1)
 * 
 * Features:
 * - Real-time seat availability check
 * - Per-seat pricing for shared rides
 * - Price estimation with platform fees
 * - Multi-tenant context validation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;
    const { searchParams } = new URL(request.url);
    const requestedSeats = parseInt(searchParams.get('seats') || '1', 10);

    // Validate requested seats
    if (requestedSeats < 1 || requestedSeats > 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid seat count. Must be between 1 and 20.',
        },
        { status: 400 }
      );
    }

    // Get trip with current bookings
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          select: {
            seatsBooked: true,
            status: true,
          }
        },
        organizer: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!trip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trip not found',
        },
        { status: 404 }
      );
    }

    // Check if trip is available for booking
    if (trip.status !== 'PUBLISHED') {
      return NextResponse.json(
        {
          success: false,
          error: `Trip is not available for booking. Current status: ${trip.status}`,
          data: {
            tripId: trip.id,
            status: trip.status,
            canBook: false,
          }
        },
        { status: 400 }
      );
    }

    // Calculate actual available seats
    const totalBookedSeats = trip.bookings.reduce(
      (sum, booking) => sum + booking.seatsBooked,
      0
    );
    const actualAvailableSeats = trip.totalSeats - totalBookedSeats;

    // Determine if booking is possible
    const canBook = actualAvailableSeats >= requestedSeats;

    // Calculate pricing based on trip type
    let pricePerSeat: number;
    let estimatedTotal: number;

    if (trip.tripType === TripType.SHARED) {
      // For shared rides, use pricePerSeat if available, otherwise divide basePrice
      // Guard against division by zero
      if (trip.totalSeats === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid trip configuration: totalSeats cannot be zero',
          },
          { status: 500 }
        );
      }
      
      pricePerSeat = trip.pricePerSeat 
        ? Number(trip.pricePerSeat)
        : Number(trip.basePrice) / trip.totalSeats;
      estimatedTotal = (pricePerSeat * requestedSeats) + Number(trip.platformFee);
    } else {
      // For private trips, price is for the entire trip
      pricePerSeat = Number(trip.basePrice);
      estimatedTotal = Number(trip.basePrice) + Number(trip.platformFee);
    }

    // Return availability information
    return NextResponse.json({
      success: true,
      data: {
        tripId: trip.id,
        tripTitle: trip.title,
        tripType: trip.tripType,
        requestedSeats,
        availability: {
          totalSeats: trip.totalSeats,
          bookedSeats: totalBookedSeats,
          availableSeats: actualAvailableSeats,
          canBook,
          message: canBook 
            ? `${actualAvailableSeats} seat(s) available`
            : `Only ${actualAvailableSeats} seat(s) available, but ${requestedSeats} requested`,
        },
        pricing: {
          pricePerSeat: Math.round(pricePerSeat * 100) / 100,
          platformFee: Number(trip.platformFee),
          estimatedTotal: Math.round(estimatedTotal * 100) / 100,
          currency: trip.currency,
          breakdown: trip.tripType === TripType.SHARED ? {
            basePrice: pricePerSeat * requestedSeats,
            platformFee: Number(trip.platformFee),
            total: estimatedTotal,
          } : {
            tripPrice: Number(trip.basePrice),
            platformFee: Number(trip.platformFee),
            total: estimatedTotal,
          }
        },
        trip: {
          departureTime: trip.departureTime,
          returnTime: trip.returnTime,
          origin: trip.originName,
          destination: trip.destName,
          status: trip.status,
        },
        tenantId: trip.tenantId,
        bookings: {
          confirmed: trip.bookings.filter(b => b.status === 'CONFIRMED').length,
          pending: trip.bookings.filter(b => b.status === 'PENDING').length,
        }
      }
    });

  } catch (error) {
    console.error('Seat availability check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check seat availability',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
