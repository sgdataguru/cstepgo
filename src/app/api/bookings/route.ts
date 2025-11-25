/**
 * Bookings API Routes
 * POST /api/bookings - Create new private trip booking
 * GET /api/bookings - Get user's bookings (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bookingService } from '@/lib/services/bookingService';

// Validation schema for booking creation
const createBookingSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  tripType: z.enum(['private', 'shared']),
  origin: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number()
  }),
  destination: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number()
  }),
  departureTime: z.string().datetime(),
  returnTime: z.string().datetime().optional(),
  passengers: z.array(z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional()
  })).min(1),
  seatsBooked: z.number().int().min(1).max(8),
  notes: z.string().optional(),
  vehicleType: z.string().optional()
});

/**
 * POST /api/bookings
 * Create a new private trip booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createBookingSchema.parse(body);

    // Convert string dates to Date objects
    const bookingParams = {
      ...validatedData,
      departureTime: new Date(validatedData.departureTime),
      returnTime: validatedData.returnTime ? new Date(validatedData.returnTime) : undefined
    };

    // Create booking
    const result = await bookingService.createPrivateTripBooking(bookingParams);

    return NextResponse.json({
      success: true,
      data: {
        bookingId: result.booking.id,
        tripId: result.trip.id,
        status: result.booking.status,
        totalAmount: result.booking.totalAmount,
        currency: result.booking.currency,
        message: result.message
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create booking'
    }, { status: 500 });
  }
}

/**
 * GET /api/bookings
 * Get user's bookings with optional status filter
 * Query params: userId (required), status (optional: all, pending, confirmed, cancelled, completed)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'all';

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId query parameter is required'
      }, { status: 400 });
    }

    // Get user's bookings
    const bookings = await bookingService.getUserBookings(userId, status);

    // Transform bookings for response
    const transformedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      tripId: booking.tripId,
      status: booking.status.toLowerCase(),
      seatsBooked: booking.seatsBooked,
      totalAmount: Number(booking.totalAmount),
      currency: booking.currency,
      passengers: booking.passengers,
      notes: booking.notes,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      trip: {
        id: booking.trip.id,
        title: booking.trip.title,
        description: booking.trip.description,
        departureTime: booking.trip.departureTime,
        returnTime: booking.trip.returnTime,
        status: booking.trip.status.toLowerCase(),
        origin: {
          name: booking.trip.originName,
          address: booking.trip.originAddress,
          coordinates: {
            lat: booking.trip.originLat,
            lng: booking.trip.originLng
          }
        },
        destination: {
          name: booking.trip.destName,
          address: booking.trip.destAddress,
          coordinates: {
            lat: booking.trip.destLat,
            lng: booking.trip.destLng
          }
        },
        driver: booking.trip.driver ? {
          id: booking.trip.driver.id,
          name: booking.trip.driver.user.name,
          avatar: booking.trip.driver.user.avatar,
          rating: booking.trip.driver.rating,
          vehicleModel: booking.trip.driver.vehicleModel,
          vehicleMake: booking.trip.driver.vehicleMake,
          licensePlate: booking.trip.driver.licensePlate
        } : null
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        bookings: transformedBookings,
        count: transformedBookings.length
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings'
    }, { status: 500 });
  }
}
