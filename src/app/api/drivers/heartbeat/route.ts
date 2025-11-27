import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DRIVER_ACTIVITY_TYPES, DEFAULT_AUTO_OFFLINE_MINUTES } from '@/lib/constants/driver';

const prisma = new PrismaClient();

/**
 * Heartbeat API endpoint for browser-based driver activity tracking.
 * 
 * This endpoint should be called periodically from the driver portal frontend
 * while the driver is ONLINE (AVAILABLE or BUSY) to keep their lastActivityAt updated.
 * 
 * Recommended interval: every 5 minutes while portal tab is active
 * 
 * This prevents drivers from being marked OFFLINE prematurely during normal
 * web usage, as the auto-offline system uses lastActivityAt to determine inactivity.
 */

// Get driver from session
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      driverId: true,
      userId: true,
      status: true,
      availability: true,
      lastActivityAt: true,
      autoOfflineMinutes: true,
    }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

/**
 * POST - Driver heartbeat to refresh lastActivityAt
 * 
 * Call this endpoint periodically from the browser while driver portal is active
 * to prevent auto-offline during normal usage.
 */
export async function POST(request: NextRequest) {
  try {
    const driver = await getDriverFromRequest(request);
    
    // Only process heartbeat for approved drivers who are ONLINE
    if (driver.status !== 'APPROVED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Driver not approved',
          code: 'DRIVER_NOT_APPROVED'
        },
        { status: 403 }
      );
    }
    
    // Only update lastActivityAt if driver is currently AVAILABLE or BUSY (online)
    // Don't update for OFFLINE drivers to prevent keeping them "active" when offline
    if (driver.availability === 'OFFLINE') {
      return NextResponse.json({
        success: true,
        message: 'Driver is offline, heartbeat not processed',
        data: {
          availability: driver.availability,
          lastActivityAt: driver.lastActivityAt,
          autoOfflineMinutes: driver.autoOfflineMinutes,
        }
      });
    }
    
    const now = new Date();
    
    // Update lastActivityAt for AVAILABLE or BUSY drivers
    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        lastActivityAt: now,
        updatedAt: now
      },
      select: {
        id: true,
        availability: true,
        lastActivityAt: true,
        autoOfflineMinutes: true,
      }
    });
    
    // Calculate time until auto-offline (for frontend warning display)
    // After heartbeat, lastActivityAt is set to now, so auto-offline is now + autoOfflineMinutes
    const autoOfflineTimeout = updatedDriver.autoOfflineMinutes ?? DEFAULT_AUTO_OFFLINE_MINUTES;
    const autoOfflineAt = new Date(now.getTime() + (autoOfflineTimeout * 60 * 1000));
    const minutesUntilOffline = autoOfflineTimeout;
    
    return NextResponse.json({
      success: true,
      message: 'Heartbeat received',
      data: {
        availability: updatedDriver.availability,
        lastActivityAt: updatedDriver.lastActivityAt,
        autoOfflineMinutes: autoOfflineTimeout,
        autoOfflineAt: autoOfflineAt.toISOString(),
        minutesUntilOffline: minutesUntilOffline,
        activityType: DRIVER_ACTIVITY_TYPES.HEARTBEAT,
      }
    });
    
  } catch (error) {
    console.error('Driver heartbeat error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Driver not found',
          code: 'DRIVER_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process heartbeat',
        code: 'HEARTBEAT_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check driver's current activity status
 * 
 * Returns the current lastActivityAt and time until auto-offline.
 */
export async function GET(request: NextRequest) {
  try {
    const driver = await getDriverFromRequest(request);
    
    const now = new Date();
    let minutesUntilOffline: number | null = null;
    let autoOfflineAt: string | null = null;
    const autoOfflineTimeout = driver.autoOfflineMinutes ?? DEFAULT_AUTO_OFFLINE_MINUTES;
    
    // Calculate time until auto-offline if driver is online
    if (driver.availability !== 'OFFLINE' && driver.lastActivityAt) {
      const timeSinceActivity = (now.getTime() - driver.lastActivityAt.getTime()) / (1000 * 60);
      minutesUntilOffline = Math.max(0, Math.round(autoOfflineTimeout - timeSinceActivity));
      autoOfflineAt = new Date(driver.lastActivityAt.getTime() + (autoOfflineTimeout * 60 * 1000)).toISOString();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        availability: driver.availability,
        lastActivityAt: driver.lastActivityAt,
        autoOfflineMinutes: autoOfflineTimeout,
        autoOfflineAt: autoOfflineAt,
        minutesUntilOffline: minutesUntilOffline,
        isOnline: driver.availability !== 'OFFLINE',
      }
    });
    
  } catch (error) {
    console.error('Get driver activity status error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Driver not found',
          code: 'DRIVER_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get activity status',
        code: 'STATUS_FAILED'
      },
      { status: 500 }
    );
  }
}
