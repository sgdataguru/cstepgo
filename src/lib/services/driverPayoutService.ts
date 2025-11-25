/**
 * Driver Payout Service
 * 
 * Handles automatic driver payouts for completed, online-paid bookings.
 * Supports multi-tenant architecture and pluggable payout providers.
 */

import { PayoutStatus, BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Platform commission rate (driver gets 85%, platform gets 15%)
export const PLATFORM_COMMISSION_RATE = 0.15;
export const DRIVER_EARNINGS_RATE = 0.85;

/**
 * Payout adapter interface for pluggable providers
 */
export interface PayoutAdapter {
  name: string;
  processPayout(params: {
    driverId: string;
    amount: number;
    currency: string;
    metadata?: any;
  }): Promise<{
    success: boolean;
    providerId?: string;
    errorMessage?: string;
  }>;
}

/**
 * Mock payout adapter for POC/development
 */
export class MockPayoutAdapter implements PayoutAdapter {
  name = 'MOCK';

  async processPayout(params: {
    driverId: string;
    amount: number;
    currency: string;
    metadata?: any;
  }): Promise<{
    success: boolean;
    providerId?: string;
    errorMessage?: string;
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Always succeed in mock mode
    return {
      success: true,
      providerId: `mock_payout_${Date.now()}`,
    };
  }
}

/**
 * Payout calculation result
 */
export interface PayoutCalculation {
  driverId: string;
  bookings: Array<{
    id: string;
    tripId: string;
    totalAmount: number;
    platformFee: number;
    driverEarnings: number;
    paymentMethodType: string;
  }>;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  bookingsCount: number;
  tripsCount: number;
  currency: string;
  tenantId?: string;
}

/**
 * Calculate driver earnings from a booking
 */
export function calculateDriverEarnings(bookingAmount: number): {
  grossAmount: number;
  platformFee: number;
  driverEarnings: number;
} {
  const grossAmount = bookingAmount;
  const platformFee = Math.round(grossAmount * PLATFORM_COMMISSION_RATE);
  const driverEarnings = grossAmount - platformFee;

  return {
    grossAmount,
    platformFee,
    driverEarnings,
  };
}

/**
 * Get unpaid bookings for a driver in a period
 * Only includes ONLINE payment bookings with SUCCEEDED payment status
 */
export async function getUnpaidBookings(params: {
  driverId: string;
  periodStart: Date;
  periodEnd: Date;
  tenantId?: string;
}): Promise<PayoutCalculation> {
  const { driverId, periodStart, periodEnd, tenantId } = params;

  // Find the driver
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  // Build the where clause for bookings
  const whereClause: Prisma.BookingWhereInput = {
    trip: {
      driverId: driverId,
      ...(tenantId ? { tenantId } : {}),
    },
    status: BookingStatus.COMPLETED,
    paymentMethodType: 'ONLINE',
    payment: {
      status: PaymentStatus.SUCCEEDED,
    },
    payoutSettled: false,
    createdAt: {
      gte: periodStart,
      lte: periodEnd,
    },
  };

  // Fetch unpaid bookings
  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      trip: {
        select: {
          id: true,
          tenantId: true,
        },
      },
      payment: {
        select: {
          status: true,
        },
      },
    },
  });

  // Calculate earnings for each booking
  const bookingDetails = bookings.map(booking => {
    const amount = Number(booking.totalAmount);
    const { grossAmount, platformFee, driverEarnings } = calculateDriverEarnings(amount);

    return {
      id: booking.id,
      tripId: booking.tripId,
      totalAmount: grossAmount,
      platformFee,
      driverEarnings,
      paymentMethodType: booking.paymentMethodType,
    };
  });

  // Calculate totals
  const grossAmount = bookingDetails.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformFee = bookingDetails.reduce((sum, b) => sum + b.platformFee, 0);
  const netAmount = bookingDetails.reduce((sum, b) => sum + b.driverEarnings, 0);

  // Count unique trips
  const uniqueTrips = new Set(bookings.map(b => b.tripId));

  return {
    driverId,
    bookings: bookingDetails,
    grossAmount,
    platformFee,
    netAmount,
    bookingsCount: bookings.length,
    tripsCount: uniqueTrips.size,
    currency: bookings[0]?.currency || 'KZT',
    tenantId: tenantId,
  };
}

/**
 * Create a payout record and mark bookings as settled
 */
