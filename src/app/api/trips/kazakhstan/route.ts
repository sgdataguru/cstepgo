import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { classifyTrip } from '@/lib/utils/tripZoneClassifier';
import { calculateHaversineDistance } from '@/lib/utils/geoUtils';
import { isTripWithinKazakhstan, areCoordinatesValid } from '@/lib/utils/kazakhstanGeography';

/**
 * Valid zone enum values
 */
const VALID_ZONES = ['ZONE_A', 'ZONE_B', 'ZONE_C'] as const;

/**
 * Validate zone enum value
 */
function isValidZone(zone: string): boolean {
  return VALID_ZONES.includes(zone as any);
}

/**
 * GET /api/trips/kazakhstan - List Kazakhstan trips with zone filtering
 * 
 * Query params:
 * - id: Filter by specific trip ID
 * - zone: Filter by zone (ZONE_A, ZONE_B, ZONE_C) - can be multiple
 * - tripType: Filter by trip type (PRIVATE, SHARED)
 * - status: Filter by status (default: PUBLISHED)
 * 
 * Domain Enforcement:
 * - All trips MUST have origin and destination within Kazakhstan geographic boundaries
 * - Zone values MUST be valid TripZone enum values (ZONE_A, ZONE_B, ZONE_C)
 * - Status values are returned in UPPERCASE for system consistency
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const zones = searchParams.getAll('zone'); // Can have multiple zone filters
    const tripType = searchParams.get('tripType');
    const status = searchParams.get('status') || 'PUBLISHED';

    // Validate zone enum values if provided
    if (zones.length > 0) {
      const invalidZones = zones.filter(zone => !isValidZone(zone));
      if (invalidZones.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid zone value',
            message: `Invalid zone(s): ${invalidZones.join(', ')}. Valid zones are: ${VALID_ZONES.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Build dynamic where clause
    const where: any = {
      status: status as any,
    };

    // Add ID filter if specified (for single trip lookup)
    if (id) {
      where.id = id;
    }

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

    // Filter trips to Kazakhstan geography domain
    // This is a critical security/domain boundary enforcement
    const kazakhstanTrips = trips.filter((trip: any) => {
      // Validate coordinates are valid numbers
      if (!areCoordinatesValid(trip.originLat, trip.originLng) || 
          !areCoordinatesValid(trip.destLat, trip.destLng)) {
        console.warn(`Trip ${trip.id} has invalid coordinates, excluding from Kazakhstan results`);
        return false;
      }
      
      // Check if trip is within Kazakhstan boundaries
      const isKazakhstanTrip = isTripWithinKazakhstan(
        trip.originLat,
        trip.originLng,
        trip.destLat,
        trip.destLng
      );
      
      if (!isKazakhstanTrip) {
        console.log(`Trip ${trip.id} (${trip.title}) excluded: Outside Kazakhstan geography`);
      }
      
      return isKazakhstanTrip;
    });

    // Transform and enrich trips with zone information
    const transformedTrips = kazakhstanTrips.map((trip: any) => {
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
          distance = calculateHaversineDistance(
            trip.originLat,
            trip.originLng,
            trip.destLat,
            trip.destLng
          );
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
        status: trip.status, // Keep uppercase for system consistency
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
