import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const driver = await getDriverFromRequest(request);
    
    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: { id: params.notificationId }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Ensure the notification belongs to this driver
    if (notification.userId !== driver.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update notification status to READ
    await prisma.notification.update({
      where: { id: params.notificationId },
      data: {
        status: 'READ'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
