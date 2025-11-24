/**
 * API endpoint to broadcast trip offers to eligible drivers
 * POST /api/trips/[id]/broadcast-offer
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: tripId } = params;

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }

    // Verify trip exists and is in publishable state
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        status: true,
        driverId: true,
        title: true,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    if (trip.driverId) {
      return NextResponse.json(
        { error: 'Trip already has a driver assigned' },
        { status: 400 }
      );
    }

    if (trip.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Trip must be in PUBLISHED status to broadcast offers' },
        { status: 400 }
      );
    }

    // Broadcast the trip offer to eligible drivers
    const result = await realtimeBroadcastService.broadcastTripOffer(tripId);

    // Update trip status to OFFERED
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'OFFERED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trip offer broadcast successfully',
      tripId,
      tripTitle: trip.title,
      driversNotified: result.sent,
      eligibleDrivers: result.eligible,
    });
  } catch (error) {
    console.error('Error broadcasting trip offer:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to broadcast trip offer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
