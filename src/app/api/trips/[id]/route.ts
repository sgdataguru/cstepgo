import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/trips/[id] - Get a single trip by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
          select: {
            id: true,
            seatsBooked: true,
            status: true,
            user: {
              select: {
                name: true,
              },
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

    // Transform to match frontend Trip type
    const transformedTrip = {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      departureTime: trip.departureTime,
      returnTime: trip.returnTime,
      timezone: trip.timezone,
      status: trip.status.toLowerCase(),
      location: {
        origin: {
          name: trip.originName,
          address: trip.originAddress,
          coordinates: {
            lat: trip.originLat,
            lng: trip.originLng,
          },
        },
        destination: {
          name: trip.destName,
          address: trip.destAddress,
          coordinates: {
            lat: trip.destLat,
            lng: trip.destLng,
          },
        },
      },
      capacity: {
        total: trip.totalSeats,
        booked: trip.totalSeats - trip.availableSeats,
        available: trip.availableSeats,
      },
      pricing: {
        basePrice: Number(trip.basePrice),
        currency: trip.currency,
        pricePerPerson: Number(trip.basePrice),
        platformFee: Number(trip.platformFee),
        dynamicFactors: [],
        minimumPrice: Number(trip.basePrice) * 0.8,
      },
      organizer: {
        id: trip.organizer.id,
        name: trip.organizer.name,
        role: 'DRIVER' as const,
        rating: trip.driver?.rating || 0,
        photoUrl: trip.organizer.avatar || '/drivers/default-avatar.jpg',
        bio: trip.organizer.bio,
      },
      itinerary: typeof trip.itinerary === 'string' ? JSON.parse(trip.itinerary) : trip.itinerary,
      metadata: trip.metadata ? (typeof trip.metadata === 'string' ? JSON.parse(trip.metadata) : trip.metadata) : {},
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      publishedAt: trip.publishedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedTrip,
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trip',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/trips/[id] - Update a trip (publish/unpublish, update details)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { action, ...updateData } = body;

    // Check if trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!existingTrip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trip not found',
        },
        { status: 404 }
      );
    }

    // Handle publish/unpublish actions
    if (action === 'publish') {
      const updatedTrip = await prisma.trip.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedTrip.id,
          status: updatedTrip.status,
          message: 'Trip published successfully',
        },
      });
    }

    if (action === 'unpublish') {
      const updatedTrip = await prisma.trip.update({
        where: { id },
        data: {
          status: 'DRAFT',
          publishedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedTrip.id,
          status: updatedTrip.status,
          message: 'Trip unpublished successfully',
        },
      });
    }

    // Handle general updates
    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedTrip.id,
        message: 'Trip updated successfully',
      },
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update trip',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id] - Delete a trip
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });

    if (!existingTrip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trip not found',
        },
        { status: 404 }
      );
    }

    // Don't allow deletion if there are confirmed bookings
    const hasConfirmedBookings = existingTrip.bookings.some(
      (booking: any) => booking.status === 'CONFIRMED'
    );

    if (hasConfirmedBookings) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete trip with confirmed bookings',
        },
        { status: 400 }
      );
    }

    // Delete the trip (bookings will cascade delete)
    await prisma.trip.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: 'Trip deleted successfully',
      },
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete trip',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
