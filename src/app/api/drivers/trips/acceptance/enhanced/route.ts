import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateDriver, verifyTripAvailableForAcceptance } from '@/lib/auth/driverAuth';


// Enhanced trip acceptance mechanism with real-time coordination and timeout handling

// Simulated distributed locking mechanism (in production, use Redis)
class TripAcceptanceLock {
  private static activeLocks = new Map<string, {
    driverId: string;
    tripId: string;
    expiresAt: number;
    timeoutDuration: number;
  }>();
  
  static async offerTripToDriver(tripId: string, driverId: string, timeoutSeconds: number = 30): Promise<boolean> {
    const lockKey = `trip-offer:${tripId}`;
    const now = Date.now();
    
    // Clean up expired locks
    for (const [key, lock] of this.activeLocks.entries()) {
      if (lock.expiresAt < now) {
        this.activeLocks.delete(key);
      }
    }
    
    // Check if trip is already being offered
    if (this.activeLocks.has(lockKey)) {
      return false;
    }
    
    // Create the offer lock
    this.activeLocks.set(lockKey, {
      driverId,
      tripId,
      expiresAt: now + (timeoutSeconds * 1000),
      timeoutDuration: timeoutSeconds
    });
    
    // Schedule automatic timeout
    setTimeout(() => {
      this.handleTimeout(tripId, driverId);
    }, timeoutSeconds * 1000);
    
    return true;
  }
  
  static async acceptTripOffer(tripId: string, driverId: string): Promise<boolean> {
    const lockKey = `trip-offer:${tripId}`;
    const lock = this.activeLocks.get(lockKey);
    
    if (!lock || lock.driverId !== driverId || lock.expiresAt < Date.now()) {
      return false; // Offer expired or not for this driver
    }
    
    // Clear the lock since trip is being accepted
    this.activeLocks.delete(lockKey);
    return true;
  }
  
  static async declineTripOffer(tripId: string, driverId: string): Promise<boolean> {
    const lockKey = `trip-offer:${tripId}`;
    const lock = this.activeLocks.get(lockKey);
    
    if (!lock || lock.driverId !== driverId) {
      return false;
    }
    
    // Clear the lock
    this.activeLocks.delete(lockKey);
    return true;
  }
  
  static async getActiveOffer(driverId: string): Promise<{ tripId: string; timeRemainingSeconds: number } | null> {
    const now = Date.now();
    
    for (const [key, lock] of this.activeLocks.entries()) {
      if (lock.driverId === driverId && lock.expiresAt > now) {
        return {
          tripId: lock.tripId,
          timeRemainingSeconds: Math.max(0, Math.floor((lock.expiresAt - now) / 1000))
        };
      }
    }
    
    return null;
  }
  
  static async handleTimeout(tripId: string, driverId: string): Promise<void> {
    const lockKey = `trip-offer:${tripId}`;
    const lock = this.activeLocks.get(lockKey);
    
    // Only handle timeout if lock still exists and belongs to this driver
    if (!lock || lock.driverId !== driverId || lock.tripId !== tripId) {
      return;
    }
    
    // Remove the lock
    this.activeLocks.delete(lockKey);
    
    // Log timeout and reset trip for redistribution
    console.log(`Trip offer timeout: ${tripId} for driver ${driverId}`);
    
    try {
      // Record timeout in trip visibility for analytics
      await prisma.$executeRaw`
        INSERT INTO trip_driver_visibility (trip_id, driver_id, shown_at, response_action, response_at, created_at)
        VALUES (${tripId}, ${driverId}, NOW() - INTERVAL '30 seconds', 'timeout', NOW(), NOW())
        ON CONFLICT (trip_id, driver_id) 
        DO UPDATE SET 
          response_action = 'timeout',
          response_at = NOW()
      `;
    } catch (error) {
      console.error('Error recording timeout:', error);
    }
  }
}

