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

    // Create booking with transaction using row-level locking to prevent race conditions
    const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch trip with FOR UPDATE lock to prevent concurrent modifications
      // This ensures no other transaction can modify the trip until this transaction completes
      const trip = await tx.$queryRaw<Array<{
        id: string;
        title: string;
        status: string;
        availableSeats: number;
        totalSeats: number;
        basePrice: any;
        currency: string;
        platformFee: any;
        tripType: string;
        version: number;
      }>>`
        SELECT id, title, status, "availableSeats", "totalSeats", "basePrice", 
               currency, "platformFee", "trip_type" as "tripType", version
        FROM "Trip"
        WHERE id = ${tripId}
        FOR UPDATE
      `;

      if (!trip || trip.length === 0) {
        throw new Error('Trip not found');
      }

      const tripData = trip[0];

      // 2. Validate trip is published and available
      if (tripData.status !== 'PUBLISHED') {
        throw new Error('Trip is not available for booking');
      }

      // 3. Check if enough seats are available (race-safe check inside transaction)
      if (tripData.availableSeats < seatsBooked) {
        throw new Error(`Not enough seats available. Only ${tripData.availableSeats} seats remaining.`);
      }

      // 4. Check if user already has a booking for this trip
      const existingBooking = await tx.booking.findFirst({
        where: {
          tripId,
          userId: user.id,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      });

      if (existingBooking) {
        throw new Error('You already have an active booking for this trip');
      }

      // 5. Calculate total amount
      const pricePerSeat = Number(tripData.basePrice);
      const totalAmount = pricePerSeat * seatsBooked;

      // 6. Create the booking
      const newBooking = await tx.booking.create({
        data: {
          tripId,
          userId: user.id,
          seatsBooked,
          totalAmount,
          currency: tripData.currency,
          passengers,
          notes,
          paymentMethodType,
          status: paymentMethodType === 'CASH_TO_DRIVER' ? 'CONFIRMED' : 'PENDING',
          confirmedAt: paymentMethodType === 'CASH_TO_DRIVER' ? new Date() : null,
        },
      });

      // 7. Update trip available seats with optimistic locking
      // This uses version increment to prevent race conditions
      const updateResult = await tx.$executeRaw`
        UPDATE "Trip"
        SET "availableSeats" = "availableSeats" - ${seatsBooked},
            version = version + 1,
            status = CASE 
              WHEN "availableSeats" - ${seatsBooked} = 0 THEN 'FULL'::text
              ELSE status::text
            END
        WHERE id = ${tripId}
          AND version = ${tripData.version}
      `;

      // Check if update was successful (optimistic lock check)
      if (updateResult === 0) {
        throw new Error('Booking failed due to concurrent modification. Please try again.');
      }

      // 8. If cash payment, create a payment record with pending cash status
      if (paymentMethodType === 'CASH_TO_DRIVER') {
        await tx.payment.create({
          data: {
            bookingId: newBooking.id,
            amount: totalAmount,
            currency: tripData.currency,
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
            availableSeats: true,
            totalSeats: true,
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

    // Broadcast seat availability update to all connected clients
    try {
      await realtimeBroadcastService.broadcastSeatAvailability({
        tripId: completeBooking.trip.id,
        availableSeats: completeBooking.trip.availableSeats,
        totalSeats: completeBooking.trip.totalSeats,
        status: completeBooking.trip.status,
      });
    } catch (broadcastError) {
      // Log error but don't fail the booking
      console.error('Failed to broadcast seat availability update:', broadcastError);
    }

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
