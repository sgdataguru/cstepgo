import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// Get driver from session
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

// DELETE - Cancel/deactivate a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const driver = await getDriverFromRequest(request);
    const { scheduleId } = params;
    
    // Find the schedule
    const schedule = await prisma.driverAvailabilitySchedule.findUnique({
      where: { id: scheduleId }
    });
    
    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (schedule.driverId !== driver.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Deactivate the schedule (soft delete)
    await prisma.driverAvailabilitySchedule.update({
      where: { id: scheduleId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
    
    // If this schedule is currently active, update driver availability back to AVAILABLE
    const now = new Date();
    if (schedule.startTime <= now && schedule.endTime >= now) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          availability: 'AVAILABLE',
          lastActivityAt: new Date()
        }
      });
      
      // Log the change
      await prisma.driverAvailabilityHistory.create({
        data: {
          driverId: driver.id,
          previousStatus: driver.availability,
          newStatus: 'AVAILABLE',
          changeReason: `Schedule cancelled: ${schedule.scheduleType}`,
          triggeredBy: 'driver',
          metadata: {
            scheduleId: schedule.id,
            cancelledAt: new Date()
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Schedule cancelled successfully'
    });
    
  } catch (error) {
    console.error('Delete schedule error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel schedule' },
      { status: 500 }
    );
  }
}
