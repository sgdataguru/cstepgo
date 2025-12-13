import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDriverEarningsRate } from '@/lib/services/platformSettingsService';


// Get driver from session
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const driver = await getDriverFromRequest(request);
    
    // Ensure the driver is accessing their own earnings
    if (driver.id !== params.driverId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all completed trips
    const completedTrips = await prisma.trip.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED'
      },
      orderBy: {
        departureTime: 'desc'
      },
      select: {
        id: true,
        title: true,
        departureTime: true,
        returnTime: true,
        originName: true,
        destName: true,
        basePrice: true,
        platformFee: true,
        status: true
      }
    });

    // Get the configured driver earnings rate
    const driverEarningsRate = await getDriverEarningsRate();

    // Calculate earnings using configured rate
    const trips = completedTrips.map((trip: typeof completedTrips[0]) => {
      const totalFare = Number(trip.basePrice) + Number(trip.platformFee);
      const driverEarnings = totalFare * driverEarningsRate;
      
      return {
        ...trip,
        earnings: Math.round(driverEarnings)
      };
    });

    // Get payouts
    const payouts = await prisma.payout.findMany({
      where: {
        driverId: driver.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate summary
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTrips = trips.filter((trip: any) => new Date(trip.departureTime) >= today);
    const weekTrips = trips.filter((trip: any) => new Date(trip.departureTime) >= startOfWeek);
    const monthTrips = trips.filter((trip: any) => new Date(trip.departureTime) >= startOfMonth);

    const summary = {
      today: todayTrips.reduce((sum: number, trip: any) => sum + trip.earnings, 0),
      thisWeek: weekTrips.reduce((sum: number, trip: any) => sum + trip.earnings, 0),
      thisMonth: monthTrips.reduce((sum: number, trip: any) => sum + trip.earnings, 0),
      allTime: trips.reduce((sum: number, trip: any) => sum + trip.earnings, 0),
      pendingPayout: payouts
        .filter((p: any) => p.status === 'PENDING' || p.status === 'PROCESSING')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      currency: 'KZT'
    };

    // Generate chart data for the last 30 days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTrips = trips.filter((trip: any) => {
        const tripDate = new Date(trip.departureTime);
        return tripDate.toISOString().split('T')[0] === dateStr;
      });
      
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        earnings: dayTrips.reduce((sum: number, trip: any) => sum + trip.earnings, 0)
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        trips: trips.slice(0, 20), // Return last 20 trips
        payouts,
        summary,
        chartData
      }
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    
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
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve earnings data' },
      { status: 500 }
    );
  }
}
