/**
 * Real-Time Event Broadcasting Service
 * Manages WebSocket event broadcasting for trip offers, status updates, and notifications
 */

import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/prisma';
import {
  RealtimeEvent,
  TripOfferEvent,
  TripStatusUpdateEvent,
  DriverLocationUpdateEvent,
  NotificationEvent,
  SOCKET_ROOMS,
  REALTIME_EVENTS,
  DriverSubscription,
  PassengerSubscription,
} from '@/types/realtime-events';
import {
  DEFAULT_DISCOVERY_RADIUS,
  DRIVER_EARNINGS_RATE,
  TRIP_OFFER_DEFAULT_TIMEOUT,
  TRIP_OFFER_URGENT_TIMEOUT,
  TRIP_OFFER_HIGH_TIMEOUT,
} from '@/lib/constants/realtime';

/**
 * Singleton class for managing real-time event broadcasting
 */
class RealtimeBroadcastService {
  private io: SocketIOServer | null = null;
  private driverSubscriptions = new Map<string, DriverSubscription>();
  private passengerSubscriptions = new Map<string, PassengerSubscription>();

  /**
   * Initialize the service with a Socket.IO server instance
   */
  initialize(io: SocketIOServer): void {
    this.io = io;
    console.log('RealtimeBroadcastService initialized');
  }

  /**
   * Get the Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Subscribe a driver to trip offers based on their preferences
   */
  async subscribeDriver(subscription: DriverSubscription): Promise<void> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.driverSubscriptions.set(subscription.driverId, subscription);
    
    // Join driver-specific room
    const sockets = await this.io.in(SOCKET_ROOMS.user(subscription.userId)).fetchSockets();
    sockets.forEach(socket => {
      socket.join(SOCKET_ROOMS.driver(subscription.driverId));
    });

