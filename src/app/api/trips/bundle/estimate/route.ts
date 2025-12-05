import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { classifyTrip, calculateTripDurationHours } from '@/lib/utils/tripZoneClassifier';
import { calculateBundleFare } from '@/lib/utils/fareEstimator';
import { calculateHaversineDistance } from '@/lib/utils/geoUtils';

/**
 * POST /api/trips/bundle/estimate - Calculate fare estimate for a trip bundle
 * 
 * Request body:
 * - tripIds: Array of trip IDs
 * - seats: Number of seats (default 4 for shared rides)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripIds, seats = 4 } = body;

    // Validate input
    if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid trip IDs' },
        { status: 400 }
      );
    }

    // Fetch trips from database
    const trips = await prisma.trip.findMany({
      where: {
        id: { in: tripIds },
      },
      select: {
        id: true,
        title: true,
        departureTime: true,
        returnTime: true,
        originLat: true,
        originLng: true,
        destLat: true,
        destLng: true,
        distance: true,
        zone: true,
        estimatedDays: true,
      },
    });

    if (trips.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No trips found' },
        { status: 404 }
      );
    }

    // Calculate zone and distance for each trip if not set
    const enrichedTrips = trips.map(trip => {
      let zone = trip.zone;
      let distance = trip.distance;
      let estimatedDays = trip.estimatedDays;

      if (!zone || !distance || !estimatedDays) {
        const classification = classifyTrip(
          trip.departureTime,
          trip.returnTime,
          trip.originLat,
          trip.originLng,
          trip.destLat,
          trip.destLng,
          trip.distance || undefined
        );

        zone = zone || classification.zone;
        estimatedDays = estimatedDays || classification.estimatedDays;

        if (!distance) {
          // Calculate using Haversine formula
          distance = calculateHaversineDistance(
            trip.originLat,
            trip.originLng,
            trip.destLat,
            trip.destLng
          );
        }
      }

      const durationHours = calculateTripDurationHours(
        new Date(trip.departureTime),
        new Date(trip.returnTime)
      );

      return {
        id: trip.id,
        title: trip.title,
        zone: zone as any,
        distance: distance || 0,
        durationHours,
        estimatedDays: estimatedDays || 1,
      };
    });

    // Calculate fare estimate
    const fareEstimate = calculateBundleFare(enrichedTrips, seats);

    return NextResponse.json({
      success: true,
      data: {
        tripCount: enrichedTrips.length,
        totalDays: enrichedTrips.reduce((sum, t) => sum + t.estimatedDays, 0),
        totalDistance: enrichedTrips.reduce((sum, t) => sum + t.distance, 0),
        fare: fareEstimate,
        trips: enrichedTrips.map(t => ({
          id: t.id,
          title: t.title,
          zone: t.zone,
          estimatedDays: t.estimatedDays,
        })),
      },
    });
  } catch (error) {
    console.error('Error calculating bundle fare estimate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate fare estimate',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
