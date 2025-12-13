import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/drivers/trips/discover - Get available trips for drivers to accept
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get available trips that:
    // 1. Are PUBLISHED status
    // 2. Don't have a driver assigned yet
    // 3. Have departure time in the future
    // 4. Are SHARED or GROUP type (not private - those need quotes)
    const now = new Date();
    
    const trips = await prisma.trip.findMany({
      where: {
        status: 'PUBLISHED',
        driverId: null,
        departureTime: {
          gt: now
        },
        // Only show trips that are not exclusively private
        OR: [
          { trip_type: 'SHARED' },
          { trip_type: 'GROUP' },
          { trip_type: null } // Legacy trips without type
        ]
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true
          }
        }
      },
      orderBy: [
        { departureTime: 'asc' }
      ],
      take: limit,
      skip: offset
    });
    
    // Get total count for pagination
    const totalCount = await prisma.trip.count({
      where: {
        status: 'PUBLISHED',
        driverId: null,
        departureTime: {
          gt: now
        },
        OR: [
          { trip_type: 'SHARED' },
          { trip_type: 'GROUP' },
          { trip_type: null }
        ]
      }
    });
    
    // Transform trips for driver view
    const availableTrips = trips.map(trip => {
      const basePrice = Number(trip.basePrice) || 0;
      const platformFee = Number(trip.platformFee) || 0;
      const totalRevenue = basePrice + platformFee;
      const estimatedEarnings = Math.round(totalRevenue * 0.85); // Driver gets 85%
      
      // Calculate urgency based on departure time
      const hoursUntilDeparture = (new Date(trip.departureTime).getTime() - now.getTime()) / (1000 * 60 * 60);
      let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (hoursUntilDeparture <= 2) urgency = 'critical';
      else if (hoursUntilDeparture <= 6) urgency = 'high';
      else if (hoursUntilDeparture <= 24) urgency = 'medium';
      
      return {
        id: trip.id,
        title: trip.title,
        description: trip.description,
        tripType: trip.trip_type || 'SHARED',
        departureTime: trip.departureTime,
        returnTime: trip.returnTime,
        origin: {
          name: trip.originName,
          address: trip.originAddress,
          lat: trip.originLat,
          lng: trip.originLng
        },
        destination: {
          name: trip.destName,
          address: trip.destAddress,
          lat: trip.destLat,
          lng: trip.destLng
        },
        totalSeats: trip.totalSeats,
        availableSeats: trip.availableSeats,
        pricing: {
          basePrice,
          platformFee,
          estimatedEarnings,
          currency: trip.currency || 'KZT'
        },
        organizer: trip.organizer,
        urgency,
        hoursUntilDeparture: Math.round(hoursUntilDeparture * 10) / 10,
        zone: trip.zone,
        estimatedDays: trip.estimated_days,
        distance: trip.distance,
        createdAt: trip.createdAt
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        trips: availableTrips,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + trips.length < totalCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching available trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available trips' },
      { status: 500 }
    );
  }
}