// POST /api/drivers/trips/acceptance/enhanced - Enhanced trip acceptance with real-time coordination
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, action, timeoutDuration = 30 } = body;
    
    if (!tripId || !action) {
      return NextResponse.json(
        { error: 'Trip ID and action are required' },
        { status: 400 }
      );
    }
    
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "decline"' },
        { status: 400 }
      );
    }
    
    // Authenticate driver using secure token validation
    const driver = await authenticateDriver(request);
    const startTime = Date.now();
    
    if (action === 'accept') {
      // Verify this driver has an active offer for this trip
      const offerValid = await TripAcceptanceLock.acceptTripOffer(tripId, driver.userId);
      
      if (!offerValid) {
        return NextResponse.json(
          { 
            error: 'Trip offer has expired or is not available to you',
            reason: 'OFFER_EXPIRED'
          },
          { status: 410 } // Gone - offer expired
        );
      }
      
      // Use database transaction to ensure atomic trip acceptance
      const result = await prisma.$transaction(async (tx: any) => {
        // Get the trip with full details
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
              select: {
                seatsBooked: true
              }
            }
          }
        });
        
        if (!trip) {
          throw new Error('Trip not found');
        }
        
        if (trip.status !== 'PUBLISHED') {
          throw new Error('Trip is not available for acceptance');
        }
        
        if (trip.driverId) {
          throw new Error('Trip has already been accepted by another driver');
        }
        
        // Check if trip has available capacity
        const totalBookedSeats = trip.bookings.reduce(
          (sum: any, booking: any) => sum + booking.seatsBooked,
          0
        );
        
        if (trip.totalSeats <= totalBookedSeats) {
          throw new Error('Trip has no available seats');
        }
        
        // Check if trip is in the future
        if (new Date(trip.departureTime) <= new Date()) {
          throw new Error('Cannot accept past trips');
        }
        
        // Accept the trip
        const updatedTrip = await tx.trip.update({
          where: { id: tripId },
          data: {
            driverId: driver.id,
            status: 'IN_PROGRESS'
          }
        });
        
        // Update driver availability
        await tx.driver.update({
          where: { id: driver.id },
          data: {
            availability: 'BUSY'
          }
        });
        
        // Record acceptance in visibility tracking
        const responseTime = Math.round((Date.now() - startTime) / 1000);
        await tx.$executeRaw`
          INSERT INTO trip_driver_visibility (trip_id, driver_id, shown_at, response_action, response_at, created_at)
          VALUES (${tripId}, ${driver.userId}, NOW() - INTERVAL '${responseTime} seconds', 'accepted', NOW(), NOW())
          ON CONFLICT (trip_id, driver_id) 
          DO UPDATE SET 
            response_action = 'accepted',
            response_at = NOW()
        `;
        
        return { trip: updatedTrip, organizer: trip.organizer, responseTime };
      });
      
      // Calculate earnings
      const estimatedEarnings = (Number(result.trip.basePrice) + Number(result.trip.platformFee)) * 0.85;
      
      return NextResponse.json({
        success: true,
        message: 'Trip accepted successfully!',
        data: {
          trip: {
            id: result.trip.id,
            title: result.trip.title,
            description: result.trip.description,
            departureTime: result.trip.departureTime,
            returnTime: result.trip.returnTime,
            originName: result.trip.originName,
            originAddress: result.trip.originAddress,
            destName: result.trip.destName,
            destAddress: result.trip.destAddress,
            basePrice: result.trip.basePrice,
            platformFee: result.trip.platformFee,
            estimatedEarnings: Math.round(estimatedEarnings),
            status: result.trip.status,
            organizer: result.organizer
          },
          responseTime: result.responseTime,
          nextSteps: [
            'Navigate to pickup location',
            'Contact customer if needed',
            'Update trip status when you arrive',
            'Complete the trip when finished'
          ]
        }
      });
      
    } else if (action === 'decline') {
      // Handle trip decline
      const declineValid = await TripAcceptanceLock.declineTripOffer(tripId, driver.userId);
      
      if (!declineValid) {
        return NextResponse.json(
          { 
            error: 'No active trip offer found to decline',
            reason: 'NO_ACTIVE_OFFER'
          },
          { status: 400 }
        );
      }
      
      // Record decline in analytics
      const responseTime = Math.round((Date.now() - startTime) / 1000);
      
      await prisma.$executeRaw`
        INSERT INTO trip_driver_visibility (trip_id, driver_id, shown_at, response_action, response_at, created_at)
        VALUES (${tripId}, ${driver.userId}, NOW() - INTERVAL '${responseTime} seconds', 'declined', NOW(), NOW())
        ON CONFLICT (trip_id, driver_id) 
        DO UPDATE SET 
          response_action = 'declined',
          response_at = NOW()
      `;
      
      return NextResponse.json({
        success: true,
        message: 'Trip offer declined',
        data: {
          tripId: tripId,
          action: 'declined',
          responseTime: responseTime
        }
      });
    }
    
  } catch (error) {
    console.error('Enhanced trip acceptance error:', error);
    
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
        error.message.includes('not available') ||
        error.message.includes('already been accepted') ||
        error.message.includes('no available seats') ||
        error.message.includes('Cannot accept past trips')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process trip acceptance' },
      { status: 500 }
    );
  }
}

