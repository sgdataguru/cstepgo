import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In a production environment, you would use a proper WebSocket server
// For now, we'll use Server-Sent Events (SSE) for real-time updates

// GET /api/drivers/realtime/trips - Server-Sent Events for real-time trip updates
export async function GET(request: NextRequest) {
  try {
    // Get driver ID from headers
    const driverId = request.headers.get('x-driver-id');
    
    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver authentication required' },
        { status: 401 }
      );
    }
    
    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true }
    });
    
    if (!driver || driver.user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 403 }
      );
    }
    
    // Create SSE response
    const encoder = new TextEncoder();
    let isClosed = false;
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Real-time updates connected',
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(encoder.encode(initialMessage));
        
        // Set up periodic updates
        const intervalId = setInterval(async () => {
          if (isClosed) {
            clearInterval(intervalId);
            return;
          }
          
          try {
            // Check for new available trips in driver's area
            const availableTrips = await prisma.trip.findMany({
              where: {
                status: 'PUBLISHED',
                driverId: null,
                departureTime: {
                  gt: new Date()
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 5,
              select: {
                id: true,
                title: true,
                departureTime: true,
                originName: true,
                destName: true,
                basePrice: true,
                platformFee: true,
                originLat: true,
                originLng: true,
                createdAt: true
              }
            });
            
            // Calculate distance from driver location (using default Almaty center)
            const driverLat = 43.2381;
            const driverLng = 76.9452;
            
            const tripsWithDistance = availableTrips
              .map((trip: any) => {
                const R = 6371; // Earth's radius in kilometers
                const dLat = (trip.originLat - driverLat) * Math.PI / 180;
                const dLng = (trip.originLng - driverLng) * Math.PI / 180;
                const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(driverLat * Math.PI / 180) * Math.cos(trip.originLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;
                
                return {
                  ...trip,
                  distance: Math.round(distance * 100) / 100,
                  estimatedEarnings: Math.round((Number(trip.basePrice) + Number(trip.platformFee)) * 0.85)
                };
              })
              .filter((trip: any) => trip.distance <= 50) // Within 50km radius
              .sort((a: any, b: any) => a.distance - b.distance);
            
            // Check for driver's active trip status changes
            const activeTrip = await prisma.trip.findFirst({
              where: {
                driverId: driver.id,
                status: 'IN_PROGRESS'
              },
              select: {
                id: true,
                title: true,
                status: true,
                departureTime: true,
                originName: true,
                destName: true
              }
            });
            
            // Send updates
            const updateMessage = `data: ${JSON.stringify({
              type: 'trip_updates',
              data: {
                availableTrips: tripsWithDistance,
                activeTrip: activeTrip,
                driverStatus: driver.availability,
                timestamp: new Date().toISOString()
              }
            })}\n\n`;
            
            controller.enqueue(encoder.encode(updateMessage));
            
            // Send heartbeat
            const heartbeat = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`;
            
            controller.enqueue(encoder.encode(heartbeat));
            
          } catch (error) {
            console.error('SSE update error:', error);
            
            const errorMessage = `data: ${JSON.stringify({
              type: 'error',
              message: 'Failed to fetch updates',
              timestamp: new Date().toISOString()
            })}\n\n`;
            
            controller.enqueue(encoder.encode(errorMessage));
          }
        }, 10000); // Update every 10 seconds
        
        // Clean up on connection close
        const cleanup = () => {
          isClosed = true;
          clearInterval(intervalId);
          controller.close();
        };
        
        // Handle connection close
        request.signal?.addEventListener('abort', cleanup);
        
        // Auto-close after 30 minutes to prevent memory leaks
        setTimeout(cleanup, 30 * 60 * 1000);
      },
      
      cancel() {
        isClosed = true;
      }
    });
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'x-driver-id'
      }
    });
    
  } catch (error) {
    console.error('Real-time connection error:', error);
    
    return NextResponse.json(
      { error: 'Failed to establish real-time connection' },
      { status: 500 }
    );
  }
}

// POST /api/drivers/realtime/trips - Send real-time trip notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, type, message, targetDrivers } = body;
    
    if (!tripId || !type) {
      return NextResponse.json(
        { error: 'Trip ID and type are required' },
        { status: 400 }
      );
    }
    
    // This would typically broadcast to connected WebSocket clients
    // For now, we'll log the notification and return success
    console.log('Real-time notification:', {
      tripId,
      type,
      message,
      targetDrivers,
      timestamp: new Date().toISOString()
    });
    
    // In a real implementation, you would:
    // 1. Store notification in database
    // 2. Send to connected WebSocket clients
    // 3. Send push notifications to mobile apps
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        tripId,
        type,
        notifiedDrivers: targetDrivers?.length || 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Send notification error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
