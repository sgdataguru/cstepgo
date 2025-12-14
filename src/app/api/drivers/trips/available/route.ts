import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, TripType } from '@prisma/client';
import { getDriverEarningsRate } from '@/lib/services/platformSettingsService';
import { prisma } from '@/lib/prisma';
import { authenticateDriver } from '@/lib/auth/driverAuth';


// Validation schema for trip discovery filters
const tripDiscoveryFiltersSchema = z.object({
  radius: z.number().min(1).max(50).default(10), // kilometers
  minFare: z.number().min(0).optional(),
  maxFare: z.number().min(0).optional(),
  tripTypes: z.array(z.enum(['PRIVATE', 'SHARED'])).optional(), // Filter by trip type
  sortBy: z.enum(['distance', 'fare', 'time']).default('distance'),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0)
});

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

// Note: Driver earnings rate is now fetched from platformSettingsService via getDriverEarningsRate()

// GET /api/drivers/trips/available - Get available trips for driver
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = tripDiscoveryFiltersSchema.parse({
      radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : 10,
      minFare: searchParams.get('minFare') ? Number(searchParams.get('minFare')) : undefined,
      maxFare: searchParams.get('maxFare') ? Number(searchParams.get('maxFare')) : undefined,
      tripTypes: searchParams.get('tripTypes') ? searchParams.get('tripTypes')!.split(',') as ('PRIVATE' | 'SHARED')[] : undefined,
      sortBy: searchParams.get('sortBy') || 'distance',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0
    });
    
    // Authenticate driver using secure token validation
    const driver = await authenticateDriver(request);
    
    // Check driver preferences for trip types
    const driverAcceptsPrivate = driver.acceptsPrivateTrips;
    const driverAcceptsShared = driver.acceptsSharedTrips;
    
    // Filter trip types based on driver preferences and request filters
    let allowedTripTypes: TripType[] = [];
    if (filters.tripTypes && filters.tripTypes.length > 0) {
      // Use requested trip types, but respect driver preferences
      if (filters.tripTypes.includes('PRIVATE') && driverAcceptsPrivate) {
        allowedTripTypes.push(TripType.PRIVATE);
      }
      if (filters.tripTypes.includes('SHARED') && driverAcceptsShared) {
        allowedTripTypes.push(TripType.SHARED);
      }
    } else {
      // No filter specified, use driver preferences
      if (driverAcceptsPrivate) allowedTripTypes.push(TripType.PRIVATE);
      if (driverAcceptsShared) allowedTripTypes.push(TripType.SHARED);
    }
    
    // If driver doesn't accept any trip types, return empty result
    if (allowedTripTypes.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          trips: [],
          pagination: {
            total: 0,
            limit: filters.limit,
            offset: filters.offset,
            hasMore: false
          },
          driverLocation: {
            latitude: 43.2381,
            longitude: 76.9452,
            isDefault: true
          },
          filters: filters,
          message: 'No trip types match driver preferences'
        }
      });
    }
    
    // For now, use a default driver location (Almaty center)
    // TODO: Implement real-time driver location tracking
    const driverLat = 43.2381; // Almaty latitude
    const driverLng = 76.9452; // Almaty longitude
    
    // Build filter conditions
    const whereConditions: any = {
      status: 'PUBLISHED',
      driverId: null, // Only trips without assigned driver
      tripType: {
        in: allowedTripTypes // Filter by allowed trip types
      },
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
    
    // Get the driver earnings rate once for all calculations
    const driverEarningsRate = await getDriverEarningsRate();
    
    // Filter trips by distance and calculate additional data
    const tripsWithDistance = allTrips
      .map((trip: any) => {
        const distance = calculateDistance(
          driverLat,
          driverLng,
          trip.originLat,
          trip.originLng
        );
        
        const totalFare = Number(trip.basePrice) + Number(trip.platformFee);
        const estimatedEarnings = totalFare * driverEarningsRate;
        
        const totalBookedSeats = trip.bookings.reduce(
          (sum: number, booking: any) => sum + booking.seatsBooked, 
          0
        );
        
        const actualAvailableSeats = trip.totalSeats - totalBookedSeats;
        
        // Calculate per-seat price for shared rides
        // Guard against division by zero
        const pricePerSeat = trip.tripType === 'SHARED' && trip.pricePerSeat 
          ? Number(trip.pricePerSeat)
          : trip.totalSeats > 0 
            ? Number(trip.basePrice) / trip.totalSeats
            : Number(trip.basePrice); // Fallback if totalSeats is 0
        
        // Calculate estimated duration (roughly 40 km/h average in city)
        const estimatedDuration = Math.round(distance * 1.5); // minutes
        
        return {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          tripType: trip.tripType, // Include trip type
          departureTime: trip.departureTime,
          returnTime: trip.returnTime,
          originName: trip.originName,
          originAddress: trip.originAddress,
          destName: trip.destName,
          destAddress: trip.destAddress,
          basePrice: trip.basePrice,
          pricePerSeat: pricePerSeat, // Add per-seat price
          platformFee: trip.platformFee,
          totalSeats: trip.totalSeats,
          availableSeats: actualAvailableSeats,
          bookedSeats: totalBookedSeats, // Add booked seats count
          organizer: trip.organizer,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          estimatedEarnings: Math.round(estimatedEarnings),
          estimatedDuration,
          passengers: trip.bookings.length,
          urgency: 'normal', // Default urgency
          tenantId: trip.tenantId, // Include tenant context
        };
      })
      .filter((trip: any) => trip.distance <= filters.radius) // Only trips within radius
      .filter((trip: any) => trip.availableSeats > 0); // Only trips with available seats
    
    // Sort trips based on sortBy parameter
    let sortedTrips = [...tripsWithDistance];
    switch (filters.sortBy) {
      case 'distance':
        sortedTrips.sort((a: any, b: any) => a.distance - b.distance);
        break;
      case 'fare':
        sortedTrips.sort((a: any, b: any) => b.estimatedEarnings - a.estimatedEarnings);
        break;
      case 'time':
        sortedTrips.sort((a: any, b: any) => 
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
