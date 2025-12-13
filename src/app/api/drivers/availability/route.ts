import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


// Validation schema for availability update
const availabilityUpdateSchema = z.object({
  availability: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']),
  currentLocation: z.string().max(100).optional(),
  serviceRadiusKm: z.number().min(5).max(100).optional(),
  acceptsPrivateTrips: z.boolean().optional(),
  acceptsSharedTrips: z.boolean().optional(),
  acceptsLongDistance: z.boolean().optional(),
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
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

// Get IP address from request
function getIpAddress(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         null;
}

// GET - Get driver availability status and preferences
export async function GET(request: NextRequest) {
  try {
    const driver = await getDriverFromRequest(request);
    
    // Get current availability schedules
    const currentSchedules = await prisma.driverAvailabilitySchedule.findMany({
      where: {
        driverId: driver.id,
        isActive: true,
        endTime: {
          gte: new Date()
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 10
    });
    
    // Get recent availability history
    const recentHistory = await prisma.driverAvailabilityHistory.findMany({
      where: {
        driverId: driver.id
      },
      orderBy: {
        changedAt: 'desc'
      },
      take: 5
    });
    
    return NextResponse.json({
      success: true,
      data: {
        currentStatus: {
          availability: driver.availability,
          currentLocation: driver.currentLocation,
          lastActivityAt: driver.lastActivityAt,
        },
        preferences: {
          serviceRadiusKm: driver.serviceRadiusKm,
          acceptsPrivateTrips: driver.acceptsPrivateTrips,
          acceptsSharedTrips: driver.acceptsSharedTrips,
          acceptsLongDistance: driver.acceptsLongDistance,
          autoOfflineMinutes: driver.autoOfflineMinutes,
        },
        schedules: currentSchedules.map((schedule: typeof currentSchedules[0]) => ({
          id: schedule.id,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          scheduleType: schedule.scheduleType,
          reason: schedule.reason,
          isRecurring: schedule.isRecurring,
          recurringPattern: schedule.recurringPattern,
        })),
        recentHistory: recentHistory.map((history: typeof recentHistory[0]) => ({
          id: history.id,
          previousStatus: history.previousStatus,
          newStatus: history.newStatus,
          changeReason: history.changeReason,
          triggeredBy: history.triggeredBy,
          changedAt: history.changedAt,
        })),
      }
    });
    
  } catch (error) {
    console.error('Get availability error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve availability status' },
      { status: 500 }
    );
  }
}

// PUT - Update driver availability status and preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = availabilityUpdateSchema.parse(body);
    
    const driver = await getDriverFromRequest(request);
    const ipAddress = getIpAddress(request);
    const userAgent = request.headers.get('user-agent');
    
    // Check if driver can update availability
    if (driver.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved drivers can change availability' },
        { status: 403 }
      );
    }
    
    const previousStatus = driver.availability;
    const newStatus = validatedData.availability;
    
    // Update driver availability
    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        ...validatedData,
        lastActivityAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Log availability change if status changed
    if (previousStatus !== newStatus) {
      await prisma.driverAvailabilityHistory.create({
        data: {
          driverId: driver.id,
          previousStatus,
          newStatus,
          changeReason: body.reason || null,
          triggeredBy: 'driver',
          ipAddress,
          userAgent,
          metadata: {
            preferences: {
              acceptsPrivateTrips: validatedData.acceptsPrivateTrips,
              acceptsSharedTrips: validatedData.acceptsSharedTrips,
              acceptsLongDistance: validatedData.acceptsLongDistance,
            }
          }
        }
      });
      
      // TODO: Emit WebSocket event for real-time updates
      // await emitAvailabilityChange(driver.id, newStatus);
      
      // TODO: Notify affected passengers if driver has active trips
      // await notifyPassengersOfAvailabilityChange(driver.id, newStatus);
    }
    
    return NextResponse.json({
      success: true,
      message: `Availability updated to ${newStatus}`,
      data: {
        availability: updatedDriver.availability,
        currentLocation: updatedDriver.currentLocation,
        serviceRadiusKm: updatedDriver.serviceRadiusKm,
        acceptsPrivateTrips: updatedDriver.acceptsPrivateTrips,
        acceptsSharedTrips: updatedDriver.acceptsSharedTrips,
        acceptsLongDistance: updatedDriver.acceptsLongDistance,
        lastActivityAt: updatedDriver.lastActivityAt,
        updatedAt: updatedDriver.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update availability error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
