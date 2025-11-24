/**
 * Admin API for monitoring trip status updates
 * Provides analytics and overview of all trip status changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TripStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Simple admin authentication check
async function isAdmin(request: NextRequest): Promise<boolean> {
  const adminToken = request.headers.get('x-admin-token');
  
  // TODO: Implement proper admin JWT token validation
  // For now, check against environment variable
  const validAdminToken = process.env.ADMIN_API_TOKEN;
  
  if (!validAdminToken) {
    // If no admin token is configured, deny access for security
    console.warn('ADMIN_API_TOKEN not configured. Admin access denied.');
    return false;
  }
  
  return adminToken === validAdminToken;
}

/**
 * GET /api/admin/trip-status-monitoring
 * Get overview of trip status updates
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '24h';
    const status = searchParams.get('status') as TripStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');

    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build query filters
    const whereClause: any = {
      createdAt: {
        gte: startTime,
      },
    };

    if (status) {
      whereClause.newStatus = status;
    }

    // Get status updates with pagination
    const [statusUpdates, totalCount] = await Promise.all([
      prisma.tripStatusUpdate.findMany({
        where: whereClause,
        include: {
          trip: {
            select: {
              id: true,
              title: true,
              originName: true,
              destName: true,
              status: true,
            },
          },
          driver: {
            select: {
              id: true,
              driverId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.tripStatusUpdate.count({
        where: whereClause,
      }),
    ]);

    // Get status distribution
    const statusDistribution = await prisma.tripStatusUpdate.groupBy({
      by: ['newStatus'],
      where: {
        createdAt: {
          gte: startTime,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get most active drivers
    const activeDrivers = await prisma.tripStatusUpdate.groupBy({
      by: ['driverId'],
      where: {
        createdAt: {
          gte: startTime,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get driver details for active drivers
    const driverIds = activeDrivers.map((d) => d.driverId);
    const drivers = await prisma.driver.findMany({
      where: {
        id: {
          in: driverIds,
        },
      },
      select: {
        id: true,
        driverId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const activeDriversWithDetails = activeDrivers.map((driver) => {
      const driverDetails = drivers.find((d) => d.id === driver.driverId);
      return {
        driverId: driver.driverId,
        driverCode: driverDetails?.driverId,
        driverName: driverDetails?.user.name,
        updateCount: driver._count.id,
      };
    });

    // Get notification statistics
    const notificationStats = await prisma.tripStatusUpdate.aggregate({
      where: {
        createdAt: {
          gte: startTime,
        },
      },
      _sum: {
        notificationsSent: true,
      },
      _avg: {
        notificationsSent: true,
      },
    });

    // Get status transition patterns (most common transitions)
    const transitions = await prisma.$queryRaw<
      Array<{ previous_status: string; new_status: string; count: bigint }>
    >`
      SELECT 
        previous_status, 
        new_status, 
        COUNT(*) as count
      FROM trip_status_updates
      WHERE created_at >= ${startTime}
      GROUP BY previous_status, new_status
      ORDER BY count DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      data: {
        statusUpdates: statusUpdates.map((update) => ({
          id: update.id,
          tripId: update.tripId,
          tripTitle: update.trip.title,
          tripRoute: `${update.trip.originName} → ${update.trip.destName}`,
          currentTripStatus: update.trip.status,
          driverId: update.driver.driverId,
          driverName: update.driver.user.name,
          previousStatus: update.previousStatus,
          newStatus: update.newStatus,
          notes: update.notes,
          notificationsSent: update.notificationsSent,
          location: update.location,
          ipAddress: update.ipAddress,
          createdAt: update.createdAt,
        })),
        pagination: {
          page,
          perPage,
          totalCount,
          totalPages: Math.ceil(totalCount / perPage),
        },
        statistics: {
          timeRange,
          totalUpdates: totalCount,
          statusDistribution: statusDistribution.map((s) => ({
            status: s.newStatus,
            count: s._count.id,
          })),
          activeDrivers: activeDriversWithDetails,
          notificationStats: {
            totalSent: notificationStats._sum.notificationsSent || 0,
            averagePerUpdate: notificationStats._avg.notificationsSent || 0,
          },
          commonTransitions: transitions.map((t) => ({
            from: t.previous_status,
            to: t.new_status,
            count: Number(t.count),
          })),
        },
      },
    });
  } catch (error) {
    console.error('Trip status monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip status monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/trip-status-monitoring/alerts
 * Get alerts for problematic status updates
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Find trips that are delayed
    const delayedTrips = await prisma.trip.findMany({
      where: {
        status: 'DELAYED',
      },
      include: {
        driver: {
          select: {
            driverId: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
          select: {
            id: true,
            seatsBooked: true,
          },
        },
      },
    });

    // Find trips with no status update in the last hour that should be active
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const staleTrips = await prisma.trip.findMany({
      where: {
        status: {
          in: ['IN_PROGRESS', 'DEPARTED', 'EN_ROUTE', 'IN_TRANSIT'],
        },
        updatedAt: {
          lt: oneHourAgo,
        },
      },
      include: {
        driver: {
          select: {
            driverId: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Find trips with excessive status changes (possible abuse)
    const suspiciousTrips = await prisma.tripStatusUpdate.groupBy({
      by: ['tripId'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 10, // More than 10 updates in an hour
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      alerts: {
        delayedTrips: delayedTrips.map((trip) => ({
          tripId: trip.id,
          title: trip.title,
          driverName: trip.driver?.user.name,
          driverPhone: trip.driver?.user.phone,
          passengerCount: trip.bookings.reduce((sum, b) => sum + b.seatsBooked, 0),
          status: trip.status,
        })),
        staleTrips: staleTrips.map((trip) => ({
          tripId: trip.id,
          title: trip.title,
          driverName: trip.driver?.user.name,
          driverPhone: trip.driver?.user.phone,
          status: trip.status,
          lastUpdate: trip.updatedAt,
        })),
        suspiciousActivity: suspiciousTrips.map((trip) => ({
          tripId: trip.tripId,
          updateCount: trip._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('Alert fetching error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
