import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateDriver, verifyTripAvailableForAcceptance } from '@/lib/auth/driverAuth';


// Simulated Redis for distributed locking (in production, use actual Redis)
class DistributedLock {
  private static locks = new Map<string, { driverId: string; expiresAt: number }>();
  
  static async acquire(key: string, driverId: string, durationSeconds: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(key);
    
    // Clean up expired locks
    if (existing && existing.expiresAt < now) {
      this.locks.delete(key);
    }
    
    // Check if lock is available
    if (this.locks.has(key)) {
      return false;
    }
    
    // Acquire the lock
    this.locks.set(key, {
      driverId,
      expiresAt: now + (durationSeconds * 1000)
    });
    
    return true;
  }
  
  static async release(key: string): Promise<void> {
    this.locks.delete(key);
  }
  
  static async getCurrentHolder(key: string): Promise<string | null> {
    const lock = this.locks.get(key);
    if (!lock) return null;
    
    const now = Date.now();
    if (lock.expiresAt < now) {
      this.locks.delete(key);
      return null;
    }
    
    return lock.driverId;
  }
  
  static async exists(key: string): Promise<boolean> {
    const lock = this.locks.get(key);
    if (!lock) return false;
    
    const now = Date.now();
    if (lock.expiresAt < now) {
      this.locks.delete(key);
      return false;
    }
    
    return true;
  }
}

// POST /api/drivers/trips/acceptance/offer - Offer trip to specific driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, driverId, timeoutDuration = 30 } = body;
    
    if (!tripId || !driverId) {
      return NextResponse.json(
        { error: 'Trip ID and driver ID are required' },
        { status: 400 }
      );
    }
    
    if (timeoutDuration < 15 || timeoutDuration > 120) {
      return NextResponse.json(
        { error: 'Timeout duration must be between 15 and 120 seconds' },
        { status: 400 }
      );
    }
    
    // Create distributed lock to prevent race conditions
    const lockKey = `trip-acceptance:${tripId}`;
    const lockAcquired = await DistributedLock.acquire(lockKey, driverId, timeoutDuration);
    
    if (!lockAcquired) {
      return NextResponse.json(
        { error: 'Trip is already being offered to another driver' },
        { status: 409 }
      );
    }
    
    try {
      // Begin database transaction
      const result = await prisma.$transaction(async (tx: any) => {
        // Get the trip and verify it's available
        const trip = await tx.trip.findUnique({
          where: { id: tripId },
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        });
        
        if (!trip) {
          throw new Error('Trip not found');
        }
        
        if (trip.status !== 'PUBLISHED') {
          throw new Error('Trip is not available for assignment');
        }
        
        if (trip.driverId) {
          throw new Error('Trip has already been accepted by another driver');
        }
        
        // Check trip is in the future
        if (new Date(trip.departureTime) <= new Date()) {
          throw new Error('Cannot offer past trips');
        }
        
        // Set acceptance deadline and offered driver
        const acceptanceDeadline = new Date(Date.now() + (timeoutDuration * 1000));
        
        const updatedTrip = await tx.trip.update({
          where: { id: tripId },
          data: {
            status: 'OFFERED',
            acceptanceDeadline: acceptanceDeadline,
            offeredToDriverId: driverId
          }
        });
        
        // Log the offer
        await tx.tripAcceptanceLog.create({
          data: {
            tripId: tripId,
            driverId: driverId,
            action: 'OFFERED',
            offeredAt: new Date(),
            timeoutDuration: timeoutDuration,
            ipAddress: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });
        
        return { trip: updatedTrip, acceptanceDeadline };
      });
      
      // Schedule automatic timeout cleanup (in production, use a queue system like BullMQ)
      setTimeout(async () => {
        await handleTripOfferTimeout(tripId, driverId);
      }, timeoutDuration * 1000);
      
      return NextResponse.json({
        success: true,
        message: 'Trip offered to driver successfully',
        data: {
          tripId: tripId,
          offeredToDriverId: driverId,
          acceptanceDeadline: result.acceptanceDeadline.toISOString(),
          timeoutDuration: timeoutDuration,
          trip: {
            id: result.trip.id,
            title: result.trip.title,
            departureTime: result.trip.departureTime,
            originName: result.trip.originName,
            destName: result.trip.destName,
            basePrice: result.trip.basePrice,
            platformFee: result.trip.platformFee,
            estimatedEarnings: Math.round((Number(result.trip.basePrice) + Number(result.trip.platformFee)) * 0.85)
          }
        }
      });
      
    } catch (dbError) {
      // Release the lock on database error
      await DistributedLock.release(lockKey);
      throw dbError;
    }
    
  } catch (error) {
    console.error('Trip offer error:', error);
    
    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('not available') ||
        error.message.includes('already been accepted') ||
        error.message.includes('Cannot offer past trips')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to offer trip to driver' },
      { status: 500 }
    );
  }
}

