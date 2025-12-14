import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { Prisma } from '@prisma/client';
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';
import { shouldBroadcastTrip } from '@/lib/utils/tripBroadcastUtils';
import { emitBookingConfirmed } from '@/lib/realtime/unifiedEventEmitter';

/**
 * POST /api/bookings
 * 
 * Create a new booking for a trip
 * Supports both private and shared ride bookings
 * Handles payment method selection (ONLINE or CASH_TO_DRIVER)
 * 
 * Request body:
 * {
 *   tripId: string,
 *   seatsBooked: number,
 *   passengers: Array<{name: string, age?: number, phone?: string}>,
 *   paymentMethodType: 'ONLINE' | 'CASH_TO_DRIVER',
 *   notes?: string
 * }
 */
export const POST = withAuth(async (request: NextRequest, context: any) => {
  try {
    const { user } = context;
    const body = await request.json();
    
    const {
      tripId,
      seatsBooked = 1,
      passengers,
      // TODO: Re-enable online payments in future - for MVP, default to cash
      paymentMethodType = 'CASH_TO_DRIVER',
      notes,
    } = body;

    // Validate required fields
    if (!tripId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: tripId',
        },
        { status: 400 }
      );
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one passenger is required',
        },
        { status: 400 }
      );
    }

    if (passengers.length !== seatsBooked) {
      return NextResponse.json(
        {
          success: false,
          error: `Number of passengers (${passengers.length}) must match seats booked (${seatsBooked})`,
        },
        { status: 400 }
      );
    }

    // Validate payment method type
    if (!['ONLINE', 'CASH_TO_DRIVER'].includes(paymentMethodType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment method type. Must be ONLINE or CASH_TO_DRIVER',
        },
        { status: 400 }
      );
    }

    // Fetch trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
        },
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

    // Check if trip is published and available
    if (trip.status !== 'PUBLISHED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Trip is not available for booking',
        },
        { status: 400 }
      );
    }

    // Check if enough seats are available
    if (trip.availableSeats < seatsBooked) {
      return NextResponse.json(
        {
          success: false,
          error: `Not enough seats available. Only ${trip.availableSeats} seats remaining.`,
        },
        { status: 400 }
      );
    }

    // Check if user already has a booking for this trip
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tripId,
        userId: user.id,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active booking for this trip',
        },
        { status: 400 }
      );
    }

    // Calculate total amount
    const pricePerSeat = Number(trip.basePrice);
    const totalAmount = pricePerSeat * seatsBooked;

    // Create booking with transaction
    const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          tripId,
          userId: user.id,
          seatsBooked,
          totalAmount,
          currency: trip.currency,
          passengers,
          notes,
          paymentMethodType,
          status: paymentMethodType === 'CASH_TO_DRIVER' ? 'CONFIRMED' : 'PENDING',
          confirmedAt: paymentMethodType === 'CASH_TO_DRIVER' ? new Date() : null,
        },
      });

      // Update trip available seats
      await tx.trip.update({
        where: { id: tripId },
        data: {
          availableSeats: {
            decrement: seatsBooked,
          },
        },
      });

      // If cash payment, create a payment record with pending cash status
      if (paymentMethodType === 'CASH_TO_DRIVER') {
        await tx.payment.create({
          data: {
            bookingId: newBooking.id,
            amount: totalAmount,
            currency: trip.currency,
            status: 'PENDING',
            paymentMethod: 'cash',
            metadata: {
              paymentType: 'cash_to_driver',
              description: 'Payment to be collected by driver',
            },
          },
        });
      }

      return newBooking;
    });

    // Fetch the complete booking with relations
    const completeBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            departureTime: true,
            originName: true,
            destName: true,
            tripType: true,
            status: true,
            driverId: true,
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

    // Auto-broadcast private trip offers to eligible drivers in realtime
    // This handles cases where:
    // 1. Trip was created in DRAFT and manually published later
    // 2. Broadcast failed during trip creation
    // 3. Trip needs re-broadcasting for any reason
    if (completeBooking?.trip && shouldBroadcastTrip(completeBooking.trip)) {
      try {
        const broadcastResult = await realtimeBroadcastService.broadcastTripOffer(completeBooking.trip.id);
        console.log(`Private trip ${completeBooking.trip.id} broadcast to ${broadcastResult.sent} drivers after booking`);
        
        // Update trip status to OFFERED after successful broadcast
        await prisma.trip.update({
          where: { id: completeBooking.trip.id },
          data: { status: 'OFFERED' },
        });
      } catch (broadcastError) {
        // Log error but don't fail the booking
        console.error('Failed to broadcast private trip offer after booking:', broadcastError);
      }
    }

    // Emit booking confirmation event to realtime channels
    if (completeBooking?.trip) {
      try {
        // Fetch updated trip to get accurate available seats
        const updatedTrip = await prisma.trip.findUnique({
          where: { id: completeBooking.trip.id },
          select: { availableSeats: true, totalSeats: true, tenantId: true },
        });

        await emitBookingConfirmed({
          tripId: completeBooking.trip.id,
          tripType: completeBooking.trip.tripType as 'PRIVATE' | 'SHARED',
          bookingId: completeBooking.id,
          passengerId: user.id,
          passengerName: user.name || 'Guest',
          seatsBooked: seatsBooked,
          availableSeats: updatedTrip?.availableSeats || 0,
          totalSeats: updatedTrip?.totalSeats || 0,
          tenantId: updatedTrip?.tenantId || undefined,
        });
      } catch (emitError) {
        // Log error but don't fail the booking
        console.error('Failed to emit booking confirmed event:', emitError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        booking: completeBooking,
        message:
          paymentMethodType === 'CASH_TO_DRIVER'
            ? 'Booking confirmed. Payment will be collected by driver.'
            : 'Booking created. Please proceed with payment.',
        requiresPayment: paymentMethodType === 'ONLINE',
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/bookings
 * 
 * Get all bookings for the authenticated user
 */
export const GET = withAuth(async (request: NextRequest, context: any) => {
  try {
    const { user } = context;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: any = {
      userId: user.id,
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            departureTime: true,
            returnTime: true,
            originName: true,
            destName: true,
            status: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bookings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
