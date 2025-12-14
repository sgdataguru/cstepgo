import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { Prisma } from '@prisma/client';
import { emitBookingCancelled } from '@/lib/realtime/unifiedEventEmitter';

/**
 * GET /api/bookings/[id]
 * 
 * Get a single booking by ID
 */
export const GET = withAuth(async (
  request: NextRequest,
  context: any
) => {
  try {
    const { user, params } = context;
    const { id } = params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
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
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Check if user owns this booking or is the driver
    const isOwner = booking.userId === user.id;
    const isDriver = booking.trip.driver?.userId === user.id;

    if (!isOwner && !isDriver && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to view this booking',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/bookings/[id]
 * 
 * Update a booking (cancel, etc.)
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  context: any
) => {
  try {
    const { user, params } = context;
    const { id } = params;
    const body = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        trip: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to update this booking',
        },
        { status: 403 }
      );
    }

    // Handle cancel action
    if (body.action === 'cancel') {
      const updatedBooking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update booking status
        const updated = await tx.booking.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });

        // Restore available seats to trip
        await tx.trip.update({
          where: { id: booking.tripId },
          data: {
            availableSeats: {
              increment: booking.seatsBooked,
            },
          },
        });

        return updated;
      });

      // Emit booking cancellation event to realtime channels
      try {
        // Fetch updated trip to get accurate available seats
        const updatedTrip = await prisma.trip.findUnique({
          where: { id: booking.tripId },
          select: { 
            availableSeats: true, 
            totalSeats: true, 
            tripType: true,
            tenantId: true,
          },
        });

        await emitBookingCancelled({
          tripId: booking.tripId,
          tripType: (updatedTrip?.tripType as 'PRIVATE' | 'SHARED') || 'PRIVATE',
          bookingId: id,
          passengerId: user.id,
          passengerName: user.name || 'Guest',
          seatsFreed: booking.seatsBooked,
          availableSeats: updatedTrip?.availableSeats || 0,
          totalSeats: updatedTrip?.totalSeats || 0,
          reason: body.reason,
          tenantId: updatedTrip?.tenantId || undefined,
        });
      } catch (emitError) {
        // Log error but don't fail the cancellation
        console.error('Failed to emit booking cancelled event:', emitError);
      }

      return NextResponse.json({
        success: true,
        data: updatedBooking,
        message: 'Booking cancelled successfully',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
