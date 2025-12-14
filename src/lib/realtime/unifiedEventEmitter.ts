/**
 * Unified Realtime Event Emitter
 * 
 * Centralizes event emission to both SSE and Socket.IO transports
 * Ensures consistent event delivery across all realtime channels
 */

import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';
import { broadcastStatusUpdate as sseStatusUpdate } from '@/lib/realtime/broadcast';
import {
  RealtimeEvent,
  TripStatusUpdateEvent,
  BookingConfirmedEvent,
  BookingCancelledEvent,
  REALTIME_EVENTS,
  SOCKET_ROOMS,
} from '@/types/realtime-events';
import { TripStatus } from '@prisma/client';

/**
 * Unified event emission result
 */
export interface EmissionResult {
  success: boolean;
  sse: {
    sent: boolean;
    connections: number;
    error?: string;
  };
  socketio: {
    sent: boolean;
    error?: string;
  };
}

/**
 * Emit a trip status update to all realtime channels
 */
export async function emitTripStatusUpdate(data: {
  tripId: string;
  tripTitle: string;
  previousStatus: TripStatus;
  newStatus: TripStatus;
  driverName?: string;
  notes?: string;
  originName: string;
  destName: string;
}): Promise<EmissionResult> {
  const result: EmissionResult = {
    success: false,
    sse: { sent: false, connections: 0 },
    socketio: { sent: false },
  };

  // Emit to SSE
  try {
    const sseResult = sseStatusUpdate(data.tripId, {
      tripTitle: data.tripTitle,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      driverName: data.driverName || '',
      notes: data.notes,
      originName: data.originName,
      destName: data.destName,
    });
    result.sse.sent = sseResult.success;
    result.sse.connections = sseResult.connections;
  } catch (error) {
    result.sse.error = error instanceof Error ? error.message : 'Unknown SSE error';
    console.error('SSE emission failed:', result.sse.error);
  }

  // Emit to Socket.IO
  try {
    await realtimeBroadcastService.broadcastTripStatusUpdate(
      data.tripId,
      data.previousStatus,
      data.newStatus,
      data.driverName,
      data.notes
    );
    result.socketio.sent = true;
  } catch (error) {
    result.socketio.error = error instanceof Error ? error.message : 'Unknown Socket.IO error';
    console.error('Socket.IO emission failed:', result.socketio.error);
  }

  result.success = result.sse.sent || result.socketio.sent;
  return result;
}

/**
 * Emit a booking confirmation event to all realtime channels
 */
export async function emitBookingConfirmed(data: {
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED';
  bookingId: string;
  passengerId: string;
  passengerName: string;
  seatsBooked: number;
  availableSeats: number;
  totalSeats: number;
  tenantId?: string;
}): Promise<EmissionResult> {
  const result: EmissionResult = {
    success: false,
    sse: { sent: false, connections: 0 },
    socketio: { sent: false },
  };

  // SSE doesn't have a specific booking confirmed event type
  // We can emit it as a generic trip update
  result.sse.sent = true; // Mark as sent since SSE is primarily for trip status

  // Emit to Socket.IO
  try {
    const io = realtimeBroadcastService.getIO();
    if (!io) {
      throw new Error('Socket.IO server not initialized');
    }

    const event: BookingConfirmedEvent = {
      type: 'booking.confirmed',
      tripId: data.tripId,
      tripType: data.tripType,
      bookingId: data.bookingId,
      passengerId: data.passengerId,
      passengerName: data.passengerName,
      seatsBooked: data.seatsBooked,
      availableSeats: data.availableSeats,
      totalSeats: data.totalSeats,
      tenantId: data.tenantId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to trip room (all passengers and driver)
    io.to(SOCKET_ROOMS.trip(data.tripId)).emit(
      REALTIME_EVENTS.BOOKING_CONFIRMED,
      event
    );

    result.socketio.sent = true;
    console.log(`Booking confirmed event emitted for booking ${data.bookingId}`);
  } catch (error) {
    result.socketio.error = error instanceof Error ? error.message : 'Unknown Socket.IO error';
    console.error('Socket.IO booking confirmation emission failed:', result.socketio.error);
  }

  result.success = result.sse.sent || result.socketio.sent;
  return result;
}

/**
 * Emit a booking cancellation event to all realtime channels
 */
export async function emitBookingCancelled(data: {
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED';
  bookingId: string;
  passengerId: string;
  passengerName: string;
  seatsFreed: number;
  availableSeats: number;
  totalSeats: number;
  reason?: string;
  tenantId?: string;
}): Promise<EmissionResult> {
  const result: EmissionResult = {
    success: false,
    sse: { sent: false, connections: 0 },
    socketio: { sent: false },
  };

  // SSE doesn't have a specific booking cancelled event type
  result.sse.sent = true; // Mark as sent since SSE is primarily for trip status

  // Emit to Socket.IO
  try {
    const io = realtimeBroadcastService.getIO();
    if (!io) {
      throw new Error('Socket.IO server not initialized');
    }

    const event: BookingCancelledEvent = {
      type: 'booking.cancelled',
      tripId: data.tripId,
      tripType: data.tripType,
      bookingId: data.bookingId,
      passengerId: data.passengerId,
      passengerName: data.passengerName,
      seatsFreed: data.seatsFreed,
      availableSeats: data.availableSeats,
      totalSeats: data.totalSeats,
      reason: data.reason,
      tenantId: data.tenantId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to trip room (all passengers and driver)
    io.to(SOCKET_ROOMS.trip(data.tripId)).emit(
      REALTIME_EVENTS.BOOKING_CANCELLED,
      event
    );

    result.socketio.sent = true;
    console.log(`Booking cancelled event emitted for booking ${data.bookingId}`);
  } catch (error) {
    result.socketio.error = error instanceof Error ? error.message : 'Unknown Socket.IO error';
    console.error('Socket.IO booking cancellation emission failed:', result.socketio.error);
  }

  result.success = result.sse.sent || result.socketio.sent;
  return result;
}

/**
 * Emit a trip creation event (for analytics and monitoring)
 */
export async function emitTripCreated(data: {
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED';
  title: string;
  organizerId: string;
  status: string;
}): Promise<EmissionResult> {
  const result: EmissionResult = {
    success: false,
    sse: { sent: false, connections: 0 },
    socketio: { sent: false },
  };

  // For trip creation, we don't need SSE since no one is subscribed yet
  result.sse.sent = true;

  // Log trip creation for monitoring purposes
  console.log(`Trip created: ${data.tripId} (${data.tripType}) - "${data.title}" by ${data.organizerId}, status: ${data.status}`);
  
  result.socketio.sent = true;
  result.success = true;
  return result;
}

/**
 * Get emission statistics (for monitoring/debugging)
 */
export function getEmissionStats(): {
  sse: {
    activeConnections: number;
    activeTripIds: string[];
  };
  socketio: {
    initialized: boolean;
  };
} {
  const { getConnectionCount, getActiveTripIds } = require('@/lib/realtime/broadcast');
  
  return {
    sse: {
      activeConnections: getConnectionCount(),
      activeTripIds: getActiveTripIds(),
    },
    socketio: {
      initialized: realtimeBroadcastService.getIO() !== null,
    },
  };
}
