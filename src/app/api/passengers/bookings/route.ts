/**
 * Passenger Bookings API
 * GET /api/passengers/bookings - List all bookings for authenticated passenger
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - uses authentication headers
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { withAuth } from '@/lib/auth/middleware';
import { getUserBookings, getUpcomingBookingsCount, getUserBookingStats } from '@/lib/services/bookingService';
import { BookingStatus } from '@prisma/client';

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Only passengers can access this endpoint
    if (user.role !== 'PASSENGER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only passengers can access their bookings' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const statusParam = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const past = searchParams.get('past') === 'true';
    const statsOnly = searchParams.get('stats') === 'true';
    const tripType = searchParams.get('tripType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // If stats only requested, return stats
    if (statsOnly) {
      const stats = await getUserBookingStats(user.userId);
      return NextResponse.json({ stats });
    }

    // Parse status filter
    let statusFilter: BookingStatus | BookingStatus[] | undefined;
    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim().toUpperCase());
      statusFilter = statuses.length === 1 ? statuses[0] as BookingStatus : statuses as BookingStatus[];
    }

    // Get bookings
    const bookings = await getUserBookings(user.userId, {
      status: statusFilter,
      upcoming,
      past,
      tripType: tripType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });

    // Get additional stats for response
    const upcomingCount = await getUpcomingBookingsCount(user.userId);

    return NextResponse.json({
      success: true,
      data: bookings,
      meta: {
        total: bookings.length,
        upcomingCount,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error.message },
      { status: 500 }
    );
  }
});
