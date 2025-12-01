import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth/adminMiddleware';

const prisma = new PrismaClient();

/**
 * GET /api/admin/drivers/availability
 * Get driver availability overview for admin dashboard
 * 
 * Requires admin authentication via JWT token with ADMIN role
 */
export async function GET(request: NextRequest) {
  // Check admin authentication - only users with ADMIN role can access
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'AVAILABLE', 'BUSY', 'OFFLINE'
    const city = searchParams.get('city');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build where clause
    const whereClause: any = {
      status: 'APPROVED'
    };
    
    if (status) {
      whereClause.availability = status;
    }
    
    if (city) {
      whereClause.homeCity = city;
    }
    
    // Get total count
    const totalCount = await prisma.driver.count({ where: whereClause });
    
    // Get drivers with availability info
    const drivers = await prisma.driver.findMany({
      where: whereClause,
      select: {
        id: true,
        driverId: true,
        fullName: true,
        availability: true,
        currentLocation: true,
        lastActivityAt: true,
        serviceRadiusKm: true,
        acceptsPrivateTrips: true,
        acceptsSharedTrips: true,
        acceptsLongDistance: true,
        homeCity: true,
        rating: true,
        completedTrips: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: [
        { availability: 'asc' },
        { lastActivityAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });
    
    // Get availability statistics
    const stats = await prisma.driver.groupBy({
      by: ['availability'],
      where: { status: 'APPROVED' },
      _count: {
        id: true
      }
    });
    
    const availabilityStats = {
      AVAILABLE: 0,
      BUSY: 0,
      OFFLINE: 0
    };
    
    stats.forEach((stat: { availability: string; _count: { id: number } }) => {
      availabilityStats[stat.availability as keyof typeof availabilityStats] = stat._count.id;
    });
    
    // Get active schedules count
    const activeSchedulesCount = await prisma.driverAvailabilitySchedule.count({
      where: {
        isActive: true,
        endTime: {
          gte: new Date()
        }
      }
    });
    
    // Get recent availability changes
    const recentChanges = await prisma.driverAvailabilityHistory.findMany({
      take: 10,
      orderBy: {
        changedAt: 'desc'
      },
      include: {
        driver: {
          select: {
            driverId: true,
            fullName: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        drivers: drivers.map((driver: typeof drivers[0]) => ({
          id: driver.id,
          driverId: driver.driverId,
          name: driver.fullName || driver.user.name,
          phone: driver.user.phone,
          email: driver.user.email,
          availability: driver.availability,
          currentLocation: driver.currentLocation,
          lastActivityAt: driver.lastActivityAt,
          preferences: {
            serviceRadiusKm: driver.serviceRadiusKm,
            acceptsPrivateTrips: driver.acceptsPrivateTrips,
            acceptsSharedTrips: driver.acceptsSharedTrips,
            acceptsLongDistance: driver.acceptsLongDistance
          },
          homeCity: driver.homeCity,
          rating: driver.rating,
          completedTrips: driver.completedTrips
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        statistics: {
          availability: availabilityStats,
          totalDrivers: totalCount,
          activeSchedules: activeSchedulesCount
        },
        recentChanges: recentChanges.map((change: typeof recentChanges[0]) => ({
          id: change.id,
          driverId: change.driver.driverId,
          driverName: change.driver.fullName || change.driver.user.name,
          previousStatus: change.previousStatus,
          newStatus: change.newStatus,
          changeReason: change.changeReason,
          triggeredBy: change.triggeredBy,
          changedAt: change.changedAt
        }))
      }
    });
    
  } catch (error) {
    console.error('Get driver availability error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve driver availability data' },
      { status: 500 }
    );
  }
}
