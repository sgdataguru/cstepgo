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
    include: { user: true }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

export async function GET(request: NextRequest) {
  try {
    const driver = await getDriverFromRequest(request);
    
    // Get notifications for the driver
    const notifications = await prisma.notification.findMany({
      where: {
        userId: driver.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
    });

    // Transform notifications to include read status
    const transformedNotifications = notifications.map(notif => ({
      id: notif.id,
      type: notif.type,
      title: notif.subject || 'Notification',
      message: notif.body,
      isRead: notif.status === 'READ' || notif.status === 'DELIVERED',
      actionUrl: null, // Could be derived from notification type
      createdAt: notif.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: transformedNotifications
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}
