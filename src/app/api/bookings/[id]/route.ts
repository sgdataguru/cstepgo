import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { Prisma } from '@prisma/client';
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';

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
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Get trip with FOR UPDATE lock to prevent race conditions
        const tripRaw = await tx.$queryRaw<Array<{
          id: string;
          availableSeats: number;
          totalSeats: number;
          status: string;
          version: number;
        }>>`
          SELECT id, "availableSeats", "totalSeats", status, version
          FROM "Trip"
          WHERE id = ${booking.tripId}
          FOR UPDATE
        `;

        if (!tripRaw || tripRaw.length === 0) {
          throw new Error('Trip not found');
        }

        const trip = tripRaw[0];

        // 2. Update booking status
        const updated = await tx.booking.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });

        // 3. Restore available seats to trip with optimistic locking
        const newAvailableSeats = trip.availableSeats + booking.seatsBooked;
        const newStatus = trip.status === 'FULL' ? 'PUBLISHED' : trip.status;
        
        const updateResult = await tx.$executeRaw`
          UPDATE "Trip"
          SET "availableSeats" = ${newAvailableSeats},
              version = version + 1,
              status = ${newStatus}::text
          WHERE id = ${booking.tripId}
            AND version = ${trip.version}
        `;

        // Check if update was successful
        if (updateResult === 0) {
          throw new Error('Cancellation failed due to concurrent modification. Please try again.');
        }

        return {
          booking: updated,
          tripId: booking.tripId,
          availableSeats: newAvailableSeats,
          totalSeats: trip.totalSeats,
          status: newStatus,
          seatsReleased: booking.seatsBooked,
        };
      });

      // Broadcast seat availability update to all connected clients
      try {
        await realtimeBroadcastService.broadcastSeatAvailability({
          tripId: result.tripId,
          availableSeats: result.availableSeats,
          totalSeats: result.totalSeats,
          status: result.status,
        });

        // Also broadcast to driver if exists
        if (booking.trip.driverId) {
          await realtimeBroadcastService.broadcastBookingCancellation({
            bookingId: id,
            tripId: result.tripId,
            driverId: booking.trip.driverId,
            userId: user.id,
            seatsReleased: result.seatsReleased,
            reason: body.reason || 'Passenger cancelled booking',
          });
        }
      } catch (broadcastError) {
        // Log error but don't fail the cancellation
        console.error('Failed to broadcast cancellation:', broadcastError);
      }

      return NextResponse.json({
        success: true,
        data: result.booking,
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
