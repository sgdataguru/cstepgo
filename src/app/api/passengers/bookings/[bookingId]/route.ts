/**
 * Passenger Booking Details API
 * GET /api/passengers/bookings/[bookingId] - Get detailed booking information
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getBookingDetails } from '@/lib/services/bookingService';

interface RouteContext {
  params: {
    bookingId: string;
  };
}

export const GET = withAuth(async (req: NextRequest, user, context: RouteContext) => {
  try {
    // Only passengers can access this endpoint
    if (user.role !== 'PASSENGER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only passengers can access their bookings' },
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

    const booking = await getBookingDetails(bookingId, user.userId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details', details: error.message },
      { status: 500 }
    );
  }
});
