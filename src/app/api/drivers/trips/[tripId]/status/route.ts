import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TripStatus } from '@prisma/client';
import { 
  notifyPassengersOfStatusChange, 
  shouldNotifyPassengers 
} from '@/lib/notifications/trip-status-notifications';
import { rateLimit, RATE_LIMIT_CONFIGS, getClientIp } from '@/lib/utils/rate-limit';

const prisma = new PrismaClient();

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
  
  if (!driver || driver.user.role !== 'DRIVER') {
    throw new Error('Driver not found');
  }
  
  return driver;
}

// PUT /api/drivers/trips/[tripId]/status - Update trip status
export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const body = await request.json();
    const { status, notes, location } = body;
    
    // Get authenticated driver first for rate limiting
    const driver = await getDriverFromRequest(request);
    
    // Apply rate limiting per driver
    const rateLimitResult = rateLimit(
      `status-update:${driver.id}`,
      RATE_LIMIT_CONFIGS.STATUS_UPDATE
    );

    // Add rate limit headers to response
    const responseHeaders = new Headers(rateLimitResult.headers);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.error?.message,
          code: rateLimitResult.error?.code 
        },
        { 
          status: 429, // Too Many Requests
          headers: responseHeaders
        }
      );
    }
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    const validStatuses: TripStatus[] = [
      'IN_PROGRESS',
      'DEPARTED',
      'EN_ROUTE',
      'DRIVER_ARRIVED',
      'PASSENGERS_BOARDED',
      'IN_TRANSIT',
      'DELAYED',
      'ARRIVED',
      'COMPLETED',
      'CANCELLED'
    ];
    
    if (!validStatuses.includes(status as TripStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` },
        { status: 400, headers: responseHeaders }
      );
    }
    
    // Get authenticated driver (already done above for rate limiting)
    // const driver = await getDriverFromRequest(request);
    
    // Use database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the trip and verify driver ownership
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          bookings: {
            where: {
              status: {
                in: ['CONFIRMED', 'PENDING']
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });
      
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      if (trip.driverId !== driver.id) {
        throw new Error('You are not assigned to this trip');
      }
      
      // Validate status transitions
      const currentStatus = trip.status;
      
      // Define valid status transitions
      const validTransitions: { [key: string]: TripStatus[] } = {
        'IN_PROGRESS': ['DEPARTED', 'EN_ROUTE', 'DRIVER_ARRIVED', 'DELAYED', 'CANCELLED'],
        'DEPARTED': ['EN_ROUTE', 'DRIVER_ARRIVED', 'DELAYED', 'CANCELLED'],
        'EN_ROUTE': ['DRIVER_ARRIVED', 'DELAYED', 'CANCELLED'],
        'DRIVER_ARRIVED': ['PASSENGERS_BOARDED', 'DELAYED', 'CANCELLED'],
        'PASSENGERS_BOARDED': ['IN_TRANSIT', 'DELAYED', 'CANCELLED'],
        'IN_TRANSIT': ['ARRIVED', 'DELAYED', 'CANCELLED'],
        'DELAYED': ['DEPARTED', 'EN_ROUTE', 'DRIVER_ARRIVED', 'PASSENGERS_BOARDED', 'IN_TRANSIT', 'CANCELLED'],
        'ARRIVED': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [], // Final state
        'CANCELLED': []  // Final state
      } as const;
      
      if (!validTransitions[currentStatus]?.includes(status as TripStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${status}`
        );
      }
      
      // Special validations for certain statuses
      if (status === 'COMPLETED') {
        // Ensure trip has actually started
        if (!['ARRIVED', 'IN_TRANSIT', 'PASSENGERS_BOARDED'].includes(currentStatus)) {
          throw new Error('Trip must have arrived or be in transit before it can be completed');
        }
        
        // Check if trip is not in the future
        const now = new Date();
        if (new Date(trip.departureTime) > now) {
          throw new Error('Cannot complete trip before departure time');
        }
      }
      
      // Update trip status
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: status as TripStatus
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
      
      // Create status update log entry
      const clientIp = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      const statusUpdateLog = await tx.tripStatusUpdate.create({
        data: {
          tripId: tripId,
          driverId: driver.id,
          previousStatus: currentStatus,
          newStatus: status as TripStatus,
          notes: notes || null,
          location: location ? JSON.stringify(location) : null,
          notificationsSent: 0, // Will be updated after notifications
          ipAddress: clientIp,
          userAgent: userAgent,
        }
      });
      
      // Update driver availability when trip is completed or cancelled
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        await tx.driver.update({
          where: { id: driver.id },
          data: {
            availability: 'AVAILABLE'
          }
        });
      }
      
      // Update booking statuses based on trip status
      if (status === 'COMPLETED') {
        await tx.booking.updateMany({
          where: {
            tripId: tripId,
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          data: {
            status: 'COMPLETED'
          }
        });
      } else if (status === 'CANCELLED') {
        await tx.booking.updateMany({
          where: {
            tripId: tripId,
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          data: {
            status: 'CANCELLED'
          }
        });
      }
      
      // Record location update if provided
      if (location && location.latitude && location.longitude) {
        try {
          await tx.$executeRaw`
            INSERT INTO driver_locations (
              driver_id, 
              latitude, 
              longitude, 
              heading, 
              speed, 
              accuracy, 
              updated_at,
              created_at
            ) 
            VALUES (
              ${driver.userId}, 
              ${location.latitude}, 
              ${location.longitude}, 
              ${location.heading || 0}, 
              ${location.speed || 0}, 
              ${location.accuracy || 10}, 
              NOW(),
              NOW()
            )
            ON CONFLICT (driver_id) 
            DO UPDATE SET 
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              heading = EXCLUDED.heading,
              speed = EXCLUDED.speed,
              accuracy = EXCLUDED.accuracy,
              updated_at = NOW()
          `;
        } catch (locationError) {
          console.warn('Could not update location:', locationError);
        }
      }
      
      return {
        trip: updatedTrip,
        previousStatus: currentStatus,
        passengers: trip.bookings,
        statusUpdateLogId: statusUpdateLog.id
      };
    });
    
    // Send notifications to passengers if this status change requires it
    let notificationResult = { success: true, notificationsSent: 0, errors: [] };
    
    if (shouldNotifyPassengers(status as TripStatus)) {
      notificationResult = await notifyPassengersOfStatusChange({
        tripId: result.trip.id,
        tripTitle: result.trip.title,
        driverName: driver.user.name,
        driverPhone: driver.user.phone || undefined,
        previousStatus: result.previousStatus,
        newStatus: status as TripStatus,
        notes: notes,
        location: location,
        departureTime: result.trip.departureTime,
        originName: result.trip.originName,
        destName: result.trip.destName,
      });
      
      // Update the status log with notification count
      if (notificationResult.notificationsSent > 0) {
        await prisma.tripStatusUpdate.update({
          where: { id: result.statusUpdateLogId },
          data: {
            notificationsSent: notificationResult.notificationsSent
          }
        });
      }
    }
    
    // Broadcast status update to real-time listeners
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/realtime/trip-status/${result.trip.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          previousStatus: result.previousStatus,
          driverName: driver.user.name,
          notes: notes,
        }),
      });
    } catch (broadcastError) {
      console.error('Failed to broadcast status update:', broadcastError);
      // Don't fail the request if broadcast fails
    }
    
    // Prepare status-specific response data
    const getStatusMessage = (status: string) => {
      const messages: { [key: string]: string } = {
        'DEPARTED': 'You have departed. En route to pickup location.',
        'EN_ROUTE': 'Status updated to en route.',
        'DRIVER_ARRIVED': 'You have arrived at the pickup location. Contact passengers if needed.',
        'PASSENGERS_BOARDED': 'Passengers have boarded. You can now start the trip.',
        'IN_TRANSIT': 'Trip is now in progress. Drive safely!',
        'DELAYED': 'Trip has been marked as delayed. Passengers have been notified.',
        'ARRIVED': 'You have arrived at the destination.',
        'COMPLETED': 'Trip completed successfully. You are now available for new trips.',
        'CANCELLED': 'Trip has been cancelled. You are now available for new trips.'
      };
      
      return messages[status] || 'Trip status updated successfully';
    };
    
    const getNextActions = (status: string): string[] => {
      const actions: { [key: string]: string[] } = {
        'DEPARTED': [
          'Navigate to pickup location',
          'Contact passengers if needed',
          'Update status when you arrive'
        ],
        'EN_ROUTE': [
          'Continue to pickup location',
          'Keep passengers informed',
          'Update status when you arrive'
        ],
        'DRIVER_ARRIVED': [
          'Contact passengers to confirm pickup',
          'Wait for passengers to board',
          'Update status when passengers are ready'
        ],
        'PASSENGERS_BOARDED': [
          'Confirm all passengers are aboard',
          'Start the trip',
          'Navigate to destination'
        ],
        'IN_TRANSIT': [
          'Drive safely to destination',
          'Update passengers on progress if needed',
          'Complete trip when you arrive'
        ],
        'DELAYED': [
          'Inform passengers of the delay reason',
          'Provide estimated time update',
          'Update status when ready to proceed'
        ],
        'ARRIVED': [
          'Confirm arrival at destination',
          'Help passengers with luggage',
          'Complete the trip'
        ],
        'COMPLETED': [
          'Trip earnings have been processed',
          'You are now available for new trips',
          'Check for new trip requests'
        ],
        'CANCELLED': [
          'Trip cancellation has been recorded',
          'You are now available for new trips',
          'Check for new trip requests'
        ]
      };
      
      return actions[status] || [];
    };
    
    return NextResponse.json({
      success: true,
      message: getStatusMessage(status),
      data: {
        trip: {
          id: result.trip.id,
          status: result.trip.status,
          previousStatus: result.previousStatus,
          title: result.trip.title,
          departureTime: result.trip.departureTime,
          returnTime: result.trip.returnTime,
          organizer: result.trip.organizer
        },
        driver: {
          id: driver.id,
          availability: status === 'COMPLETED' || status === 'CANCELLED' ? 'AVAILABLE' : 'BUSY'
        },
        passengers: result.passengers.map((booking: any) => ({
          id: booking.id,
          seatsBooked: booking.seatsBooked,
          user: booking.user
        })),
        notifications: {
          sent: notificationResult.notificationsSent,
          success: notificationResult.success,
          errors: notificationResult.errors
        },
        nextActions: getNextActions(status),
        location: location || null
      }
    }, {
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Trip status update error:', error);
    
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
          { status: 403 }
        );
      }
      
      if (
        error.message.includes('not found') ||
        error.message.includes('not assigned') ||
        error.message.includes('Invalid status') ||
        error.message.includes('must be in transit') ||
        error.message.includes('before departure time')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update trip status' },
      { status: 500 }
    );
  }
}

