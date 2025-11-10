import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/trips - List all trips with optional filters, pagination, and sorting
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const status = searchParams.get('status') || 'PUBLISHED';
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'departureTime';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

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

    // Get total count for pagination
    const totalCount = await prisma.trip.count({ where });

    // Build orderBy based on sortBy parameter
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.basePrice = sortOrder;
    } else if (sortBy === 'departureTime') {
      orderBy.departureTime = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const trips = await prisma.trip.findMany({
      where,
      skip,
      take: limit,
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
      orderBy,
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
        pricePerPerson: Number(trip.basePrice),
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

    // Return transformed trips with pagination info
    return NextResponse.json({
      success: true,
      data: transformedTrips,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + trips.length < totalCount,
      },
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
      totalSeats,
      basePrice,
      vehicleType,
      itinerary,
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

    // For now, use the first user from database as organizer
    // TODO: Replace with authenticated user from session
    const firstUser = await prisma.user.findFirst({
      where: { role: 'DRIVER' },
    });

    if (!firstUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'No driver user found. Please run seed script first.',
        },
        { status: 400 }
      );
    }

    // Get driver profile
    const driverProfile = await prisma.driver.findUnique({
      where: { userId: firstUser.id },
    });

    // Combine date and time
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    const returnDateTime = returnDate && returnTime 
      ? new Date(`${returnDate}T${returnTime}`)
      : new Date(departureDateTime.getTime() + 12 * 60 * 60 * 1000); // Default: 12 hours later

    // Calculate platform fee (10% of base price)
    const platformFee = Number(basePrice) * 0.1;

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        title,
        description: description || `${title} - Comfortable shared ride`,
        organizerId: firstUser.id,
        driverId: driverProfile?.id,
        departureTime: departureDateTime,
        returnTime: returnDateTime,
        timezone: 'Asia/Almaty',
        originName: origin.name,
        originAddress: origin.address,
        originLat: origin.coordinates.lat,
        originLng: origin.coordinates.lng,
        destName: destination.name,
        destAddress: destination.address,
        destLat: destination.coordinates.lat,
        destLng: destination.coordinates.lng,
        totalSeats: Number(totalSeats),
        availableSeats: Number(totalSeats),
        basePrice: Number(basePrice),
        currency: 'KZT',
        platformFee,
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
                    address: origin.address,
                    coordinates: origin.coordinates,
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
                    address: destination.address,
                    coordinates: destination.coordinates,
                  },
                  type: 'transport',
                  description: `Arrival in ${destination.name}`,
                  order: 2,
                },
              ],
            },
          ],
        },
        status: 'DRAFT',
        metadata: {
          vehicleType: vehicleType || 'sedan',
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

    return NextResponse.json({
      success: true,
      data: {
        id: trip.id,
        message: 'Trip created successfully',
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
