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
  return (VALID_ZONES as readonly string[]).includes(zone);
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

    // Build dynamic where clause with Kazakhstan-specific constraints
    const where: any = {
      status: status as any,
      // Enforce zone must exist (Kazakhstan trips should have zone assigned)
      // This ensures we only return properly classified trips
      zone: zones.length > 0 
        ? { in: zones }
        : { in: VALID_ZONES as unknown as string[] }, // Default: all valid zones (excludes null)
      // Geographic boundary enforcement at database level
      // Latitude: 40.5° N to 55.5° N
      originLat: { gte: 40.5, lte: 55.5 },
      destLat: { gte: 40.5, lte: 55.5 },
      // Longitude: 46.5° E to 87.5° E  
      originLng: { gte: 46.5, lte: 87.5 },
      destLng: { gte: 46.5, lte: 87.5 },
    };

    // Add ID filter if specified (for single trip lookup)
    if (id) {
      where.id = id;
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

    // Secondary validation filter (defense in depth)
    // Database query already filters by geography, but validate data integrity
    const validatedTrips = trips.filter((trip: any) => {
      // Ensure coordinates are valid numbers
      if (!areCoordinatesValid(trip.originLat, trip.originLng) || 
          !areCoordinatesValid(trip.destLat, trip.destLng)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Trip ${trip.id} has invalid coordinates, excluding`);
        }
        return false;
      }
      
      // Verify trip has a valid zone assigned
      if (!trip.zone || !isValidZone(trip.zone)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Trip ${trip.id} has invalid zone: ${trip.zone}, excluding`);
        }
        return false;
      }
      
      // Double-check Kazakhstan boundaries (defense in depth)
      const isKazakhstanTrip = isTripWithinKazakhstan(
        trip.originLat,
        trip.originLng,
        trip.destLat,
        trip.destLng
      );
      
      if (!isKazakhstanTrip && process.env.NODE_ENV === 'development') {
        console.log(`Trip ${trip.id} (${trip.title}) excluded: Outside Kazakhstan geography`);
      }
      
      return isKazakhstanTrip;
    });

    // Transform and enrich trips with zone information
    const transformedTrips = validatedTrips.map((trip: any) => {
      // Zone is already validated, use directly
      // Calculate estimatedDays and distance if not set
      let zone = trip.zone; // Already validated as ZONE_A, ZONE_B, or ZONE_C
      let estimatedDays = trip.estimatedDays;
      let distance = trip.distance;

      if (!estimatedDays || !distance) {
        const classification = classifyTrip(
          trip.departureTime,
          trip.returnTime,
          trip.originLat,
          trip.originLng,
          trip.destLat,
          trip.destLng,
          trip.distance
        );
        
        // Keep existing zone (already validated), only calculate missing fields
        estimatedDays = estimatedDays || classification.estimatedDays;
        
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
