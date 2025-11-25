'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { usePassengerWebSocket } from '@/hooks/usePassengerWebSocket';
import { DriverLocationUpdateEvent } from '@/types/realtime-events';
import { calculateETA } from '@/lib/utils/location';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues
const LiveTrackingMap = dynamic(
  () => import('@/components/tracking/LiveTrackingMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface TrackingData {
  canTrack: boolean;
  message?: string;
  hoursUntilDeparture?: number;
  booking: {
    id: string;
    status: string;
    seatsBooked: number;
    confirmedAt: string | null;
  };
  trip: {
    id: string;
    title: string;
    status: string;
    tripType: string;
    departureTime: string;
    returnTime: string;
    origin: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    };
    destination: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    };
  };
  driver: {
    id: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    vehicleType: string;
    vehicleModel: string;
    vehicleMake: string;
    vehicleColor: string | null;
    licensePlate: string;
    rating: number;
    reviewCount: number;
  } | null;
  driverLocation: {
    latitude: number;
    longitude: number;
    heading: number | null;
    speed: number | null;
    accuracy: number | null;
    lastUpdated: string;
  } | null;
  eta: {
    pickupMinutes: number;
    distance: number;
    isNearby: boolean;
  } | null;
  tenantId: string | null;
}

export default function TrackDriverPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<DriverLocationUpdateEvent | null>(null);

  // Fetch initial tracking data
  const fetchTrackingData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/passengers/bookings/${bookingId}/track`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tracking data');
      }

      const data = await response.json();
      setTrackingData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Set up WebSocket connection for live updates
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';
  const tripIds = trackingData ? [trackingData.trip.id] : [];

  const handleDriverLocation = useCallback((location: DriverLocationUpdateEvent) => {
    setLiveLocation(location);
    
    // Update ETA if tracking data exists
    if (trackingData?.trip) {
      const updatedEta = calculateETA(
        location.latitude,
        location.longitude,
        trackingData.trip.origin.latitude,
        trackingData.trip.origin.longitude,
        location.speed || 0
      );
      
      setTrackingData(prev => prev ? {
        ...prev,
        driverLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading || null,
          speed: location.speed || null,
          accuracy: location.accuracy || null,
          lastUpdated: location.timestamp,
        },
        eta: updatedEta,
      } : null);
    }
  }, [trackingData?.trip]);

  const { isConnected, driverLocation: wsDriverLocation } = usePassengerWebSocket({
    token,
    tripIds,
    enabled: !!trackingData?.canTrack && tripIds.length > 0,
    onDriverLocation: handleDriverLocation,
  });

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Tracking</h2>
            <p className="text-gray-600 mb-6">{error || 'An error occurred while loading tracking data'}</p>
            <div className="flex gap-3">
              <button
                onClick={fetchTrackingData}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <Link
                href={`/my-trips/${bookingId}`}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center"
              >
                Back to Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render not trackable state
  if (!trackingData.canTrack) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-blue-500 text-5xl mb-4">ℹ️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tracking Not Available</h2>
            <p className="text-gray-600 mb-6">
              {trackingData.message || 'Tracking is not available for this booking at this time.'}
            </p>
            {trackingData.hoursUntilDeparture !== undefined && trackingData.hoursUntilDeparture > 2 && (
              <p className="text-sm text-gray-500 mb-6">
                Tracking will be available {Math.floor(trackingData.hoursUntilDeparture - 2)} hours from now
              </p>
            )}
            <Link
              href={`/my-trips/${bookingId}`}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Booking Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentLocation = liveLocation || trackingData.driverLocation;
  const isDriverNearby = trackingData.eta?.isNearby || false;
  
  // Get the last updated timestamp - use timestamp for WebSocket data, lastUpdated for API data
  const lastUpdatedTime = liveLocation 
    ? liveLocation.timestamp 
    : trackingData.driverLocation?.lastUpdated;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/my-trips/${bookingId}`}
                className="text-blue-600 hover:text-blue-700 text-sm mb-1 inline-block"
              >
                ← Back to Booking
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Track Your Driver</h1>
              <p className="text-sm text-gray-600">{trackingData.trip.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-[500px] relative">
                <LiveTrackingMap
                  driverLocation={currentLocation ? {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    heading: currentLocation.heading,
                    speed: currentLocation.speed,
                  } : null}
                  pickupLocation={{
                    latitude: trackingData.trip.origin.latitude,
                    longitude: trackingData.trip.origin.longitude,
                    name: trackingData.trip.origin.name,
                  }}
                  destinationLocation={{
                    latitude: trackingData.trip.destination.latitude,
                    longitude: trackingData.trip.destination.longitude,
                    name: trackingData.trip.destination.name,
                  }}
                  showDestination={true}
                />
              </div>
              {currentLocation && lastUpdatedTime && (
                <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
                  Last updated: {format(new Date(lastUpdatedTime), 'HH:mm:ss')}
                  {currentLocation.accuracy && (
                    <span className="ml-3">Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Driver Nearby Alert */}
            {isDriverNearby && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🚗</div>
                  <div>
                    <h3 className="font-bold text-green-900">Driver is Nearby!</h3>
                    <p className="text-sm text-green-700">Less than 1 km away</p>
                  </div>
                </div>
              </div>
            )}

            {/* ETA Card */}
            {trackingData.eta && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Arrival</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {trackingData.eta.pickupMinutes} min
                  </div>
                  <p className="text-sm text-gray-600">
                    {trackingData.eta.distance.toFixed(1)} km away
                  </p>
                  {currentLocation?.speed && (
                    <p className="text-xs text-gray-500 mt-2">
                      Current speed: {currentLocation.speed.toFixed(0)} km/h
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Driver Info Card */}
            {trackingData.driver && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Driver</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                    {trackingData.driver.avatar ? (
                      <img
                        src={trackingData.driver.avatar}
                        alt={trackingData.driver.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{trackingData.driver.name}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>⭐ {trackingData.driver.rating.toFixed(1)}</span>
                      <span>({trackingData.driver.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium text-gray-900">
                      {trackingData.driver.vehicleMake} {trackingData.driver.vehicleModel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="font-medium text-gray-900">
                      {trackingData.driver.vehicleColor || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plate:</span>
                    <span className="font-medium text-gray-900 uppercase">
                      {trackingData.driver.licensePlate}
                    </span>
                  </div>
                </div>
                {trackingData.driver.phone && (
                  <a
                    href={`tel:${trackingData.driver.phone}`}
                    className="mt-4 block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                  >
                    📞 Call Driver
                  </a>
                )}
              </div>
            )}

            {/* Trip Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    trackingData.trip.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                    trackingData.trip.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {trackingData.trip.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Departure:</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {format(new Date(trackingData.trip.departureTime), 'PPp')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">From:</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {trackingData.trip.origin.name}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">To:</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {trackingData.trip.destination.name}
                  </p>
                </div>
              </div>
            </div>

            {/* No Driver Alert */}
            {!trackingData.driver && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ℹ️ A driver has not been assigned to this trip yet. Tracking will be available once a driver accepts your booking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
