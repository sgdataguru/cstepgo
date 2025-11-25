/**
 * Passenger Track Driver API
 * Provides real-time tracking information for active bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { calculateETA } from '@/lib/utils/location';

/**
 * GET /api/passengers/bookings/:bookingId/track
 * Get tracking information for an active booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bookingId } = params;
    const userId = authResult.user.id;

    // Fetch booking with full trip and driver details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            driver: {
              include: {
                user: {
                  include: {
                    driverLocation: true,
                  },
                },
              },
            },
            organizer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify booking ownership - user must be the passenger
    if (booking.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only track your own bookings' },
        { status: 403 }
      );
    }

    // Check if booking is in a trackable state
    const trackableStatuses = ['CONFIRMED', 'PENDING'];
    if (!trackableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { 
          error: 'Booking is not in a trackable state',
          status: booking.status,
          canTrack: false,
        },
        { status: 400 }
      );
    }

    // Check if trip has started or is about to start (within 2 hours)
    const tripDepartureTime = new Date(booking.trip.departureTime);
    const now = new Date();
    const hoursUntilDeparture = (tripDepartureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Only allow tracking if trip is within 2 hours of departure or has started
    const canTrack = hoursUntilDeparture <= 2 && booking.trip.status !== 'COMPLETED' && booking.trip.status !== 'CANCELLED';

    if (!canTrack) {
      return NextResponse.json(
        {
          canTrack: false,
          message: hoursUntilDeparture > 2 
            ? 'Tracking will be available 2 hours before departure'
            : 'Trip is no longer active',
          hoursUntilDeparture: Math.max(0, hoursUntilDeparture),
        },
        { status: 200 }
      );
    }

    // Get driver location if available
    let driverLocation = null;
    let driverInfo = null;
    let eta = null;

    if (booking.trip.driver) {
      const driver = booking.trip.driver;
      driverInfo = {
        id: driver.id,
        name: driver.user.name,
        phone: driver.user.phone,
        avatar: driver.user.avatar,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehicleMake: driver.vehicleMake,
        vehicleColor: driver.vehicleColor,
        licensePlate: driver.licensePlate,
        rating: Number(driver.rating),
        reviewCount: driver.reviewCount,
      };

      if (driver.user.driverLocation) {
        const location = driver.user.driverLocation;
        driverLocation = {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy,
          lastUpdated: location.lastUpdated.toISOString(),
        };

        // Calculate ETA to pickup location
        eta = calculateETA(
          Number(location.latitude),
          Number(location.longitude),
          booking.trip.originLat,
          booking.trip.originLng,
          location.speed ? Number(location.speed) : 0
        );
      }
    }

    // Prepare tracking response
    const trackingData = {
      canTrack: true,
      booking: {
        id: booking.id,
        status: booking.status,
        seatsBooked: booking.seatsBooked,
        confirmedAt: booking.confirmedAt?.toISOString(),
      },
      trip: {
        id: booking.trip.id,
        title: booking.trip.title,
        status: booking.trip.status,
        tripType: booking.trip.tripType,
        departureTime: booking.trip.departureTime.toISOString(),
        returnTime: booking.trip.returnTime.toISOString(),
        origin: {
          name: booking.trip.originName,
          address: booking.trip.originAddress,
          latitude: booking.trip.originLat,
          longitude: booking.trip.originLng,
        },
        destination: {
          name: booking.trip.destName,
          address: booking.trip.destAddress,
          latitude: booking.trip.destLat,
          longitude: booking.trip.destLng,
        },
      },
      driver: driverInfo,
      driverLocation,
      eta,
      tenantId: booking.trip.tenantId || null,
    };

    return NextResponse.json(trackingData, { status: 200 });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