    console.log(`Driver ${subscription.driverId} subscribed to trip offers`);
  }

  /**
   * Unsubscribe a driver from trip offers
   */
  async unsubscribeDriver(driverId: string): Promise<void> {
    if (!this.io) {
      return;
    }

    this.driverSubscriptions.delete(driverId);
    
    // Leave driver-specific room
    const sockets = await this.io.in(SOCKET_ROOMS.driver(driverId)).fetchSockets();
    sockets.forEach(socket => {
      socket.leave(SOCKET_ROOMS.driver(driverId));
    });

    console.log(`Driver ${driverId} unsubscribed from trip offers`);
  }

  /**
   * Subscribe a passenger to trip updates
   */
  async subscribePassenger(subscription: PassengerSubscription): Promise<void> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.passengerSubscriptions.set(subscription.passengerId, subscription);
    
    // Join trip-specific rooms for all passenger's trips
    const sockets = await this.io.in(SOCKET_ROOMS.user(subscription.userId)).fetchSockets();
    sockets.forEach(socket => {
      subscription.tripIds.forEach(tripId => {
        socket.join(SOCKET_ROOMS.trip(tripId));
      });
    });

    console.log(`Passenger ${subscription.passengerId} subscribed to ${subscription.tripIds.length} trips`);
  }

  /**
   * Broadcast a trip offer to eligible drivers
   */
  async broadcastTripOffer(tripId: string): Promise<{ sent: number; eligible: number }> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    // Fetch trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Calculate urgency and deadline
    const departureTime = new Date(trip.departureTime);
    const now = new Date();
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let urgency: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
    let timeoutSeconds = TRIP_OFFER_DEFAULT_TIMEOUT;
    
    if (hoursUntilDeparture < 2) {
      urgency = 'urgent';
      timeoutSeconds = TRIP_OFFER_URGENT_TIMEOUT;
    } else if (hoursUntilDeparture < 6) {
      urgency = 'high';
      timeoutSeconds = TRIP_OFFER_HIGH_TIMEOUT;
    } else if (hoursUntilDeparture < 24) {
      urgency = 'normal';
    } else {
      urgency = 'low';
    }

    const acceptanceDeadline = new Date(now.getTime() + timeoutSeconds * 1000);

    // Calculate estimated earnings
    const totalFare = Number(trip.basePrice) + Number(trip.platformFee);
    const estimatedEarnings = Math.round(totalFare * DRIVER_EARNINGS_RATE);

    // Determine difficulty (simplified - could be enhanced)
    const distance = this.calculateDistance(
      trip.originLat,
      trip.originLng,
      trip.destLat,
      trip.destLng
    );
    
    let difficulty: 'easy' | 'normal' | 'challenging' | 'difficult' = 'normal';
    if (distance < 50) {
      difficulty = 'easy';
    } else if (distance < 200) {
      difficulty = 'normal';
    } else if (distance < 500) {
      difficulty = 'challenging';
    } else {
      difficulty = 'difficult';
    }

    // Determine trip type (default to PRIVATE if not specified)
    const tripType: 'PRIVATE' | 'SHARED' = (trip.tripType === 'SHARED') ? 'SHARED' : 'PRIVATE';

    // Find eligible drivers - now filtered by trip type preference
    const eligibleDrivers = await this.findEligibleDrivers(
      trip.originLat,
      trip.originLng,
      trip.driverDiscoveryRadius || DEFAULT_DISCOVERY_RADIUS,
      estimatedEarnings,
      tripType
    );

    let sentCount = 0;
    
    // Broadcast to each eligible driver
    for (const driver of eligibleDrivers) {
      const driverDistance = this.calculateDistance(
        trip.originLat,
        trip.originLng,
        driver.latitude,
        driver.longitude
      );

      const offerEvent: TripOfferEvent = {
        type: 'trip.offer.created',
        tripId: trip.id,
        tripType: trip.tripType || 'PRIVATE', // Include trip type
        title: trip.title,
        departureTime: trip.departureTime.toISOString(),
        returnTime: trip.returnTime.toISOString(),
        originName: trip.originName,
        originAddress: trip.originAddress,
        originLat: trip.originLat,
        originLng: trip.originLng,
        destName: trip.destName,
        destAddress: trip.destAddress,
        destLat: trip.destLat,
        destLng: trip.destLng,
        totalSeats: trip.totalSeats,
        availableSeats: trip.availableSeats,
        bookedSeats: trip.totalSeats - trip.availableSeats, // Calculate booked seats
        basePrice: Number(trip.basePrice),
        pricePerSeat: trip.pricePerSeat 
          ? Number(trip.pricePerSeat) 
          : trip.totalSeats > 0 
            ? Number(trip.basePrice) / trip.totalSeats 
            : Number(trip.basePrice), // Fallback if totalSeats is 0
        platformFee: Number(trip.platformFee),
        estimatedEarnings,
        distance: driverDistance,
        acceptanceDeadline: acceptanceDeadline.toISOString(),
        urgency,
        difficulty,
        tenantId: trip.tenantId || undefined, // Include tenant context
        timestamp: new Date().toISOString(),
      };

      // Send to driver's room
      this.io.to(SOCKET_ROOMS.driver(driver.driverId)).emit(
        REALTIME_EVENTS.TRIP_OFFER_CREATED,
        offerEvent
      );

      // Log the offer in database
      await prisma.tripDriverVisibility.create({
        data: {
          tripId: trip.id,
          driverId: driver.userId,
          shownAt: new Date(),
        },
      });

      sentCount++;
    }

    console.log(`Trip offer ${tripId} broadcast to ${sentCount} drivers`);
    
    return {
      sent: sentCount,
      eligible: eligibleDrivers.length,
    };
  }

  /**
   * Broadcast trip status update
   */
  async broadcastTripStatusUpdate(
    tripId: string,
    previousStatus: string,
    newStatus: string,
    driverName?: string,
    notes?: string
  ): Promise<void> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        title: true,
        originName: true,
        destName: true,
      },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    const statusEvent: TripStatusUpdateEvent = {
      type: 'trip.status.updated',
      tripId: trip.id,
      tripTitle: trip.title,
      previousStatus: previousStatus as any,
      newStatus: newStatus as any,
      driverName,
      notes,
      originName: trip.originName,
      destName: trip.destName,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to trip room (all passengers and driver)
    this.io.to(SOCKET_ROOMS.trip(tripId)).emit(
      REALTIME_EVENTS.TRIP_STATUS_UPDATED,
      statusEvent
    );

    console.log(`Trip status update broadcast for trip ${tripId}: ${previousStatus} -> ${newStatus}`);
  }

  /**
   * Broadcast driver location update
   */
  async broadcastDriverLocation(
    tripId: string,
    driverId: string,
    location: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
    },
    eta?: {
      pickupMinutes?: number;
      destinationMinutes?: number;
    }
  ): Promise<void> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    const locationEvent: DriverLocationUpdateEvent = {
      type: 'driver.location.updated',
      tripId,
      driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading,
      speed: location.speed,
      accuracy: location.accuracy,
      eta,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to trip room (passengers only, not the driver themselves)
    this.io.to(SOCKET_ROOMS.trip(tripId)).except(SOCKET_ROOMS.driver(driverId)).emit(
      REALTIME_EVENTS.DRIVER_LOCATION_UPDATED,
      locationEvent
    );
  }

  /**
   * Send notification to a specific user
   */
  async sendNotification(
    userId: string,
    notification: Omit<NotificationEvent, 'timestamp'>
  ): Promise<void> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    const notificationEvent: NotificationEvent = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    this.io.to(SOCKET_ROOMS.user(userId)).emit(
      notification.type,
      notificationEvent
    );

    console.log(`Notification sent to user ${userId}: ${notification.title}`);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find eligible drivers within radius
   * @param originLat - Trip origin latitude
   * @param originLng - Trip origin longitude
   * @param radius - Maximum distance from origin in km
   * @param minEarnings - Minimum earnings threshold for filtering
   * @param tripType - Trip type for filtering drivers by preference (PRIVATE or SHARED)
   */
  private async findEligibleDrivers(
    originLat: number,
    originLng: number,
    radius: number,
    minEarnings: number,
    tripType: 'PRIVATE' | 'SHARED' = 'PRIVATE'
  ): Promise<Array<{ driverId: string; userId: string; latitude: number; longitude: number }>> {
    // Get all available drivers with location data
    // Also filter by trip type preferences from Driver model
    const drivers = await prisma.driver.findMany({
      where: {
        availability: 'AVAILABLE',
        status: 'APPROVED',
        // Filter by driver's trip type preferences stored in database
        ...(tripType === 'PRIVATE' 
          ? { accepts_private_trips: true }
          : { accepts_shared_trips: true }
        ),
      },
      include: {
        user: {
          include: {
            driverLocation: true,
          },
        },
      },
    });

    // Filter by distance and subscription preferences
    const eligible = drivers
      .filter(driver => {
        if (!driver.user.driverLocation) return false;

        const location = driver.user.driverLocation;
        const distance = this.calculateDistance(
          originLat,
          originLng,
          Number(location.latitude),
          Number(location.longitude)
        );

        // Check distance constraint
        if (distance > radius) return false;

        // Check subscription preferences if exists (real-time filter preferences)
        const subscription = this.driverSubscriptions.get(driver.id);
        if (subscription?.filters) {
          const filters = subscription.filters;
          
          // Check max distance preference
          if (filters.maxDistance && distance > filters.maxDistance) return false;
          
          // Check minimum earnings preference
          if (filters.minEarnings && minEarnings < filters.minEarnings) return false;
          
          // Check trip type preference from subscription
          // If driver has specified tripTypes filter, ensure current trip type is included
          if (filters.tripTypes && filters.tripTypes.length > 0) {
            if (!filters.tripTypes.includes(tripType)) {
              return false;
            }
          }
        }

        return true;
      })
      .map(driver => ({
        driverId: driver.id,
        userId: driver.userId,
        latitude: Number(driver.user.driverLocation!.latitude),
        longitude: Number(driver.user.driverLocation!.longitude),
      }));

    return eligible;
  }

  /**
   * Clean up inactive subscriptions
   */
  async cleanupInactiveSubscriptions(): Promise<void> {
    // This could be enhanced to remove subscriptions for offline users
    console.log('Subscription cleanup completed');
  }

  /**
   * Broadcast booking cancellation to driver
   */
  async broadcastBookingCancellation(data: {
    bookingId: string;
    tripId: string;
    driverId: string;
    userId: string;
    seatsReleased: number;
    reason: string;
  }): Promise<void> {
    if (!this.io) {
      console.warn('Socket.IO not initialized, cannot broadcast booking cancellation');
      return;
    }

    try {
      // Notify the assigned driver
      this.io.to(`driver:${data.driverId}`).emit('booking.cancelled', {
        bookingId: data.bookingId,
        tripId: data.tripId,
        seatsReleased: data.seatsReleased,
        reason: data.reason,
        timestamp: new Date().toISOString(),
      });

      // Emit to trip room with only non-sensitive info (for availability updates)
      this.io.to(`trip:${data.tripId}`).emit('trip.availability.updated', {
        tripId: data.tripId,
        seatsReleased: data.seatsReleased,
        timestamp: new Date().toISOString(),
      });

      console.log(`Booking cancellation broadcasted for booking ${data.bookingId} to driver ${data.driverId}`);
    } catch (error) {
      console.error('Error broadcasting booking cancellation:', error);
      throw error;
    }
  }

  /**
   * Broadcast seat availability update to all trip subscribers
   */
  async broadcastSeatAvailability(data: {
    tripId: string;
    availableSeats: number;
    totalSeats: number;
    status: string;
  }): Promise<void> {
    if (!this.io) {
      console.warn('Socket.IO not initialized, cannot broadcast seat availability');
      return;
    }

    try {
      const tripRoom = `trip:${data.tripId}`;
      const bookedSeats = data.totalSeats - data.availableSeats;

      this.io.to(tripRoom).emit('trip.seats.updated', {
        tripId: data.tripId,
        availableSeats: data.availableSeats,
        totalSeats: data.totalSeats,
        bookedSeats,
        status: data.status,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `Seat availability broadcast for trip ${data.tripId}: ${data.availableSeats} seats remaining (${bookedSeats}/${data.totalSeats} booked)`
      );
    } catch (error) {
      console.error('Error broadcasting seat availability:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realtimeBroadcastService = new RealtimeBroadcastService();
