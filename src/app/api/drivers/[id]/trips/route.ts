import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/drivers/[id]/trips
 * Fetch driver's upcoming trips
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get('status') || 'upcoming'; // 'upcoming', 'completed', 'all'
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate limit
    const validLimit = Math.min(50, Math.max(1, limit));

    // Build where clause based on status
    let whereClause: any = {
      driverId: id,
    };

    if (status === 'upcoming') {
      whereClause.status = { in: ['PUBLISHED', 'FULL'] };
      whereClause.departureTime = { gte: new Date() };
    } else if (status === 'completed') {
      whereClause.status = 'COMPLETED';
    }

    // Fetch trips
    const trips = await prisma.trip.findMany({
      where: whereClause,
      orderBy: { departureTime: status === 'completed' ? 'desc' : 'asc' },
      take: validLimit,
      select: {
        id: true,
        title: true,
        description: true,
        departureTime: true,
        returnTime: true,
        originName: true,
        originAddress: true,
        originLat: true,
        originLng: true,
        destName: true,
        destAddress: true,
        destLat: true,
        destLng: true,
        totalSeats: true,
        availableSeats: true,
        basePrice: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    // Count total trips for statistics
    const totalTrips = await prisma.trip.count({
      where: whereClause,
    });

    // Format response
    const response = {
      trips: trips.map((trip: any) => ({
        id: trip.id,
        title: trip.title,
        description: trip.description,
        fromLocation: {
          name: trip.originName,
          address: trip.originAddress,
          coordinates: {
            lat: trip.originLat,
            lng: trip.originLng,
          },
        },
        toLocation: {
          name: trip.destName,
          address: trip.destAddress,
          coordinates: {
            lat: trip.destLat,
            lng: trip.destLng,
          },
        },
        schedule: {
          departureDate: trip.departureTime,
          returnDate: trip.returnTime,
        },
        pricing: {
          basePrice: Number(trip.basePrice),
          currency: trip.currency,
        },
        capacity: {
          totalSeats: trip.totalSeats,
          availableSeats: trip.availableSeats,
          bookedSeats: trip.totalSeats - trip.availableSeats,
        },
        status: trip.status,
        createdAt: trip.createdAt,
      })),
      total: totalTrips,
      showing: trips.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
