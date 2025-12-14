import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';
import { shouldBroadcastTrip, shouldPublishImmediately } from '@/lib/utils/tripBroadcastUtils';

// GET /api/trips - List all trips with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const status = searchParams.get('status') || 'PUBLISHED';
    const tripType = searchParams.get('tripType'); // 'PRIVATE' or 'SHARED'

    // Build dynamic where clause
    const where: any = {
      status: status as any,
    };

    if (origin) {
      where.originName = {
        contains: origin,
        mode: 'insensitive',
      };
    }

    if (destination) {
      where.destName = {
        contains: destination,
        mode: 'insensitive',
      };
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.departureTime = {
        gte: searchDate,
        lt: nextDay,
      };
    }
    
    // Add trip type filter if specified
    if (tripType && (tripType === 'PRIVATE' || tripType === 'SHARED')) {
      where.tripType = tripType;
    }

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

    // Transform to match frontend Trip type
    const transformedTrips = trips.map((trip: any) => ({
      id: trip.id,
      title: trip.title,
      description: trip.description,
      departureTime: trip.departureTime,
      returnTime: trip.returnTime,
      timezone: trip.timezone,
      status: trip.status.toLowerCase(),
      tripType: trip.tripType, // Include trip type for filtering/display
      location: {
        origin: {
          name: trip.originName,
          address: trip.originAddress,
          coordinates: {
            lat: trip.originLat,
            lng: trip.originLng,
          },
        },
        destination: {
          name: trip.destName,
          address: trip.destAddress,
          coordinates: {
            lat: trip.destLat,
            lng: trip.destLng,
          },
        },
      },
      capacity: {
        total: trip.totalSeats,
        booked: trip.totalSeats - trip.availableSeats,
        available: trip.availableSeats,
      },
      pricing: {
        basePrice: Number(trip.basePrice),
        currency: trip.currency,
        pricePerPerson: trip.tripType === 'SHARED' && trip.pricePerSeat 
          ? Number(trip.pricePerSeat) 
          : Number(trip.basePrice),
        platformFee: Number(trip.platformFee),
        dynamicFactors: [],
        minimumPrice: Number(trip.basePrice) * 0.8,
      },
      organizer: {
        id: trip.organizer.id,
        name: trip.organizer.name,
        role: 'DRIVER' as const,
        rating: trip.driver?.rating || 0,
        photoUrl: trip.organizer.avatar || '/drivers/default-avatar.jpg',
      },
      itinerary: typeof trip.itinerary === 'string' ? JSON.parse(trip.itinerary) : trip.itinerary,
      metadata: trip.metadata ? (typeof trip.metadata === 'string' ? JSON.parse(trip.metadata) : trip.metadata) : {},
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    }));

    // Return transformed trips
    return NextResponse.json({
      success: true,
      data: transformedTrips,
      count: transformedTrips.length,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
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

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      title,
      description,
      origin,
      destination,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      tripType, // 'PRIVATE' or 'SHARED'
      vehicleType,
      totalSeats,
      basePrice,
      itinerary,
      publishImmediately, // For shared trips: publish immediately
    } = body;

    if (!title || !origin || !destination || !departureDate || !departureTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate tripType
    const validTripType = tripType === 'SHARED' ? 'SHARED' : 'PRIVATE';

    // For shared rides, validate that departure is at least 1 hour in the future
    if (validTripType === 'SHARED') {
      const selectedDateTime = new Date(`${departureDate}T${departureTime}`);
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      
      if (selectedDateTime < oneHourFromNow) {
        return NextResponse.json(
          {
            success: false,
            error: 'Shared rides must be scheduled at least 1 hour in advance',
          },
          { status: 400 }
        );
      }
    }

    // Try to find a driver user, but don't fail if not found
    // For now, use the first user from database as organizer
    // TODO: Replace with authenticated user from session
    let firstUser = await prisma.user.findFirst({
      where: { role: 'DRIVER' },
    });

    // If no driver found, create a pending trip without driver assignment
    // In production, this would trigger driver discovery/matching flow
    if (!firstUser) {
      console.warn('No driver user found in database. Creating trip without driver assignment.');
      
      // Try to find any user to use as organizer (for dev/test purposes)
      firstUser = await prisma.user.findFirst();
      
      if (!firstUser) {
        // Still no user? Create a system user for dev purposes only
        // In production, this should trigger proper driver matching/assignment flow
        console.warn('No users found in database. Creating dev system user.');
        const devPassword = process.env.DEV_SYSTEM_USER_PASSWORD || `dev-${Date.now()}-${Math.random()}`;
        firstUser = await prisma.user.create({
          data: {
            email: `system-${Date.now()}@steppergo.local`,
            name: 'System User (Dev)',
            passwordHash: devPassword, // In real scenario, this would be properly hashed
            role: 'PASSENGER',
          },
        });
      }
    }

    // Get driver profile if user is a driver
    let driverProfile = null;
    if (firstUser.role === 'DRIVER') {
      driverProfile = await prisma.driver.findUnique({
        where: { userId: firstUser.id },
      });
    }

    // Combine date and time
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    const returnDateTime = returnDate && returnTime 
      ? new Date(`${returnDate}T${returnTime}`)
      : new Date(departureDateTime.getTime() + 12 * 60 * 60 * 1000); // Default: 12 hours later

    // Set default values based on trip type
    const defaultSeats = totalSeats || (validTripType === 'PRIVATE' ? 4 : 4);
    const defaultPrice = basePrice || 5000;
    
    // Calculate platform fee (10% of base price)
    const platformFee = Number(defaultPrice) * 0.1;

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        title,
        description: description || `${title} - Comfortable ride`,
        organizerId: firstUser.id,
        driverId: driverProfile?.id || null, // Allow null driver for pending trips
        tripType: validTripType,
        departureTime: departureDateTime,
        returnTime: returnDateTime,
        timezone: 'Asia/Almaty',
        originName: origin.name,
        originAddress: origin.address || '',
        originLat: origin.coordinates?.lat || 0,
        originLng: origin.coordinates?.lng || 0,
        destName: destination.name,
        destAddress: destination.address || '',
        destLat: destination.coordinates?.lat || 0,
        destLng: destination.coordinates?.lng || 0,
        totalSeats: Number(defaultSeats),
        availableSeats: Number(defaultSeats),
        basePrice: Number(defaultPrice),
        currency: 'KZT',
        platformFee,
        pricePerSeat: validTripType === 'SHARED' ? Number(defaultPrice) : null,
        itinerary: itinerary || {
          version: '1.0',
          days: [
            {
              dayNumber: 1,
              date: departureDateTime,
              title: 'Travel Day',
              activities: [
                {
                  id: 'activity-1',
                  startTime: departureTime,
                  location: {
                    name: origin.name,
                    address: origin.address || '',
                    coordinates: origin.coordinates || { lat: 0, lng: 0 },
                  },
                  type: 'transport',
                  description: `Departure from ${origin.name}`,
                  order: 1,
                },
                {
                  id: 'activity-2',
                  startTime: returnTime || departureTime,
                  location: {
                    name: destination.name,
                    address: destination.address || '',
                    coordinates: destination.coordinates || { lat: 0, lng: 0 },
                  },
                  type: 'transport',
                  description: `Arrival in ${destination.name}`,
                  order: 2,
                },
              ],
            },
          ],
        },
        // Auto-publish private trips immediately; shared trips only if flag set
        status: shouldPublishImmediately(validTripType, publishImmediately) ? 'PUBLISHED' : 'DRAFT',
        publishedAt: shouldPublishImmediately(validTripType, publishImmediately) ? new Date() : null,
        metadata: {
          vehicleType: vehicleType || 'sedan',
          createdVia: 'booking-flow',
          tripType: validTripType,
        },
      },
      include: {
        organizer: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    // Build response message based on trip type
    let message = 'Trip created successfully';
    if (validTripType === 'SHARED' && publishImmediately) {
      message = 'Shared ride created and published! It is now visible in the trips listing.';
    } else if (!driverProfile) {
      message = 'Trip created. Driver assignment pending.';
    }

    // Auto-broadcast private trip offers to eligible drivers in realtime
    // Only broadcast if: trip is PRIVATE, PUBLISHED, and has no driver assigned
    if (shouldBroadcastTrip(trip)) {
      try {
        const broadcastResult = await realtimeBroadcastService.broadcastTripOffer(trip.id);
        console.log(`Private trip ${trip.id} broadcast to ${broadcastResult.sent} drivers`);
        
        // Update trip status to OFFERED after successful broadcast
        await prisma.trip.update({
          where: { id: trip.id },
          data: { status: 'OFFERED' },
        });
        
        message = `${message} Broadcast to ${broadcastResult.sent} nearby drivers.`;
      } catch (broadcastError) {
        // Log error but don't fail the trip creation
        console.error('Failed to broadcast private trip offer:', broadcastError);
        // Still inform user that trip was created even if broadcast failed
        message = `${message} Note: Driver notification is in progress.`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: trip.id,
        tripType: validTripType,
        status: trip.status,
        pricePerSeat: trip.pricePerSeat ? Number(trip.pricePerSeat) : null,
        message,
      },
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create trip',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
