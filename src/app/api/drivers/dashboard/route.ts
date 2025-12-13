import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDriverEarningsRate, getPlatformFeeRate } from '@/lib/services/platformSettingsService';


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
  
  return driver;
}

// GET /api/drivers/dashboard - Get comprehensive driver dashboard data
export async function GET(request: NextRequest) {
  try {
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Get current active trip (if any)
    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        status: 'IN_PROGRESS'
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    
    // Get upcoming accepted trips
    const upcomingTrips = await prisma.trip.findMany({
      where: {
        driverId: driver.id,
        status: 'IN_PROGRESS',
        departureTime: {
          gt: new Date()
        }
      },
      orderBy: {
        departureTime: 'asc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        departureTime: true,
        originName: true,
        destName: true,
        totalSeats: true,
        basePrice: true,
        platformFee: true,
        status: true
      }
    });
    
    // Get recent completed trips (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTrips = await prisma.trip.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        departureTime: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        departureTime: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        departureTime: true,
        returnTime: true,
        basePrice: true,
        platformFee: true,
        status: true
      }
    });
    
    // Calculate earnings for today and this week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const todayEarnings = await prisma.trip.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        departureTime: {
          gte: today
        }
      },
      select: {
        basePrice: true,
        platformFee: true
      }
    });
    
    const weekEarnings = await prisma.trip.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        departureTime: {
          gte: startOfWeek
        }
      },
      select: {
        basePrice: true,
        platformFee: true
      }
    });
    
    // Get the configured platform fee and driver earnings rates
    const platformFeeRate = await getPlatformFeeRate();
    const driverEarningsRate = await getDriverEarningsRate();
    
    // Calculate total earnings using configured rate
    const calculateEarnings = (trips: { basePrice: any; platformFee: any }[]) => {
      return trips.reduce((total: any, trip: any) => {
        const tripTotal = Number(trip.basePrice) + Number(trip.platformFee);
        return total + (tripTotal * driverEarningsRate);
      }, 0);
    };
    
    const todayTotal = Math.round(calculateEarnings(todayEarnings));
    const weekTotal = Math.round(calculateEarnings(weekEarnings));
    
    // Get driver's current location
    let currentLocation = null;
    try {
      const locationResult = await prisma.$queryRaw`
        SELECT 
          latitude,
          longitude,
          heading,
          speed,
          updated_at
        FROM driver_locations 
        WHERE driver_id = ${driver.userId}
      ` as any[];
      
      if (locationResult.length > 0) {
        const location = locationResult[0];
        currentLocation = {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          heading: Number(location.heading),
          speed: Number(location.speed),
          lastUpdated: location.updated_at
        };
      }
    } catch (locationError) {
      console.warn('Could not fetch driver location:', locationError);
    }
    
    // Get trip statistics
    const tripStats = await prisma.trip.aggregate({
      where: {
        driverId: driver.id,
        status: 'COMPLETED'
      },
      _count: {
        id: true
      }
    });
    
    // Calculate active trip details if available
    let activeTripDetails = null;
    if (activeTrip) {
      const totalBookedSeats = activeTrip.bookings.reduce(
        (sum: number, booking: any) => sum + booking.seatsBooked,
        0
      );
      
      const estimatedEarnings = (Number(activeTrip.basePrice) + Number(activeTrip.platformFee)) * driverEarningsRate;
      
      const now = new Date();
      const departureTime = new Date(activeTrip.departureTime);
      const minutesUntilDeparture = Math.ceil((departureTime.getTime() - now.getTime()) / (1000 * 60));
      
      activeTripDetails = {
        trip: {
          id: activeTrip.id,
          title: activeTrip.title,
          description: activeTrip.description,
          status: activeTrip.status,
          departureTime: activeTrip.departureTime,
          returnTime: activeTrip.returnTime,
          originName: activeTrip.originName,
          originAddress: activeTrip.originAddress,
          destName: activeTrip.destName,
          destAddress: activeTrip.destAddress,
          totalSeats: activeTrip.totalSeats,
          bookedSeats: totalBookedSeats,
          estimatedEarnings: Math.round(estimatedEarnings),
          organizer: activeTrip.organizer,
          minutesUntilDeparture: minutesUntilDeparture > 0 ? minutesUntilDeparture : null
        },
        passengers: activeTrip.bookings.map((booking: any) => ({
          id: booking.id,
          seatsBooked: booking.seatsBooked,
          user: booking.user
        }))
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        driver: {
          id: driver.id,
          availability: driver.availability,
          vehicleType: driver.vehicleType,
          vehicleMake: driver.vehicleMake,
          vehicleModel: driver.vehicleModel,
          licensePlate: driver.licensePlate,
          rating: driver.rating,
          totalTrips: tripStats._count.id || 0
        },
        activeTrip: activeTripDetails,
        upcomingTrips: upcomingTrips.map((trip: any) => ({
          ...trip,
          estimatedEarnings: Math.round((Number(trip.basePrice) + Number(trip.platformFee)) * driverEarningsRate)
        })),
        recentTrips: recentTrips.map((trip: any) => ({
          ...trip,
          actualEarnings: Math.round((Number(trip.basePrice) + Number(trip.platformFee)) * driverEarningsRate)
        })),
        earnings: {
          today: todayTotal,
          thisWeek: weekTotal,
          currency: 'KZT' // Kazakhstan Tenge
        },
        location: currentLocation,
        platformFeeRate, // Include platform fee rate for client-side calculations
        driverEarningsRate, // Include driver earnings rate for client-side calculations
        summary: {
          isOnline: driver.availability === 'AVAILABLE',
          hasActiveTrip: !!activeTrip,
          upcomingTripsCount: upcomingTrips.length,
          completedTripsToday: todayEarnings.length,
          completedTripsThisWeek: weekEarnings.length
        }
      }
    });
    
  } catch (error) {
    console.error('Dashboard data error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Driver not found') {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    );
  }
}
