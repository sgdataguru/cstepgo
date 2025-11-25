import { NextRequest, NextResponse } from 'next/server';
import { PayoutStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getDriverPayoutSummary } from '@/lib/services/driverPayoutService';

/**
 * GET /api/drivers/payouts
 * 
 * Get driver's payout history and summary
 * Includes pending and settled payouts
 */
export async function GET(request: NextRequest) {
  try {
    // Get driver from request headers (set by auth middleware)
    const driverId = request.headers.get('x-driver-id');
    
    if (!driverId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Driver authentication required',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PayoutStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get payout summary
    const summary = await getDriverPayoutSummary(driverId);

    // Build where clause for payouts
    const where: any = {
      driverId,
    };
    if (status) {
      where.status = status;
    }

    // Fetch driver's payouts
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.payout.count({ where }),
    ]);

    // Get unpaid bookings for pending payout calculation
    const unpaidBookings = await prisma.booking.findMany({
      where: {
        trip: {
          driverId: driverId,
        },
        status: 'COMPLETED',
        paymentMethodType: 'ONLINE',
        payment: {
          status: 'SUCCEEDED',
        },
        payoutSettled: false,
      },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            departureTime: true,
            originName: true,
            destName: true,
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
    });

    // Calculate pending payout details
    const pendingAmount = unpaidBookings.reduce((sum, booking) => {
      const amount = Number(booking.totalAmount);
      const driverEarnings = amount * 0.85; // 85% to driver
      return sum + driverEarnings;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          lifetimeEarnings: summary.lifetimeEarnings,
          pendingPayout: pendingAmount,
          lastPayoutAmount: summary.lastPayoutAmount,
          lastPayoutDate: summary.lastPayoutDate,
          totalPayouts: summary.totalPayouts,
          currency: summary.currency,
        },
        payouts: payouts.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          payoutMethod: p.payoutMethod,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          tripsCount: p.tripsCount,
          bookingsCount: p.bookingsCount,
          createdAt: p.createdAt,
          processedAt: p.processedAt,
          failedAt: p.failedAt,
          errorMessage: p.errorMessage,
          metadata: p.metadata,
        })),
        unpaidBookings: unpaidBookings.map(b => ({
          id: b.id,
          tripId: b.tripId,
          tripTitle: b.trip.title,
          departureTime: b.trip.departureTime,
          route: `${b.trip.originName} → ${b.trip.destName}`,
          totalAmount: Number(b.totalAmount),
          driverEarnings: Math.round(Number(b.totalAmount) * 0.85),
          platformFee: Math.round(Number(b.totalAmount) * 0.15),
          paymentMethod: b.paymentMethodType,
          createdAt: b.createdAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Get driver payouts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve payouts',
      },
      { status: 500 }
    );
  }
}
