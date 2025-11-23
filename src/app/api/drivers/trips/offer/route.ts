import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Trip Offering Service - Manages offering trips to drivers with timeout coordination

class TripOfferingService {
  // In-memory tracking of active trip offers (use Redis in production)
  private static activeOffers = new Map<string, {
    tripId: string;
    driverId: string;
    offeredAt: Date;
    expiresAt: Date;
    timeoutDuration: number;
  }>();
  
  // Offer a trip to a specific driver with timeout
  static async offerTripToDriver(
    tripId: string, 
    driverId: string, 
    timeoutDuration: number = 30
  ): Promise<{ success: boolean; reason?: string; offerId?: string }> {
    try {
      // Check if trip is already being offered
      const existingOffer = Array.from(this.activeOffers.values())
        .find(offer => offer.tripId === tripId);
      
      if (existingOffer) {
        return {
          success: false,
          reason: 'Trip is already offered to another driver'
        };
      }
      
      // Verify trip is available
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          id: true,
          status: true,
          driverId: true,
          departureTime: true
        }
      });
      
      if (!trip) {
        return { success: false, reason: 'Trip not found' };
      }
      
      if (trip.status !== 'PUBLISHED') {
        return { success: false, reason: 'Trip is not available' };
      }
      
      if (trip.driverId) {
        return { success: false, reason: 'Trip already has a driver' };
      }
      
      if (new Date(trip.departureTime) <= new Date()) {
        return { success: false, reason: 'Trip is in the past' };
      }
      
      // Verify driver exists and is available
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          availability: true,
          userId: true
        }
      });
      
      if (!driver) {
        return { success: false, reason: 'Driver not found' };
      }
      
      if (driver.availability !== 'AVAILABLE') {
        return { success: false, reason: 'Driver is not available' };
      }
      
      // Create the offer
      const offerId = `offer-${tripId}-${driverId}-${Date.now()}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (timeoutDuration * 1000));
      
      this.activeOffers.set(offerId, {
        tripId,
        driverId: driver.userId,
        offeredAt: now,
        expiresAt,
        timeoutDuration
      });
      
      // Schedule automatic cleanup
      setTimeout(() => {
        this.handleOfferExpiration(offerId);
      }, timeoutDuration * 1000);
      
      // Log the offer for analytics
      try {
        await prisma.$executeRaw`
          INSERT INTO trip_driver_visibility (trip_id, driver_id, shown_at, created_at)
          VALUES (${tripId}, ${driver.userId}, NOW(), NOW())
          ON CONFLICT (trip_id, driver_id) DO UPDATE SET shown_at = NOW()
        `;
      } catch (logError) {
        console.warn('Could not log trip offer:', logError);
      }
      
      return {
        success: true,
        offerId
      };
      
    } catch (error) {
      console.error('Error offering trip to driver:', error);
      return {
        success: false,
        reason: 'Internal server error'
      };
    }
  }
  
  // Get active offer for a driver
  static getActiveOfferForDriver(driverId: string): {
    tripId: string;
    timeRemainingSeconds: number;
    offeredAt: Date;
  } | null {
    const now = Date.now();
    
    for (const [offerId, offer] of this.activeOffers.entries()) {
      if (offer.driverId === driverId && offer.expiresAt.getTime() > now) {
        return {
          tripId: offer.tripId,
          timeRemainingSeconds: Math.max(0, Math.floor((offer.expiresAt.getTime() - now) / 1000)),
          offeredAt: offer.offeredAt
        };
      }
    }
    
    return null;
  }
  
  // Accept an offered trip
  static async acceptOffer(tripId: string, driverId: string): Promise<boolean> {
    const offerKey = Array.from(this.activeOffers.entries())
      .find(([_, offer]) => offer.tripId === tripId && offer.driverId === driverId);
    
    if (!offerKey) {
      return false; // No active offer
    }
    
    const [offerId, offer] = offerKey;
    
    // Check if offer is still valid
    if (offer.expiresAt.getTime() <= Date.now()) {
      this.activeOffers.delete(offerId);
      return false; // Offer expired
    }
    
    // Remove the offer since it's being accepted
    this.activeOffers.delete(offerId);
    return true;
  }
  
  // Decline an offered trip
  static async declineOffer(tripId: string, driverId: string): Promise<boolean> {
    const offerKey = Array.from(this.activeOffers.entries())
      .find(([_, offer]) => offer.tripId === tripId && offer.driverId === driverId);
    
    if (!offerKey) {
      return false; // No active offer
    }
    
    const [offerId] = offerKey;
    this.activeOffers.delete(offerId);
    return true;
  }
  
  // Handle offer expiration
  static async handleOfferExpiration(offerId: string): Promise<void> {
    const offer = this.activeOffers.get(offerId);
    
    if (!offer) {
      return; // Already processed
    }
    
    // Remove expired offer
    this.activeOffers.delete(offerId);
    
    // Log timeout for analytics
    try {
      await prisma.$executeRaw`
        INSERT INTO trip_driver_visibility (trip_id, driver_id, shown_at, response_action, response_at, created_at)
        VALUES (${offer.tripId}, ${offer.driverId}, ${offer.offeredAt}, 'timeout', NOW(), NOW())
        ON CONFLICT (trip_id, driver_id) 
        DO UPDATE SET 
          response_action = 'timeout',
          response_at = NOW()
      `;
    } catch (error) {
      console.warn('Could not log offer timeout:', error);
    }
    
    console.log(`Trip offer ${offerId} expired for driver ${offer.driverId}`);
  }
  
  // Get all active offers (for monitoring/debugging)
  static getActiveOffers(): Array<{
    offerId: string;
    tripId: string;
    driverId: string;
    timeRemaining: number;
  }> {
    const now = Date.now();
    const active: Array<any> = [];
    
    for (const [offerId, offer] of this.activeOffers.entries()) {
      const timeRemaining = Math.max(0, Math.floor((offer.expiresAt.getTime() - now) / 1000));
      
      if (timeRemaining > 0) {
        active.push({
          offerId,
          tripId: offer.tripId,
          driverId: offer.driverId,
          timeRemaining
        });
      } else {
        // Clean up expired offers
        this.activeOffers.delete(offerId);
      }
    }
    
    return active;
  }
}

// POST /api/drivers/trips/offer - Offer a trip to a specific driver
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
    
    const result = await TripOfferingService.offerTripToDriver(tripId, driverId, timeoutDuration);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.reason },
        { status: 400 }
      );
    }
    
    // Get trip details for response
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        title: true,
        departureTime: true,
        originName: true,
        destName: true,
        basePrice: true,
        platformFee: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Trip offered to driver successfully',
      data: {
        offerId: result.offerId,
        tripId: tripId,
        driverId: driverId,
        timeoutDuration: timeoutDuration,
        trip: trip ? {
          ...trip,
          estimatedEarnings: Math.round((Number(trip.basePrice) + Number(trip.platformFee)) * 0.85)
        } : null
      }
    });
    
  } catch (error) {
    console.error('Offer trip error:', error);
    
    return NextResponse.json(
      { error: 'Failed to offer trip to driver' },
      { status: 500 }
    );
  }
}

// GET /api/drivers/trips/offer - Get active offers status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    
    if (driverId) {
      // Get active offer for specific driver
      const offer = TripOfferingService.getActiveOfferForDriver(driverId);
      
      if (!offer) {
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
        where: { id: offer.tripId },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true
            }
          }
        }
      });
      
      if (!trip) {
        return NextResponse.json({
          success: true,
          data: {
            hasActiveOffer: false,
            message: 'Offered trip no longer exists'
          }
        });
      }
      
      const estimatedEarnings = Math.round((Number(trip.basePrice) + Number(trip.platformFee)) * 0.85);
      
      return NextResponse.json({
        success: true,
        data: {
          hasActiveOffer: true,
          timeRemainingSeconds: offer.timeRemainingSeconds,
          offeredAt: offer.offeredAt.toISOString(),
          trip: {
            id: trip.id,
            title: trip.title,
            description: trip.description,
            departureTime: trip.departureTime,
            originName: trip.originName,
            originAddress: trip.originAddress,
            destName: trip.destName,
            destAddress: trip.destAddress,
            basePrice: trip.basePrice,
            platformFee: trip.platformFee,
            estimatedEarnings: estimatedEarnings,
            organizer: trip.organizer
          },
          urgency: offer.timeRemainingSeconds <= 10 ? 'critical' : 
                   offer.timeRemainingSeconds <= 30 ? 'high' : 'normal'
        }
      });
      
    } else {
      // Get all active offers (admin/monitoring view)
      const activeOffers = TripOfferingService.getActiveOffers();
      
      return NextResponse.json({
        success: true,
        data: {
          activeOffers: activeOffers,
          totalActive: activeOffers.length
        }
      });
    }
    
  } catch (error) {
    console.error('Get trip offers error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve trip offers' },
      { status: 500 }
    );
  }
}
