/**
 * Enhanced Socket.IO server with real-time trip offers and status updates
 * Extends the existing chat functionality with driver/passenger real-time events
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';
import {
  SOCKET_ROOMS,
  REALTIME_EVENTS,
  DriverSubscription,
  PassengerSubscription,
} from '@/types/realtime-events';
import { WEBSOCKET_HEARTBEAT_INTERVAL } from '@/lib/constants/realtime';

/**
 * Setup real-time event handlers for a socket connection
 */
export function setupRealtimeHandlers(socket: Socket, io: SocketIOServer): void {
  const userId = socket.data.userId;
  const user = socket.data.user;

  console.log(`Setting up real-time handlers for user ${userId} (${user.role})`);

  // Join user's personal room
  socket.join(SOCKET_ROOMS.user(userId));

  // Handle driver subscription
  socket.on('driver:subscribe', async (data: {
    filters?: {
      maxDistance?: number;
      minEarnings?: number;
      tripTypes?: ('PRIVATE' | 'SHARED')[];
      acceptsLongDistance?: boolean;
    };
  }) => {
    try {
      if (user.role !== 'DRIVER') {
        socket.emit('error', { message: 'Only drivers can subscribe to trip offers' });
        return;
      }

      // Get driver profile
      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!driver) {
        socket.emit('error', { message: 'Driver profile not found' });
        return;
      }

      const subscription: DriverSubscription = {
        driverId: driver.id,
        userId,
        filters: data.filters,
      };

      await realtimeBroadcastService.subscribeDriver(subscription);

      socket.emit('driver:subscribed', {
        message: 'Successfully subscribed to trip offers',
        filters: data.filters,
      });

      console.log(`Driver ${driver.id} subscribed with filters:`, data.filters);
    } catch (error) {
      console.error('Error subscribing driver:', error);
      socket.emit('error', { message: 'Failed to subscribe to trip offers' });
    }
  });

  // Handle driver unsubscribe
  socket.on('driver:unsubscribe', async () => {
    try {
      if (user.role !== 'DRIVER') {
        return;
      }

      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (driver) {
        await realtimeBroadcastService.unsubscribeDriver(driver.id);
        socket.emit('driver:unsubscribed', {
          message: 'Successfully unsubscribed from trip offers',
        });
      }
    } catch (error) {
      console.error('Error unsubscribing driver:', error);
    }
  });

  // Handle passenger subscription to trip updates
  socket.on('passenger:subscribe', async (data: { tripIds: string[] }) => {
    try {
      const { tripIds } = data;

      if (!tripIds || tripIds.length === 0) {
        socket.emit('error', { message: 'No trip IDs provided' });
        return;
      }

      // Verify user has access to these trips
      const trips = await prisma.trip.findMany({
        where: {
          id: { in: tripIds },
          OR: [
            { organizerId: userId },
            { driverId: userId },
            {
              bookings: {
                some: {
                  userId,
                  status: { in: ['PENDING', 'CONFIRMED'] },
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      const accessibleTripIds = trips.map(t => t.id);

      // Join trip rooms
      accessibleTripIds.forEach(tripId => {
        socket.join(SOCKET_ROOMS.trip(tripId));
      });

      const subscription: PassengerSubscription = {
        passengerId: userId,
        userId,
        tripIds: accessibleTripIds,
      };

      await realtimeBroadcastService.subscribePassenger(subscription);

      socket.emit('passenger:subscribed', {
        message: 'Successfully subscribed to trip updates',
        tripIds: accessibleTripIds,
      });

      console.log(`User ${userId} subscribed to ${accessibleTripIds.length} trips`);
    } catch (error) {
      console.error('Error subscribing passenger:', error);
      socket.emit('error', { message: 'Failed to subscribe to trip updates' });
    }
  });

  // Handle trip offer acceptance
  socket.on('trip:offer:accept', async (data: { tripId: string }) => {
    try {
      const { tripId } = data;

      if (user.role !== 'DRIVER') {
        socket.emit('error', { message: 'Only drivers can accept trip offers' });
        return;
      }

      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!driver) {
        socket.emit('error', { message: 'Driver profile not found' });
        return;
      }

      // Check if trip is still available
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          id: true,
          status: true,
          driverId: true,
          acceptanceDeadline: true,
        },
      });

      if (!trip) {
        socket.emit('trip:offer:error', {
          tripId,
          message: 'Trip not found',
        });
        return;
      }

      if (trip.driverId) {
        socket.emit('trip:offer:error', {
          tripId,
          message: 'Trip already accepted by another driver',
        });
        return;
      }

      if (trip.acceptanceDeadline && new Date(trip.acceptanceDeadline) < new Date()) {
        socket.emit('trip:offer:error', {
          tripId,
          message: 'Offer has expired',
        });
        return;
      }

      // This is a preliminary acceptance - full acceptance logic handled by API
      socket.emit('trip:offer:preliminary_accepted', {
        tripId,
        message: 'Processing acceptance...',
      });

      console.log(`Driver ${driver.id} attempting to accept trip ${tripId}`);
    } catch (error) {
      console.error('Error accepting trip offer:', error);
      socket.emit('error', { message: 'Failed to accept trip offer' });
    }
  });

  // Handle trip offer decline
  socket.on('trip:offer:decline', async (data: { tripId: string; reason?: string }) => {
    try {
      const { tripId, reason } = data;

      if (user.role !== 'DRIVER') {
        return;
      }

      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!driver) {
        return;
      }

      // Log the decline
      await prisma.tripDriverVisibility.updateMany({
        where: {
          tripId,
          driverId: userId,
        },
        data: {
          responseAction: 'declined',
          responseAt: new Date(),
        },
      });

      socket.emit('trip:offer:declined', {
        tripId,
        message: 'Offer declined',
      });

      console.log(`Driver ${driver.id} declined trip ${tripId}${reason ? ': ' + reason : ''}`);
    } catch (error) {
      console.error('Error declining trip offer:', error);
    }
  });

  // Handle driver location update
  socket.on('driver:location:update', async (data: {
    tripId?: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  }) => {
    try {
      if (user.role !== 'DRIVER') {
        socket.emit('error', { message: 'Only drivers can update location' });
        return;
      }

      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!driver) {
        socket.emit('error', { message: 'Driver profile not found' });
        return;
      }

      const { tripId, latitude, longitude, heading, speed, accuracy } = data;

      // Update driver location in database
      await prisma.driverLocation.upsert({
        where: { driverId: userId },
        update: {
          latitude,
          longitude,
          heading,
          speed,
          accuracy,
          lastUpdated: new Date(),
          isActive: true,
        },
        create: {
          driverId: userId,
          latitude,
          longitude,
          heading,
          speed,
          accuracy,
          isActive: true,
        },
      });

      // If associated with an active trip, broadcast to passengers
      if (tripId) {
        await realtimeBroadcastService.broadcastDriverLocation(
          tripId,
          driver.id,
          { latitude, longitude, heading, speed, accuracy }
        );
      }

      socket.emit('driver:location:updated', {
        message: 'Location updated successfully',
      });
    } catch (error) {
      console.error('Error updating driver location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Send heartbeat periodically
  const heartbeatInterval = setInterval(() => {
    socket.emit(REALTIME_EVENTS.HEARTBEAT, {
      timestamp: new Date().toISOString(),
    });
  }, WEBSOCKET_HEARTBEAT_INTERVAL);

  // Cleanup on disconnect
  socket.on('disconnect', async () => {
    clearInterval(heartbeatInterval);
    
    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (driver) {
        await realtimeBroadcastService.unsubscribeDriver(driver.id);
      }
    }

    console.log(`User ${userId} disconnected from real-time events`);
  });
}
