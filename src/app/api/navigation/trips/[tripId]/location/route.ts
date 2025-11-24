// API Route: /api/navigation/trips/[tripId]/location
// Update driver location during active navigation

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateETA, calculateDistance } from '@/lib/navigation/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const body = await request.json();
    const { driverId, location } = body;
    
    // Validate input
    if (!driverId || !location) {
      return NextResponse.json(
        { error: 'Driver ID and location are required' },
        { status: 400 }
      );
    }
    
    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    // Verify driver is assigned to this trip
    if (trip.driverId !== driverId) {
      return NextResponse.json(
        { error: 'Driver not assigned to this trip' },
        { status: 403 }
      );
    }
    
    // Update driver location
    const updatedLocation = await prisma.driverLocation.upsert({
      where: { driverId: driverId },
      update: {
        latitude: location.lat,
        longitude: location.lng,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        lastUpdated: new Date(),
      },
      create: {
        driverId: driverId,
        latitude: location.lat,
        longitude: location.lng,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        isActive: true,
      },
    });
    
    // Calculate ETA to destination
    const destination = {
      lat: trip.destLat,
      lng: trip.destLng,
    };
    
    const currentLocation = {
      lat: location.lat,
      lng: location.lng,
    };
    
    const eta = calculateETA(
      currentLocation,
      destination,
      location.speed || 50
    );
    
    // Check if driver is near origin (for pickup) or destination (for dropoff)
    const distanceToOrigin = calculateDistance(
      currentLocation,
      { lat: trip.originLat, lng: trip.originLng }
    );
    
    const distanceToDestination = calculateDistance(
      currentLocation,
      destination
    );
    
    let milestone = null;
    
    // Within 500m of origin - approaching pickup
    if (distanceToOrigin <= 500 && trip.status === 'IN_PROGRESS') {
      milestone = 'approaching_pickup';
    }
    
    // Within 1km of destination - approaching dropoff
    if (distanceToDestination <= 1000 && trip.status === 'IN_PROGRESS') {
      milestone = 'approaching_destination';
    }
    
    // Within 100m of destination - arrived
    if (distanceToDestination <= 100 && trip.status === 'IN_PROGRESS') {
      milestone = 'arrived';
    }
    
    return NextResponse.json({
      success: true,
      location: {
        lat: Number(updatedLocation.latitude),
        lng: Number(updatedLocation.longitude),
        heading: updatedLocation.heading ? Number(updatedLocation.heading) : undefined,
        speed: updatedLocation.speed ? Number(updatedLocation.speed) : undefined,
        accuracy: updatedLocation.accuracy ? Number(updatedLocation.accuracy) : undefined,
        timestamp: updatedLocation.lastUpdated,
      },
      eta: {
        estimatedArrival: eta.estimatedArrival,
        remainingDistance: eta.remainingDistance,
        remainingDuration: eta.remainingDuration,
        currentSpeed: eta.currentSpeed,
      },
      distances: {
        toOrigin: distanceToOrigin,
        toDestination: distanceToDestination,
      },
      milestone,
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update location',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// GET - Get current driver location for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    // Get trip with driver location
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
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
      },
    });
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    const driverLocation = trip.driver?.user.driverLocation;
    
    if (!driverLocation) {
      return NextResponse.json(
        { error: 'Driver location not available' },
        { status: 404 }
      );
    }
    
    // Calculate ETA
    const currentLocation = {
      lat: Number(driverLocation.latitude),
      lng: Number(driverLocation.longitude),
    };
    
    const destination = {
      lat: trip.destLat,
      lng: trip.destLng,
    };
    
    const eta = calculateETA(
      currentLocation,
      destination,
      driverLocation.speed ? Number(driverLocation.speed) : 50
    );
    
    return NextResponse.json({
      success: true,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        heading: driverLocation.heading ? Number(driverLocation.heading) : undefined,
        speed: driverLocation.speed ? Number(driverLocation.speed) : undefined,
        accuracy: driverLocation.accuracy ? Number(driverLocation.accuracy) : undefined,
        timestamp: driverLocation.lastUpdated,
      },
      eta: {
        estimatedArrival: eta.estimatedArrival,
        remainingDistance: eta.remainingDistance,
        remainingDuration: eta.remainingDuration,
        currentSpeed: eta.currentSpeed,
      },
    });
    
  } catch (error) {
    console.error('Get location error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get location',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
