/**
 * Custom hook for passenger real-time WebSocket connection
 * Manages trip status updates, driver location, and notifications for passengers
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  TripStatusUpdateEvent,
  DriverLocationUpdateEvent,
  NotificationEvent,
  BookingConfirmedEvent,
  BookingCancelledEvent,
  REALTIME_EVENTS,
} from '@/types/realtime-events';
import { SOCKET_IO_PATH } from '@/lib/constants/chat';
import {
  WEBSOCKET_RECONNECT_DELAY,
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
} from '@/lib/constants/realtime';

interface UsePassengerWebSocketOptions {
  token: string;
  tripIds: string[];
  enabled?: boolean;
  onTripStatusUpdate?: (update: TripStatusUpdateEvent) => void;
  onDriverLocation?: (location: DriverLocationUpdateEvent) => void;
  onNotification?: (notification: NotificationEvent) => void;
  onBookingConfirmed?: (booking: BookingConfirmedEvent) => void;
  onBookingCancelled?: (booking: BookingCancelledEvent) => void;
}

interface UsePassengerWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isSubscribed: boolean;
  driverLocation: DriverLocationUpdateEvent | null;
  error: string | null;
}

/**
 * Hook for managing passenger's real-time WebSocket connection
 */
export function usePassengerWebSocket({
  token,
  tripIds,
  enabled = true,
  onTripStatusUpdate,
  onDriverLocation,
  onNotification,
  onBookingConfirmed,
  onBookingCancelled,
}: UsePassengerWebSocketOptions): UsePassengerWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocationUpdateEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !token || tripIds.length === 0) {
      return;
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: SOCKET_IO_PATH,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: WEBSOCKET_RECONNECT_DELAY,
      reconnectionAttempts: WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
    });

    socketInstance.on('connect', () => {
      console.log('Passenger WebSocket connected');
      setIsConnected(true);
      setError(null);
      
      // Subscribe to trip updates after connection
      setTimeout(() => {
        socketInstance.emit('passenger:subscribe', { tripIds });
      }, 500);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Passenger WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsSubscribed(false);
    });

    socketInstance.on('passenger:subscribed', (data: { message: string; tripIds: string[] }) => {
      console.log('Passenger subscribed to trips:', data.tripIds);
      setIsSubscribed(true);
    });

    // Handle trip status updates
    socketInstance.on(REALTIME_EVENTS.TRIP_STATUS_UPDATED, (update: TripStatusUpdateEvent) => {
      console.log('Trip status updated:', update.tripId, update.newStatus);
      onTripStatusUpdate?.(update);
    });

    // Handle driver location updates
    socketInstance.on(REALTIME_EVENTS.DRIVER_LOCATION_UPDATED, (location: DriverLocationUpdateEvent) => {
      console.log('Driver location updated for trip:', location.tripId);
      setDriverLocation(location);
      onDriverLocation?.(location);
    });

    // Handle booking events
    socketInstance.on(REALTIME_EVENTS.BOOKING_CONFIRMED, (booking: BookingConfirmedEvent) => {
      console.log('Booking confirmed:', booking.bookingId);
      onBookingConfirmed?.(booking);
    });

    socketInstance.on(REALTIME_EVENTS.BOOKING_CANCELLED, (booking: BookingCancelledEvent) => {
      console.log('Booking cancelled:', booking.bookingId);
      onBookingCancelled?.(booking);
    });

    // Handle notifications
    socketInstance.on(REALTIME_EVENTS.NOTIFICATION_PASSENGER, (notification: NotificationEvent) => {
      console.log('Passenger notification received:', notification.title);
      onNotification?.(notification);
    });

    socketInstance.on('error', (errorData: { message: string }) => {
      console.error('Passenger WebSocket error:', errorData);
      setError(errorData.message);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Passenger WebSocket connection error:', err);
      setError('Failed to connect to real-time server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [
    enabled,
    token,
    JSON.stringify(tripIds), // Only re-connect if tripIds actually change
    onTripStatusUpdate,
    onDriverLocation,
    onNotification,
    onBookingConfirmed,
    onBookingCancelled,
  ]);

  return {
    socket,
    isConnected,
    isSubscribed,
    driverLocation,
    error,
  };
}
