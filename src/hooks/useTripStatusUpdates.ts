/**
 * Custom React hook for subscribing to real-time trip status updates via SSE
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { TripStatus } from '@prisma/client';

export interface TripStatusUpdate {
  type: 'connected' | 'status_update' | 'heartbeat' | 'error';
  tripId?: string;
  tripTitle?: string;
  currentStatus?: TripStatus;
  previousStatus?: TripStatus;
  newStatus?: TripStatus;
  driverName?: string;
  notes?: string;
  originName?: string;
  destName?: string;
  message?: string;
  timestamp: string;
}

export interface UseTripStatusUpdatesOptions {
  tripId: string;
  onStatusChange?: (update: TripStatusUpdate) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export interface UseTripStatusUpdatesResult {
  latestUpdate: TripStatusUpdate | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Hook to subscribe to real-time trip status updates
 */
export function useTripStatusUpdates({
  tripId,
  onStatusChange,
  onError,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseTripStatusUpdatesOptions): UseTripStatusUpdatesResult {
  const [latestUpdate, setLatestUpdate] = useState<TripStatusUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    // Don't connect if already connected or if tripId is not provided
    if (eventSourceRef.current || !tripId) {
      return;
    }

    try {
      const url = `/api/realtime/trip-status/${tripId}`;
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('SSE connection opened for trip:', tripId);
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: TripStatusUpdate = JSON.parse(event.data);
          
          setLatestUpdate(data);

          // Call callback for status changes
          if (data.type === 'status_update' && onStatusChange) {
            onStatusChange(data);
          }
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        const connectionError = new Error('Connection to trip status updates failed');
        setError(connectionError);
        
        if (onError) {
          onError(connectionError);
        }

        // Attempt to reconnect if autoReconnect is enabled
        if (autoReconnect && shouldReconnectRef.current) {
          console.log(`Attempting to reconnect in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      const connectionError = err instanceof Error ? err : new Error('Failed to establish SSE connection');
      setError(connectionError);
      
      if (onError) {
        onError(connectionError);
      }
    }
  }, [tripId, onStatusChange, onError, autoReconnect, reconnectInterval]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  // Connect on mount and cleanup on unmount
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    latestUpdate,
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}

/**
 * Simpler hook for just tracking the current status of a trip
 */
export function useTripStatus(tripId: string): {
  currentStatus: TripStatus | null;
  isConnected: boolean;
  error: Error | null;
} {
  const [currentStatus, setCurrentStatus] = useState<TripStatus | null>(null);

  const { latestUpdate, isConnected, error } = useTripStatusUpdates({
    tripId,
    onStatusChange: (update) => {
      if (update.newStatus) {
        setCurrentStatus(update.newStatus);
      }
    },
  });

  // Set initial status from first connection
  useEffect(() => {
    if (latestUpdate?.currentStatus) {
      setCurrentStatus(latestUpdate.currentStatus);
    }
  }, [latestUpdate?.currentStatus]);

  return {
    currentStatus,
    isConnected,
    error,
  };
}
