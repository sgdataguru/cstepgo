// API Route: /api/navigation/trips/[tripId]/start
// Start navigation for a trip

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const body = await request.json();
    const { driverId, currentLocation } = body;
    
    // Validate input
    if (!driverId || !currentLocation) {
      return NextResponse.json(
        { error: 'Driver ID and current location are required' },
        { status: 400 }
      );
    }
    
    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
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
    
    // Verify driver is assigned to this trip
    if (trip.driverId !== driverId) {
      return NextResponse.json(
        { error: 'Driver not assigned to this trip' },
        { status: 403 }
      );
    }
    
    // Update trip status to IN_PROGRESS
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'IN_PROGRESS',
      },
    });
    
    // Update driver location
    await prisma.driverLocation.upsert({
      where: { driverId: driverId },
      update: {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        heading: currentLocation.heading,
        speed: currentLocation.speed,
        accuracy: currentLocation.accuracy,
        isActive: true,
        lastUpdated: new Date(),
      },
      create: {
        driverId: driverId,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        heading: currentLocation.heading,
        speed: currentLocation.speed,
        accuracy: currentLocation.accuracy,
        isActive: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Navigation started',
      trip: {
        id: updatedTrip.id,
        status: updatedTrip.status,
        origin: {
          name: updatedTrip.originName,
          lat: updatedTrip.originLat,
          lng: updatedTrip.originLng,
        },
        destination: {
          name: updatedTrip.destName,
          lat: updatedTrip.destLat,
          lng: updatedTrip.destLng,
        },
      },
    });
    
  } catch (error) {
    console.error('Start navigation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start navigation',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
