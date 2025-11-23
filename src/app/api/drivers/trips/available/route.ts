import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schema for trip discovery filters
const tripDiscoveryFiltersSchema = z.object({
  radius: z.number().min(1).max(50).default(10), // kilometers
  minFare: z.number().min(0).optional(),
  maxFare: z.number().min(0).optional(),
  sortBy: z.enum(['distance', 'fare', 'time']).default('distance'),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0)
});

// Get driver from session 
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { 
      user: true
    }
  });
  
  if (!driver || driver.user.role !== 'DRIVER') {
    throw new Error('Driver not found');
  }
  
  if (driver.status !== 'APPROVED') {
    throw new Error('Driver not approved');
  }
  
  return driver;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate estimated earnings (driver keeps 85% after 15% platform fee)
function calculateEstimatedEarnings(basePrice: number, platformFee: number): number {
  const totalFare = basePrice + platformFee;
  return totalFare * 0.85; // Driver gets 85%
}

// GET /api/drivers/trips/available - Get available trips for driver
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = tripDiscoveryFiltersSchema.parse({
      radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : 10,
      minFare: searchParams.get('minFare') ? Number(searchParams.get('minFare')) : undefined,
      maxFare: searchParams.get('maxFare') ? Number(searchParams.get('maxFare')) : undefined,
      sortBy: searchParams.get('sortBy') || 'distance',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0
    });
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // For now, use a default driver location (Almaty center)
    // TODO: Implement real-time driver location tracking
    const driverLat = 43.2381; // Almaty latitude
    const driverLng = 76.9452; // Almaty longitude
    
    // Build filter conditions
    const whereConditions: any = {
      status: 'PUBLISHED',
      driverId: null, // Only trips without assigned driver
      departureTime: {
        gte: new Date(), // Only future trips
      },
      availableSeats: {
        gt: 0 // Only trips with available seats
      }
    };
    
    // Add fare filters
    if (filters.minFare !== undefined || filters.maxFare !== undefined) {
      whereConditions.basePrice = {};
      if (filters.minFare !== undefined) {
        whereConditions.basePrice.gte = filters.minFare;
      }
      if (filters.maxFare !== undefined) {
        whereConditions.basePrice.lte = filters.maxFare;
      }
    }
    
    // Get all trips matching basic criteria
    const allTrips = await prisma.trip.findMany({
      where: whereConditions,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          select: {
            seatsBooked: true,
            userId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Filter trips by distance and calculate additional data
    const tripsWithDistance = allTrips
      .map(trip => {
        const distance = calculateDistance(
          driverLat,
          driverLng,
          trip.originLat,
          trip.originLng
        );
        
        const estimatedEarnings = calculateEstimatedEarnings(
          Number(trip.basePrice),
          Number(trip.platformFee)
        );
        
        const totalBookedSeats = trip.bookings.reduce(
          (sum: number, booking: any) => sum + booking.seatsBooked, 
          0
        );
        
        const actualAvailableSeats = trip.totalSeats - totalBookedSeats;
        
        // Calculate estimated duration (roughly 40 km/h average in city)
        const estimatedDuration = Math.round(distance * 1.5); // minutes
        
        return {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          departureTime: trip.departureTime,
          returnTime: trip.returnTime,
          originName: trip.originName,
          originAddress: trip.originAddress,
          destName: trip.destName,
          destAddress: trip.destAddress,
          basePrice: trip.basePrice,
          platformFee: trip.platformFee,
          totalSeats: trip.totalSeats,
          availableSeats: actualAvailableSeats,
          organizer: trip.organizer,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          estimatedEarnings: Math.round(estimatedEarnings),
          estimatedDuration,
          passengers: trip.bookings.length,
          urgency: 'normal' // Default urgency
        };
      })
      .filter(trip => trip.distance <= filters.radius) // Only trips within radius
      .filter(trip => trip.availableSeats > 0); // Only trips with available seats
    
    // Sort trips based on sortBy parameter
    let sortedTrips = [...tripsWithDistance];
    switch (filters.sortBy) {
      case 'distance':
        sortedTrips.sort((a, b) => a.distance - b.distance);
        break;
      case 'fare':
        sortedTrips.sort((a, b) => b.estimatedEarnings - a.estimatedEarnings);
        break;
      case 'time':
        sortedTrips.sort((a, b) => 
          new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        );
        break;
    }
    
    // Apply pagination
    const paginatedTrips = sortedTrips.slice(filters.offset, filters.offset + filters.limit);
    
    return NextResponse.json({
      success: true,
      data: {
        trips: paginatedTrips,
        pagination: {
          total: tripsWithDistance.length,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: (filters.offset + filters.limit) < tripsWithDistance.length
        },
        driverLocation: {
          latitude: driverLat,
          longitude: driverLng,
          isDefault: true // Indicates this is a default location
        },
        filters: filters
      }
    });
    
  } catch (error) {
    console.error('Trip discovery error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid filter parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Driver not found' || error.message === 'Driver not approved') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve available trips' },
      { status: 500 }
    );
  }
}

// Helper endpoint to get available filters
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      filters: {
        radius: {
          type: 'number',
          min: 1,
          max: 50,
          default: 10,
          unit: 'km'
        },
        sortBy: {
          type: 'enum',
          options: ['distance', 'fare', 'time'],
          default: 'distance'
        },
        fare: {
          type: 'range',
          min: 0,
          max: 50000,
          currency: 'KZT'
        }
      },
      examples: {
        nearbyTrips: '?radius=5&sortBy=distance',
        highPayingTrips: '?minFare=2000&sortBy=fare',
        soonTrips: '?sortBy=time'
      }
    }
  });
}
