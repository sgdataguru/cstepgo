/**
 * Custom hook for driver real-time WebSocket connection
 * Manages trip offers, status updates, and notifications for drivers
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  TripOfferEvent,
  TripStatusUpdateEvent,
  NotificationEvent,
  REALTIME_EVENTS,
} from '@/types/realtime-events';
import { SOCKET_IO_PATH } from '@/lib/constants/chat';
import {
  WEBSOCKET_RECONNECT_DELAY,
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
} from '@/lib/constants/realtime';

interface UseDriverWebSocketOptions {
  token: string;
  enabled?: boolean;
  filters?: {
    maxDistance?: number;
    minEarnings?: number;
    tripTypes?: ('PRIVATE' | 'SHARED')[];
    acceptsLongDistance?: boolean;
  };
  onTripOffer?: (offer: TripOfferEvent) => void;
  onTripStatusUpdate?: (update: TripStatusUpdateEvent) => void;
  onNotification?: (notification: NotificationEvent) => void;
}

interface UseDriverWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isSubscribed: boolean;
  tripOffers: TripOfferEvent[];
  acceptOffer: (tripId: string) => void;
  declineOffer: (tripId: string, reason?: string) => void;
  updateLocation: (location: {
    tripId?: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  }) => void;
  clearOffer: (tripId: string) => void;
  error: string | null;
}

/**
 * Hook for managing driver's real-time WebSocket connection
 */
export function useDriverWebSocket({
  token,
  enabled = true,
  filters,
  onTripOffer,
  onTripStatusUpdate,
  onNotification,
}: UseDriverWebSocketOptions): UseDriverWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [tripOffers, setTripOffers] = useState<TripOfferEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const reconnectAttemptsRef = useRef(0);
  const subscriptionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !token) {
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
      console.log('Driver WebSocket connected');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
      
      // Subscribe to trip offers after connection
      subscriptionTimerRef.current = setTimeout(() => {
        socketInstance.emit('driver:subscribe', { filters });
      }, 500);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Driver WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsSubscribed(false);
    });

    socketInstance.on('driver:subscribed', (data: { message: string }) => {
      console.log('Driver subscribed to trip offers:', data.message);
      setIsSubscribed(true);
    });

    socketInstance.on('driver:unsubscribed', (data: { message: string }) => {
      console.log('Driver unsubscribed:', data.message);
      setIsSubscribed(false);
    });

    // Handle trip offer events
    socketInstance.on(REALTIME_EVENTS.TRIP_OFFER_CREATED, (offer: TripOfferEvent) => {
      console.log('New trip offer received:', offer.tripId);
      setTripOffers((prev) => {
        // Avoid duplicates
        const exists = prev.some(o => o.tripId === offer.tripId);
        if (exists) return prev;
        return [...prev, offer];
      });
      onTripOffer?.(offer);
    });

    socketInstance.on(REALTIME_EVENTS.TRIP_OFFER_EXPIRED, (data: { tripId: string; reason: string }) => {
      console.log('Trip offer expired:', data.tripId);
      setTripOffers((prev) => prev.filter(o => o.tripId !== data.tripId));
    });

    socketInstance.on('trip:offer:preliminary_accepted', (data: { tripId: string; message: string }) => {
      console.log('Trip offer preliminary accepted:', data.tripId);
      // UI can show loading state
    });

    socketInstance.on('trip:offer:declined', (data: { tripId: string; message: string }) => {
      console.log('Trip offer declined:', data.tripId);
      setTripOffers((prev) => prev.filter(o => o.tripId !== data.tripId));
    });

    socketInstance.on('trip:offer:error', (data: { tripId: string; message: string }) => {
      console.error('Trip offer error:', data.message);
      setError(data.message);
    });

    // Handle trip status updates
    socketInstance.on(REALTIME_EVENTS.TRIP_STATUS_UPDATED, (update: TripStatusUpdateEvent) => {
      console.log('Trip status updated:', update.tripId, update.newStatus);
      onTripStatusUpdate?.(update);
    });

    // Handle notifications
    socketInstance.on(REALTIME_EVENTS.NOTIFICATION_DRIVER, (notification: NotificationEvent) => {
      console.log('Driver notification received:', notification.title);
      onNotification?.(notification);
    });

    socketInstance.on('driver:location:updated', (data: { message: string }) => {
      // Location update acknowledged
      console.log('Location updated:', data.message);
    });

    socketInstance.on('error', (errorData: { message: string }) => {
      console.error('Driver WebSocket error:', errorData);
      setError(errorData.message);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Driver WebSocket connection error:', err);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current >= WEBSOCKET_MAX_RECONNECT_ATTEMPTS) {
        setError('Failed to connect to real-time server. Please refresh the page.');
      }
    });

    setSocket(socketInstance);

    return () => {
      if (subscriptionTimerRef.current) {
        clearTimeout(subscriptionTimerRef.current);
      }
      socketInstance.disconnect();
    };
  }, [enabled, token, filters, onTripOffer, onTripStatusUpdate, onNotification]);

  // Accept a trip offer
  const acceptOffer = useCallback(
    (tripId: string) => {
      if (!socket || !isConnected) {
        setError('Not connected to real-time server');
        return;
      }

      socket.emit('trip:offer:accept', { tripId });
      
      // Optimistically remove from offers list
      setTripOffers((prev) => prev.filter(o => o.tripId !== tripId));
    },
    [socket, isConnected]
  );

  // Decline a trip offer
  const declineOffer = useCallback(
    (tripId: string, reason?: string) => {
      if (!socket || !isConnected) {
        return;
      }

      socket.emit('trip:offer:decline', { tripId, reason });
      
      // Remove from offers list
      setTripOffers((prev) => prev.filter(o => o.tripId !== tripId));
    },
    [socket, isConnected]
  );

  // Update driver location
  const updateLocation = useCallback(
    (location: {
      tripId?: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
    }) => {
      if (!socket || !isConnected) {
        return;
      }

      socket.emit('driver:location:update', location);
    },
    [socket, isConnected]
  );

  // Clear a specific offer from the list
  const clearOffer = useCallback((tripId: string) => {
    setTripOffers((prev) => prev.filter(o => o.tripId !== tripId));
  }, []);

  return {
    socket,
    isConnected,
    isSubscribed,
    tripOffers,
    acceptOffer,
    declineOffer,
    updateLocation,
    clearOffer,
    error,
  };
}