// GET /api/drivers/trips/[tripId]/status - Get current trip status and details
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING', 'COMPLETED']
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    if (trip.driverId !== driver.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this trip' },
        { status: 403 }
      );
    }
    
    // Calculate trip progress
    const now = new Date();
    const departureTime = new Date(trip.departureTime);
    const returnTime = new Date(trip.returnTime);
    
    const isUpcoming = departureTime > now;
    const isOverdue = returnTime < now && trip.status !== 'COMPLETED';
    const minutesUntilDeparture = Math.ceil((departureTime.getTime() - now.getTime()) / (1000 * 60));
    
    // Calculate earnings
    const estimatedEarnings = (Number(trip.basePrice) + Number(trip.platformFee)) * 0.85;
    
    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          status: trip.status,
          departureTime: trip.departureTime,
          returnTime: trip.returnTime,
          originName: trip.originName,
          originAddress: trip.originAddress,
          destName: trip.destName,
          destAddress: trip.destAddress,
          totalSeats: trip.totalSeats,
          basePrice: trip.basePrice,
          platformFee: trip.platformFee,
          estimatedEarnings: Math.round(estimatedEarnings),
          organizer: trip.organizer,
          isUpcoming,
          isOverdue,
          minutesUntilDeparture: isUpcoming ? minutesUntilDeparture : null
        },
        bookings: trip.bookings.map((booking: any) => ({
          id: booking.id,
          seatsBooked: booking.seatsBooked,
          passengers: booking.passengers,
          notes: booking.notes,
          status: booking.status,
          user: booking.user
        })),
        timeline: [
          { status: 'IN_PROGRESS', label: 'Trip Accepted', completed: true },
          { 
            status: 'DEPARTED', 
            label: 'Departed', 
            completed: ['DEPARTED', 'EN_ROUTE', 'DRIVER_ARRIVED', 'PASSENGERS_BOARDED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(trip.status) 
          },
          { 
            status: 'EN_ROUTE', 
            label: 'En Route to Pickup', 
            completed: ['EN_ROUTE', 'DRIVER_ARRIVED', 'PASSENGERS_BOARDED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(trip.status) 
          },
          { 
            status: 'DRIVER_ARRIVED', 
            label: 'Arrived at Pickup', 
            completed: ['DRIVER_ARRIVED', 'PASSENGERS_BOARDED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(trip.status) 
          },
          { 
            status: 'PASSENGERS_BOARDED', 
            label: 'Passengers Boarded', 
            completed: ['PASSENGERS_BOARDED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(trip.status) 
          },
          { 
            status: 'IN_TRANSIT', 
            label: 'Trip in Progress', 
            completed: ['IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(trip.status) 
          },
          { 
            status: 'ARRIVED', 
            label: 'Arrived at Destination', 
            completed: ['ARRIVED', 'COMPLETED'].includes(trip.status) 
          },
          { 
            status: 'COMPLETED', 
            label: 'Trip Completed', 
            completed: trip.status === 'COMPLETED' 
          }
        ]
      }
    });
    
  } catch (error) {
    console.error('Get trip status error:', error);
    
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
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve trip status' },
      { status: 500 }
    );
  }
}
