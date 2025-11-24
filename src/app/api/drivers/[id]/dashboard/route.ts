import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: driverId } = params;
    
    // Verify driver exists and get basic info
    const driver = await prisma.user.findUnique({
      where: { 
        id: driverId,
        role: 'DRIVER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get dashboard statistics using raw queries (due to Prisma sync issues)
    const [todayTripsResult, todayEarningsResult, activeTripsResult] = await Promise.all([
      // Today's completed trips
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Trip" 
        WHERE driver_id = ${driverId}
        AND status = 'COMPLETED'
        AND updated_at >= ${startOfDay}
        AND updated_at < ${endOfDay}
      `,
      
      // Today's earnings
      prisma.$queryRaw`
        SELECT COALESCE(SUM(base_price + platform_fee), 0) as total
        FROM "Trip" 
        WHERE driver_id = ${driverId}
        AND status = 'COMPLETED'
        AND updated_at >= ${startOfDay}
        AND updated_at < ${endOfDay}
      `,
      
      // Active trips
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Trip" 
        WHERE driver_id = ${driverId}
        AND status IN ('CONFIRMED', 'IN_PROGRESS')
      `
    ]);

    // Extract counts safely
    const todayTrips = Number((todayTripsResult as any)[0]?.count || 0);
    const todayEarnings = Number((todayEarningsResult as any)[0]?.total || 0);
    const activeTrips = Number((activeTripsResult as any)[0]?.count || 0);

    // Calculate driver rating (mock for now - could be from reviews table)
    const rating = 4.8; // Mock rating

    const dashboardData = {
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        memberSince: driver.createdAt
      },
      stats: {
        todayTrips,
        todayEarnings: Math.round(todayEarnings * 0.85), // After 15% platform fee
        activeTrips,
        rating
      },
      summary: {
        totalRevenue: todayEarnings,
        platformFee: Math.round(todayEarnings * 0.15),
        netEarnings: Math.round(todayEarnings * 0.85)
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardData.stats,
      meta: {
        driver: dashboardData.driver,
        summary: dashboardData.summary,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Driver dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// Update driver availability status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: driverId } = params;
    const body = await request.json();
    const { isAvailable, location } = body;

    // Update driver availability in database
    await prisma.$executeRaw`
      UPDATE "User" 
      SET available = ${isAvailable}
      WHERE id = ${driverId} AND role = 'DRIVER'
    `;

    // If location provided, update driver location
    if (location && location.lat && location.lng) {
      // This would typically go to a separate locations table
      console.log(`Driver ${driverId} location updated:`, location);
    }

    return NextResponse.json({
      success: true,
      message: 'Driver availability updated',
      data: {
        driverId,
        isAvailable,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Driver availability update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update availability',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
