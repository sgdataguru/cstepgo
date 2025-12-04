import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define PayoutStatus enum locally (matches Prisma schema)
enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
import {
  runBatchPayout,
  runDriverPayout,
  MockPayoutAdapter,
} from '@/lib/services/driverPayoutService';
import { requireAdmin } from '@/lib/auth/adminMiddleware';

/**
 * POST /api/admin/payouts/run
 * 
 * Trigger payout processing for eligible drivers
 * Supports single driver or batch processing
 * 
 * Requires admin authentication via JWT token with ADMIN role
 */
export async function POST(request: NextRequest) {
  // Check admin authentication - only users with ADMIN role can access
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const {
      driverId,
      periodStart,
      periodEnd,
      tenantId,
    } = body;

    // Parse dates if provided
    const parsedPeriodStart = periodStart ? new Date(periodStart) : undefined;
    const parsedPeriodEnd = periodEnd ? new Date(periodEnd) : undefined;

    // Use mock adapter for now (can be replaced with Stripe Connect later)
    const adapter = new MockPayoutAdapter();

    if (driverId) {
      // Process single driver payout
      const result = await runDriverPayout({
        driverId,
        periodStart: parsedPeriodStart,
        periodEnd: parsedPeriodEnd,
        tenantId,
        adapter,
      });

      return NextResponse.json({
        success: result.success,
        data: {
          driverId,
          payoutId: result.payoutId,
          amount: result.amount,
          bookingsCount: result.bookingsCount,
        },
        error: result.error,
      });
    } else {
      // Process batch payout for all eligible drivers
      const result = await runBatchPayout({
        periodStart: parsedPeriodStart,
        periodEnd: parsedPeriodEnd,
        tenantId,
        adapter,
      });

      return NextResponse.json({
        success: result.success,
        data: {
          processedDrivers: result.processedDrivers,
          successfulPayouts: result.successfulPayouts,
          failedPayouts: result.failedPayouts,
          totalAmount: result.totalAmount,
          results: result.results,
        },
      });
    }
  } catch (error) {
    console.error('Payout processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payout',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payouts/run
 * 
 * Get payout processing status and history
 * 
 * Requires admin authentication via JWT token with ADMIN role
 */
export async function GET(request: NextRequest) {
  // Check admin authentication - only users with ADMIN role can access
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status') as PayoutStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (driverId) {
      where.driverId = driverId;
    }
    if (status) {
      where.status = status;
    }

    // Fetch payouts
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.payout.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.payout.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payouts: payouts.map((p: any) => ({
          id: p.id,
          driver: {
            id: p.driver.id,
            name: p.driver.user.name,
            email: p.driver.user.email,
            phone: p.driver.user.phone,
          },
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          payoutMethod: p.payoutMethod,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          tripsCount: p.tripsCount,
          bookingsCount: p.bookingsCount,
          tenantId: p.tenantId,
          createdAt: p.createdAt,
          processedAt: p.processedAt,
          failedAt: p.failedAt,
          errorMessage: p.errorMessage,
        })),
        total,
        limit,
        offset,
        summary: summary.reduce((acc: any, s: any) => {
          acc[s.status] = {
            count: s._count.id,
            total: Number(s._sum.amount || 0),
          };
          return acc;
        }, {} as Record<string, { count: number; total: number }>),
      },
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve payouts',
      },
      { status: 500 }
    );
  }
}
