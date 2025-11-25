/**
 * Individual Booking API Routes
 * GET /api/bookings/[id] - Get booking details
 * PUT /api/bookings/[id] - Update booking (currently used for cancellation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/bookingService';

/**
 * GET /api/bookings/[id]
 * Get booking details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    const booking = await bookingService.getBooking(bookingId);

    if (!booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 });
    }

    // Transform booking for response
    const transformedBooking = {
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
      user: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone
      },
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
        organizer: {
          id: booking.trip.organizer.id,
          name: booking.trip.organizer.name,
          email: booking.trip.organizer.email,
          phone: booking.trip.organizer.phone,
          avatar: booking.trip.organizer.avatar
        },
        driver: booking.trip.driver ? {
          id: booking.trip.driver.id,
          name: booking.trip.driver.user.name,
          phone: booking.trip.driver.user.phone,
          avatar: booking.trip.driver.user.avatar,
          rating: booking.trip.driver.rating,
          vehicleModel: booking.trip.driver.vehicleModel,
          vehicleMake: booking.trip.driver.vehicleMake,
          vehicleColor: booking.trip.driver.vehicleColor,
          licensePlate: booking.trip.driver.licensePlate
        } : null
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedBooking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch booking'
    }, { status: 500 });
  }
}

/**
 * PUT /api/bookings/[id]
 * Update booking (currently supports cancellation)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    const { action, userId, reason } = body;

    if (action === 'cancel') {
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'userId is required for cancellation'
        }, { status: 400 });
      }

      const cancelledBooking = await bookingService.cancelBooking(
        bookingId,
        userId,
        reason
      );

      return NextResponse.json({
        success: true,
        data: {
          bookingId: cancelledBooking.id,
          status: cancelledBooking.status.toLowerCase(),
          message: 'Booking cancelled successfully'
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Supported actions: cancel'
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating booking:', error);

    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update booking'
    }, { status: 500 });
  }
}
