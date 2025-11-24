import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/middleware';

/**
 * GET /api/drivers/trips/[tripId]/bookings
 * 
 * Get all bookings for a trip with payment information
 * Only accessible by the driver assigned to the trip
 */
export const GET = withAuth(async (
  request: NextRequest,
  context: any
) => {
  try {
    const { user, params } = context;
    const { tripId } = params;

    // Verify the trip exists and belongs to this driver
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: true,
      },
    });

    if (!trip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trip not found',
        },
        { status: 404 }
      );
    }

    // Check if user is the driver for this trip
    if (trip.driver?.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to view bookings for this trip',
        },
        { status: 403 }
      );
    }

    // Fetch all bookings for this trip with payment information
    const bookings = await prisma.booking.findMany({
      where: {
        tripId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform bookings to include payment summary
    const bookingsWithPaymentInfo = bookings.map((booking) => ({
      id: booking.id,
      passenger: {
        id: booking.user.id,
        name: booking.user.name,
        phone: booking.user.phone,
        email: booking.user.email,
      },
      seatsBooked: booking.seatsBooked,
      totalAmount: Number(booking.totalAmount),
      currency: booking.currency,
      status: booking.status,
      paymentMethod: booking.paymentMethodType,
      paymentStatus: booking.payment?.status || 'PENDING',
      paymentInfo: {
        isPrepaid: booking.paymentMethodType === 'ONLINE' && booking.payment?.status === 'SUCCEEDED',
        isCashCollection: booking.paymentMethodType === 'CASH_TO_DRIVER',
        paymentMethod: booking.payment?.paymentMethod || 'cash',
        last4: booking.payment?.last4 || null,
        amountToCollect: booking.paymentMethodType === 'CASH_TO_DRIVER' ? Number(booking.totalAmount) : 0,
      },
      passengers: booking.passengers,
      notes: booking.notes,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
    }));

    // Calculate payment summary
    const paymentSummary = {
      totalBookings: bookings.length,
      prepaidBookings: bookings.filter(
        (b) => b.paymentMethodType === 'ONLINE' && b.payment?.status === 'SUCCEEDED'
      ).length,
      cashCollectionBookings: bookings.filter((b) => b.paymentMethodType === 'CASH_TO_DRIVER').length,
      totalCashToCollect: bookings
        .filter((b) => b.paymentMethodType === 'CASH_TO_DRIVER')
        .reduce((sum, b) => sum + Number(b.totalAmount), 0),
      totalPrepaidAmount: bookings
        .filter((b) => b.paymentMethodType === 'ONLINE' && b.payment?.status === 'SUCCEEDED')
        .reduce((sum, b) => sum + Number(b.totalAmount), 0),
      currency: trip.currency,
    };

    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          title: trip.title,
          departureTime: trip.departureTime,
          originName: trip.originName,
          destName: trip.destName,
        },
        bookings: bookingsWithPaymentInfo,
        paymentSummary,
      },
    });
  } catch (error) {
    console.error('Error fetching trip bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trip bookings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
