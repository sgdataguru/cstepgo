import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { classifyTrip } from '@/lib/utils/tripZoneClassifier';

/**
 * GET /api/trips/kazakhstan - List Kazakhstan trips with zone filtering
 * 
 * Query params:
 * - zone: Filter by zone (ZONE_A, ZONE_B, ZONE_C) - can be multiple
 * - tripType: Filter by trip type (PRIVATE, SHARED)
 * - status: Filter by status (default: PUBLISHED)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zones = searchParams.getAll('zone'); // Can have multiple zone filters
    const tripType = searchParams.get('tripType');
    const status = searchParams.get('status') || 'PUBLISHED';

    // Build dynamic where clause
    const where: any = {
      status: status as any,
    };

    // Add zone filter if specified
    if (zones.length > 0) {
      where.zone = {
        in: zones,
      };
    }

    // Add trip type filter if specified
    if (tripType && (tripType === 'PRIVATE' || tripType === 'SHARED')) {
      where.tripType = tripType;
    }

    // Fetch trips from database
    const trips = await prisma.trip.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
          select: {
            id: true,
            seatsBooked: true,
            status: true,
          },
        },
      },
      orderBy: {
        departureTime: 'asc',
      },
    });

    // Transform and enrich trips with zone information
    const transformedTrips = trips.map((trip: any) => {
      // If zone is not set, calculate it dynamically
      let zone = trip.zone;
      let estimatedDays = trip.estimatedDays;
      let distance = trip.distance;

      if (!zone || !estimatedDays || !distance) {
        const classification = classifyTrip(
          trip.departureTime,
          trip.returnTime,
          trip.originLat,
          trip.originLng,
          trip.destLat,
          trip.destLng,
          trip.distance
        );
        
        zone = classification.zone;
        estimatedDays = classification.estimatedDays;
        
        // Calculate distance if not provided
        if (!distance) {
          const R = 6371; // Earth's radius in km
          const dLat = toRadians(trip.destLat - trip.originLat);
          const dLng = toRadians(trip.destLng - trip.originLng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(trip.originLat)) *
              Math.cos(toRadians(trip.destLat)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = R * c;
        }
      }

      return {
        id: trip.id,
        title: trip.title,
        description: trip.description,
        zone,
        estimatedDays,
        distance,
        departureTime: trip.departureTime,
        returnTime: trip.returnTime,
        originName: trip.originName,
        destName: trip.destName,
        originAddress: trip.originAddress,
        destAddress: trip.destAddress,
        tripType: trip.tripType,
        basePrice: Number(trip.basePrice),
        pricePerSeat: trip.pricePerSeat ? Number(trip.pricePerSeat) : null,
        availableSeats: trip.availableSeats,
        totalSeats: trip.totalSeats,
        status: trip.status.toLowerCase(),
        currency: trip.currency,
        organizer: trip.organizer,
        driver: trip.driver,
        bookings: trip.bookings,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedTrips,
      count: transformedTrips.length,
    });
  } catch (error) {
    console.error('Error fetching Kazakhstan trips:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trips',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