// GET /api/drivers/trips/acceptance/enhanced - Get active trip offer status
export async function GET(request: NextRequest) {
  try {
    // Authenticate driver using secure token validation
    const driver = await authenticateDriver(request);
    
    // Check for active trip offer
    const activeOffer = await TripAcceptanceLock.getActiveOffer(driver.userId);
    
    if (!activeOffer) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveOffer: false,
          message: 'No active trip offers'
        }
      });
    }
    
    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: activeOffer.tripId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          select: {
            seatsBooked: true,
            passengers: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!trip) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveOffer: false,
          message: 'Trip no longer available'
        }
      });
    }
    
    // Calculate trip metrics
    const bookedSeats = trip.bookings.reduce((sum: any, booking: any) => sum + booking.seatsBooked, 0);
    const availableSeats = trip.totalSeats - bookedSeats;
    const estimatedEarnings = Math.round((Number(trip.basePrice) + Number(trip.platformFee)) * 0.85);
    
    // Calculate distance (using default Almaty center for driver location)
    const driverLat = 43.2381;
    const driverLng = 76.9452;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (trip.originLat - driverLat) * Math.PI / 180;
    const dLng = (trip.originLng - driverLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(driverLat * Math.PI / 180) * Math.cos(trip.originLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return NextResponse.json({
      success: true,
      data: {
        hasActiveOffer: true,
        timeRemainingSeconds: activeOffer.timeRemainingSeconds,
        trip: {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          departureTime: trip.departureTime,
          returnTime: trip.returnTime,
          originName: trip.originName,
          originAddress: trip.originAddress,
          destName: trip.destName,
          destAddress: trip.destAddress,
          distance: Math.round(distance * 100) / 100,
          estimatedDuration: Math.round(distance * 1.5), // minutes
          totalSeats: trip.totalSeats,
          bookedSeats: bookedSeats,
          availableSeats: availableSeats,
          basePrice: trip.basePrice,
          platformFee: trip.platformFee,
          estimatedEarnings: estimatedEarnings,
          organizer: trip.organizer,
          passengers: trip.bookings.map((booking: any) => ({
            seatsBooked: booking.seatsBooked,
            passengerInfo: booking.passengers,
            customerName: booking.user.name
          }))
        },
        urgency: activeOffer.timeRemainingSeconds <= 10 ? 'critical' : 
                 activeOffer.timeRemainingSeconds <= 30 ? 'high' : 'normal'
      }
    });
    
  } catch (error) {
    console.error('Get active offer error:', error);
    
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
      { error: 'Failed to retrieve active offer' },
      { status: 500 }
    );
  }
}
