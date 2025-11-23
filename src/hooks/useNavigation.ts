// React hook for trip navigation

import { useState, useEffect, useCallback } from 'react';
import type {
  NavigationRoute,
  NavigationUpdate,
  TripNavigation,
  Coordinates,
} from '@/lib/navigation/types';
import { calculateETA } from '@/lib/navigation/utils';

interface UseNavigationOptions {
  tripId: string;
  driverId: string;
  autoStart?: boolean;
  updateInterval?: number; // in milliseconds
}

interface UseNavigationReturn {
  navigation: TripNavigation | null;
  isLoading: boolean;
  error: string | null;
  isNavigating: boolean;
  startNavigation: (currentLocation: Coordinates) => Promise<void>;
  updateLocation: (location: Coordinates & { heading?: number; speed?: number; accuracy?: number }) => Promise<void>;
  stopNavigation: () => void;
  refreshRoute: () => Promise<void>;
}

export function useNavigation({
  tripId,
  driverId,
  autoStart = false,
  updateInterval = 5000,
}: UseNavigationOptions): UseNavigationReturn {
  const [navigation, setNavigation] = useState<TripNavigation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [locationUpdateTimer, setLocationUpdateTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch route for the trip
  const fetchRoute = useCallback(async (origin: Coordinates, destination: Coordinates) => {
    try {
      const response = await fetch('/api/navigation/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      return data.route;
    } catch (err) {
      console.error('Error fetching route:', err);
      throw err;
    }
  }, []);

  // Start navigation
  const startNavigation = useCallback(async (currentLocation: Coordinates) => {
    setIsLoading(true);
    setError(null);

    try {
      // Start navigation on server
      const response = await fetch(`/api/navigation/trips/${tripId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          currentLocation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start navigation');
      }

      const data = await response.json();
      const trip = data.trip;

      // Fetch the route
      const route = await fetchRoute(
        { lat: trip.origin.lat, lng: trip.origin.lng },
        { lat: trip.destination.lat, lng: trip.destination.lng }
      );

      setNavigation({
        tripId,
        origin: trip.origin,
        destination: trip.destination,
        route,
        currentLocation,
        status: 'active',
        startedAt: new Date(),
      });

      setIsNavigating(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [tripId, driverId, fetchRoute]);

  // Update location during navigation
  const updateLocation = useCallback(async (location: Coordinates & { heading?: number; speed?: number; accuracy?: number }) => {
    if (!isNavigating) return;

    try {
      const response = await fetch(`/api/navigation/trips/${tripId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          location,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      const data = await response.json();

      // Update navigation state
      setNavigation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentLocation: data.location,
        };
      });

      // Handle milestones
      if (data.milestone === 'arrived') {
        setIsNavigating(false);
        setNavigation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'completed',
            completedAt: new Date(),
          };
        });
      }
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err instanceof Error ? err.message : 'Failed to update location');
    }
  }, [tripId, driverId, isNavigating]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    if (locationUpdateTimer) {
      clearInterval(locationUpdateTimer);
      setLocationUpdateTimer(null);
    }
  }, [locationUpdateTimer]);

  // Refresh route
  const refreshRoute = useCallback(async () => {
    if (!navigation) return;

    setIsLoading(true);
    try {
      const route = await fetchRoute(
        navigation.currentLocation || navigation.origin,
        navigation.destination
      );
      setNavigation(prev => (prev ? { ...prev, route } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh route');
    } finally {
      setIsLoading(false);
    }
  }, [navigation, fetchRoute]);

  // Auto-update location using geolocation
  useEffect(() => {
    if (!isNavigating || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
          accuracy: position.coords.accuracy,
        };
        updateLocation(location);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Failed to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigating, updateLocation]);

  return {
    navigation,
    isLoading,
    error,
    isNavigating,
    startNavigation,
    updateLocation,
    stopNavigation,
    refreshRoute,
  };
}
