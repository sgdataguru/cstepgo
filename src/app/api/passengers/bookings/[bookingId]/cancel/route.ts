/**
 * Passenger Booking Cancellation API
 * POST /api/passengers/bookings/[bookingId]/cancel - Cancel a booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { cancelBooking } from '@/lib/services/bookingService';

interface RouteContext {
  params: {
    bookingId: string;
  };
}

export const POST = withAuth(async (req: NextRequest, user, context: RouteContext) => {
  try {
    // Only passengers can access this endpoint
    if (user.role !== 'PASSENGER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only passengers can cancel their bookings' },
        { status: 403 }
      );
    }

    const { bookingId } = context.params;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Parse request body for optional cancellation reason
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch (e) {
      // Body is optional
    }

    // Cancel the booking
    const result = await cancelBooking(bookingId, user.userId, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: result.booking,
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking', details: error.message },
      { status: 500 }
    );
  }
});