// Handle automatic timeout of trip offers
async function handleTripOfferTimeout(tripId: string, driverId: string) {
  const lockKey = `trip-acceptance:${tripId}`;
  
  try {
    // Check if lock still exists (not already processed)
    const lockExists = await DistributedLock.exists(lockKey);
    if (!lockExists) return;
    
    // Check if trip is still offered to this driver
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { 
        status: true, 
        offeredToDriverId: true,
        acceptanceDeadline: true 
      }
    });
    
    if (!trip || 
        trip.status !== 'OFFERED' || 
        trip.offeredToDriverId !== driverId ||
        !trip.acceptanceDeadline ||
        trip.acceptanceDeadline > new Date()) {
      // Trip has already been processed or extended
      await DistributedLock.release(lockKey);
      return;
    }
    
    // Begin database transaction for timeout handling
    await prisma.$transaction(async (tx: any) => {
      // Reset trip to published status
      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: 'PUBLISHED',
          acceptanceDeadline: null,
          offeredToDriverId: null
        }
      });
      
      // Log the timeout
      await tx.tripAcceptanceLog.create({
        data: {
          tripId: tripId,
          driverId: driverId,
          action: 'TIMEOUT',
          offeredAt: new Date(trip.acceptanceDeadline!.getTime() - 30 * 1000), // Approximate offer time
          respondedAt: new Date(),
          responseTimeSeconds: 30 // Timeout duration
        }
      });
    });
    
    // Release the distributed lock
    await DistributedLock.release(lockKey);
    
    console.log(`Trip ${tripId} offer to driver ${driverId} has timed out`);
    
  } catch (error) {
    console.error('Error handling trip offer timeout:', error);
  }
}

// GET /api/drivers/trips/acceptance/offer - Get current trip offer status
export async function GET(request: NextRequest) {
  try {
    // Authenticate driver using secure token validation
    const driver = await authenticateDriver(request);
    
    // Find active trip offer for this driver
    const activeOffer = await prisma.trip.findFirst({
      where: {
        offeredToDriverId: driver.userId,
        status: 'OFFERED',
        acceptanceDeadline: {
          gt: new Date()
        }
      },
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
            seatsBooked: true
          }
        }
      }
    });
    
    if (!activeOffer) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveOffer: false,
          message: 'No active trip offers'
        }
      });
    }
    
    // Calculate time remaining
    const now = new Date();
    const deadline = new Date(activeOffer.acceptanceDeadline!);
    const timeRemainingSeconds = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
    
    // Calculate trip details
    const bookedSeats = activeOffer.bookings.reduce((sum: any, booking: any) => sum + booking.seatsBooked, 0);
    const availableSeats = activeOffer.totalSeats - bookedSeats;
    const estimatedEarnings = Math.round((Number(activeOffer.basePrice) + Number(activeOffer.platformFee)) * 0.85);
    
    return NextResponse.json({
      success: true,
      data: {
        hasActiveOffer: true,
        timeRemainingSeconds,
        trip: {
          id: activeOffer.id,
          title: activeOffer.title,
          description: activeOffer.description,
          departureTime: activeOffer.departureTime,
          returnTime: activeOffer.returnTime,
          originName: activeOffer.originName,
          originAddress: activeOffer.originAddress,
          destName: activeOffer.destName,
          destAddress: activeOffer.destAddress,
          totalSeats: activeOffer.totalSeats,
          bookedSeats: bookedSeats,
          availableSeats: availableSeats,
          basePrice: activeOffer.basePrice,
          platformFee: activeOffer.platformFee,
          estimatedEarnings: estimatedEarnings,
          organizer: activeOffer.organizer
        },
        acceptanceDeadline: activeOffer.acceptanceDeadline!.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Get trip offer error:', error);
    
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
      { error: 'Failed to retrieve trip offer status' },
      { status: 500 }
    );
  }
}