export async function createPayout(
  calculation: PayoutCalculation,
  adapter: PayoutAdapter = new MockPayoutAdapter()
): Promise<{
  success: boolean;
  payoutId?: string;
  error?: string;
}> {
  try {
    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        driverId: calculation.driverId,
        amount: new Prisma.Decimal(calculation.netAmount),
        currency: calculation.currency,
        status: PayoutStatus.PENDING,
        payoutMethod: adapter.name,
        payoutProvider: adapter.name,
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        periodEnd: new Date(),
        tripsCount: calculation.tripsCount,
        bookingsCount: calculation.bookingsCount,
        tenantId: calculation.tenantId,
        metadata: {
          bookingIds: calculation.bookings.map(b => b.id),
          grossAmount: calculation.grossAmount,
          platformFee: calculation.platformFee,
          netAmount: calculation.netAmount,
          calculatedAt: new Date().toISOString(),
        },
      },
    });

    // Process payout with adapter
    const result = await adapter.processPayout({
      driverId: calculation.driverId,
      amount: calculation.netAmount,
      currency: calculation.currency,
      metadata: payout.metadata,
    });

    // Update payout status based on result
    if (result.success) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.PAID,
          processedAt: new Date(),
          providerMetadata: {
            providerId: result.providerId,
          },
        },
      });

      // Mark bookings as settled
      await prisma.booking.updateMany({
        where: {
          id: {
            in: calculation.bookings.map(b => b.id),
          },
        },
        data: {
          payoutSettled: true,
          payoutId: payout.id,
          settledAt: new Date(),
        },
      });

      return {
        success: true,
        payoutId: payout.id,
      };
    } else {
      // Mark payout as failed
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.FAILED,
          failedAt: new Date(),
          errorMessage: result.errorMessage,
        },
      });

      return {
        success: false,
        error: result.errorMessage,
      };
    }
  } catch (error) {
    console.error('Create payout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run payout for a specific driver
 */
export async function runDriverPayout(params: {
  driverId: string;
  periodStart?: Date;
  periodEnd?: Date;
  tenantId?: string;
  adapter?: PayoutAdapter;
}): Promise<{
  success: boolean;
  payoutId?: string;
  amount?: number;
  bookingsCount?: number;
  error?: string;
}> {
  const {
    driverId,
    periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    periodEnd = new Date(),
    tenantId,
    adapter = new MockPayoutAdapter(),
  } = params;

  try {
    // Calculate payout
    const calculation = await getUnpaidBookings({
      driverId,
      periodStart,
      periodEnd,
      tenantId,
    });

    // Check if there are bookings to pay out
    if (calculation.bookingsCount === 0) {
      return {
        success: true,
        amount: 0,
        bookingsCount: 0,
      };
    }

    // Create payout
    const result = await createPayout(calculation, adapter);

    if (result.success) {
      return {
        success: true,
        payoutId: result.payoutId,
        amount: calculation.netAmount,
        bookingsCount: calculation.bookingsCount,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('Run driver payout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run batch payout for all eligible drivers
 */
export async function runBatchPayout(params: {
  periodStart?: Date;
  periodEnd?: Date;
  tenantId?: string;
  adapter?: PayoutAdapter;
}): Promise<{
  success: boolean;
  processedDrivers: number;
  successfulPayouts: number;
  failedPayouts: number;
  totalAmount: number;
  results: Array<{
    driverId: string;
    success: boolean;
    amount?: number;
    error?: string;
  }>;
}> {
  const {
    periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    periodEnd = new Date(),
    tenantId,
    adapter = new MockPayoutAdapter(),
  } = params;

  try {
    // Find all drivers with unpaid bookings
    const driversWithUnpaidBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        paymentMethodType: 'ONLINE',
        payment: {
          status: PaymentStatus.SUCCEEDED,
        },
        payoutSettled: false,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        trip: tenantId ? { tenantId } : {},
      },
      select: {
        trip: {
          select: {
            driverId: true,
          },
        },
      },
    });

    // Get unique driver IDs
    const driverIds = Array.from(
      new Set(
        driversWithUnpaidBookings
          .filter(b => b.trip.driverId)
          .map(b => b.trip.driverId as string)
      )
    );

    // Process payout for each driver
    const results = await Promise.all(
      driverIds.map(async (driverId) => {
        const result = await runDriverPayout({
          driverId,
          periodStart,
          periodEnd,
          tenantId,
          adapter,
        });

        return {
          driverId,
          success: result.success,
          amount: result.amount,
          error: result.error,
        };
      })
    );

    // Calculate summary
    const successfulPayouts = results.filter(r => r.success).length;
    const failedPayouts = results.filter(r => !r.success).length;
    const totalAmount = results.reduce((sum, r) => sum + (r.amount || 0), 0);

    return {
      success: true,
      processedDrivers: driverIds.length,
      successfulPayouts,
      failedPayouts,
      totalAmount,
      results,
    };
  } catch (error) {
    console.error('Run batch payout error:', error);
    throw error;
  }
}

/**
 * Get driver payout summary
 */
export async function getDriverPayoutSummary(driverId: string): Promise<{
  lifetimeEarnings: number;
  pendingPayout: number;
  lastPayoutAmount: number;
  lastPayoutDate: Date | null;
  totalPayouts: number;
  currency: string;
}> {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      payouts: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  // Calculate totals
  const paidPayouts = driver.payouts.filter(p => p.status === PayoutStatus.PAID);
  const pendingPayouts = driver.payouts.filter(
    p => p.status === PayoutStatus.PENDING || p.status === PayoutStatus.PROCESSING
  );

  const lifetimeEarnings = paidPayouts.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const pendingPayout = pendingPayouts.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const lastPayout = paidPayouts[0];

  return {
    lifetimeEarnings,
    pendingPayout,
    lastPayoutAmount: lastPayout ? Number(lastPayout.amount) : 0,
    lastPayoutDate: lastPayout?.processedAt || null,
    totalPayouts: paidPayouts.length,
    currency: lastPayout?.currency || 'KZT',
  };
}
