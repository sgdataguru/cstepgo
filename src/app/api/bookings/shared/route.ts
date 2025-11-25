import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TripType, BookingStatus } from '@prisma/client';

// Validation schema for shared ride booking
const sharedBookingSchema = z.object({
  tripId: z.string().cuid(),
  userId: z.string().cuid(),
  seatsBooked: z.number().int().min(1).max(8),
  passengers: z.array(z.object({
    name: z.string().min(1),
    age: z.number().int().min(0).optional(),
    phone: z.string().optional(),
  })),
  notes: z.string().optional(),
  tenantId: z.string().optional(), // Multi-tenant support
});

// Calculate total price for shared ride booking
function calculateSharedRidePrice(
  pricePerSeat: number,
  seatsBooked: number,
  platformFee: number
): number {
  const baseCost = pricePerSeat * seatsBooked;
  return baseCost + platformFee;
}

/**
 * POST /api/bookings/shared - Create a new shared ride booking
 * 
 * Features:
 * - Atomic seat reservation to prevent double-booking
 * - Per-seat pricing calculation
 * - Seat availability validation
 * - Multi-tenant support
 * - Real-time availability updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = sharedBookingSchema.parse(body);
    
    // Use Prisma transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get trip details with lock to prevent race conditions
      const trip = await tx.trip.findUnique({
        where: { 
          id: validatedData.tripId 
        },
        include: {
          bookings: {
            where: {
              status: {
                in: [BookingStatus.CONFIRMED, BookingStatus.PENDING]
              }
            },
            select: {
              seatsBooked: true
            }
          }
        }
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      // 2. Validate trip type is SHARED
      if (trip.tripType !== TripType.SHARED) {
        throw new Error('This endpoint is only for shared ride bookings. Use /api/bookings/private for private trips.');
      }

      // 3. Validate trip is published and available
      if (trip.status !== 'PUBLISHED') {
        throw new Error(`Trip is not available for booking. Current status: ${trip.status}`);
      }

      // 4. Calculate actual available seats
      const totalBookedSeats = trip.bookings.reduce(
        (sum, booking) => sum + booking.seatsBooked,
        0
      );
      const actualAvailableSeats = trip.totalSeats - totalBookedSeats;

      // 5. Validate seat availability
      if (actualAvailableSeats < validatedData.seatsBooked) {
        throw new Error(
          `Insufficient seats available. Requested: ${validatedData.seatsBooked}, Available: ${actualAvailableSeats}`
        );
      }

      // 6. Validate passenger count matches seats booked
      if (validatedData.passengers.length !== validatedData.seatsBooked) {
        throw new Error(
          `Number of passengers (${validatedData.passengers.length}) must match seats booked (${validatedData.seatsBooked})`
        );
      }

      // 7. Calculate pricing
      // Guard against division by zero
      if (trip.totalSeats === 0) {
        throw new Error('Invalid trip configuration: totalSeats cannot be zero');
      }
      
      const pricePerSeat = trip.pricePerSeat ? Number(trip.pricePerSeat) : Number(trip.basePrice) / trip.totalSeats;
      const totalAmount = calculateSharedRidePrice(
        pricePerSeat,
        validatedData.seatsBooked,
        Number(trip.platformFee)
      );

      // 8. Validate tenant context if provided
      if (validatedData.tenantId && trip.tenantId && validatedData.tenantId !== trip.tenantId) {
        throw new Error('Tenant context mismatch. Cannot book across different tenants.');
      }

      // 9. Create booking
      const booking = await tx.booking.create({
        data: {
          tripId: validatedData.tripId,
          userId: validatedData.userId,
          seatsBooked: validatedData.seatsBooked,
          totalAmount,
          currency: trip.currency,
          passengers: validatedData.passengers,
          notes: validatedData.notes,
          tenantId: validatedData.tenantId || trip.tenantId,
          status: BookingStatus.PENDING,
        },
        include: {
          trip: {
            select: {
              id: true,
              title: true,
              departureTime: true,
              originName: true,
              destName: true,
              tripType: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          }
        }
      });

      // 10. Update trip available seats
      const newAvailableSeats = actualAvailableSeats - validatedData.seatsBooked;
      await tx.trip.update({
        where: { id: validatedData.tripId },
        data: {
          availableSeats: newAvailableSeats,
          // Mark as FULL if no more seats available
          status: newAvailableSeats === 0 ? 'FULL' : trip.status,
        }
      });

      return {
        booking,
        seatsRemaining: newAvailableSeats,
      };
    });

    // 11. Return success response with booking details
    return NextResponse.json({
      success: true,
      message: 'Shared ride booking created successfully',
      data: {
        bookingId: result.booking.id,
        tripId: result.booking.tripId,
        tripTitle: result.booking.trip.title,
        seatsBooked: result.booking.seatsBooked,
        seatsRemaining: result.seatsRemaining,
        totalAmount: Number(result.booking.totalAmount),
        currency: result.booking.currency,
        status: result.booking.status,
        departureTime: result.booking.trip.departureTime,
        route: {
          from: result.booking.trip.originName,
          to: result.booking.trip.destName,
        },
        passengers: result.booking.passengers,
        tenantId: result.booking.tenantId,
        createdAt: result.booking.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Shared ride booking error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }

    // Handle business logic errors
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Determine appropriate status code
      let statusCode = 500;
      if (errorMessage.includes('not found')) statusCode = 404;
      else if (errorMessage.includes('not available') || 
               errorMessage.includes('Insufficient seats') ||
               errorMessage.includes('only for shared') ||
               errorMessage.includes('Tenant context')) statusCode = 400;

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: statusCode }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create shared ride booking',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/shared - List shared ride bookings with filters
 * 
 * Query parameters:
 * - userId: Filter by user ID
 * - tripId: Filter by trip ID
 * - status: Filter by booking status
 * - tenantId: Filter by tenant ID (multi-tenant)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const userId = searchParams.get('userId');
    const tripId = searchParams.get('tripId');
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.',
        },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      trip: {
        tripType: TripType.SHARED
      }
    };

    if (userId) where.userId = userId;
    if (tripId) where.tripId = tripId;
    if (status) where.status = status as BookingStatus;
    if (tenantId) where.tenantId = tenantId;

    // Get total count
    const totalCount = await prisma.booking.count({ where });

    // Get paginated bookings
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
            tripType: true,
            totalSeats: true,
            availableSeats: true,
            pricePerSeat: true,
            status: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          id: booking.id,
          tripId: booking.tripId,
          tripTitle: booking.trip.title,
          userId: booking.userId,
          userName: booking.user.name,
          userAvatar: booking.user.avatar,
          seatsBooked: booking.seatsBooked,
          totalAmount: Number(booking.totalAmount),
          currency: booking.currency,
          status: booking.status,
          passengers: booking.passengers,
          notes: booking.notes,
          tenantId: booking.tenantId,
          departureTime: booking.trip.departureTime,
          route: {
            from: booking.trip.originName,
            to: booking.trip.destName,
          },
          payment: booking.payment ? {
            id: booking.payment.id,
            status: booking.payment.status,
            amount: Number(booking.payment.amount),
          } : null,
          createdAt: booking.createdAt,
          confirmedAt: booking.confirmedAt,
          cancelledAt: booking.cancelledAt,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching shared ride bookings:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch shared ride bookings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
