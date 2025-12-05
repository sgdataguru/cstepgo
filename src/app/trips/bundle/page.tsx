'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TripZone, getZoneInfo, calculateTripDurationHours } from '@/lib/utils/tripZoneClassifier';
import { 
  calculateBundleFare, 
  formatFare, 
  calculateSharedSavings,
  type FareEstimate 
} from '@/lib/utils/fareEstimator';

interface BundleTrip {
  id: string;
  title: string;
  zone: TripZone;
  estimatedDays: number;
  distance: number;
  departureTime: string;
  returnTime: string;
  originName: string;
  destName: string;
  basePrice: number;
}

function BundlePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<BundleTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Bundle configuration
  const [adjustedDays, setAdjustedDays] = useState(0);
  const [rideType, setRideType] = useState<'PRIVATE' | 'SHARED' | null>(null);
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);

  useEffect(() => {
    const tripIds = searchParams.get('trips');
    if (!tripIds) {
      setError('No trips selected');
      setLoading(false);
      return;
    }

    fetchBundleTrips(tripIds.split(','));
  }, [searchParams]);

  useEffect(() => {
    if (trips.length > 0) {
      calculateFare();
    }
  }, [trips, rideType]);

  const fetchBundleTrips = async (tripIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const responses = await Promise.all(
        tripIds.map(id => fetch(`/api/trips/kazakhstan?id=${id}`))
      );

      const results = await Promise.all(responses.map(r => r.json()));
      
      const fetchedTrips = results
        .filter(r => r.success && r.data?.length > 0)
        .map(r => r.data[0]);

      if (fetchedTrips.length === 0) {
        throw new Error('No valid trips found');
      }

      setTrips(fetchedTrips);
      
      // Set initial adjusted days to sum of estimated days
      const totalDays = fetchedTrips.reduce((sum, trip) => sum + trip.estimatedDays, 0);
      setAdjustedDays(totalDays);
    } catch (err) {
      console.error('Error fetching bundle trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = () => {
    if (trips.length === 0) return;

    const tripsData = trips.map(trip => ({
      zone: trip.zone,
      distance: trip.distance,
      durationHours: calculateTripDurationHours(
        new Date(trip.departureTime),
        new Date(trip.returnTime)
      ),
    }));

    const estimate = calculateBundleFare(tripsData);
    setFareEstimate(estimate);
  };

  const handleDaysAdjustment = (change: number) => {
    const minDays = trips.reduce((sum, trip) => sum + trip.estimatedDays, 0);
    const newDays = Math.max(minDays, adjustedDays + change);
    setAdjustedDays(newDays);
  };

  const handleProceedToBooking = () => {
    if (!rideType) {
      alert('Please select a ride type (Private or Shared)');
      return;
    }

    // Store bundle configuration in session storage
    const bundleData = {
      tripIds: trips.map(t => t.id),
      adjustedDays,
      rideType,
      fareEstimate,
    };
    sessionStorage.setItem('bundleBooking', JSON.stringify(bundleData));

    // Redirect to booking confirmation page
    router.push('/trips/bundle/confirm');
  };

  const totalBaseDays = trips.reduce((sum, trip) => sum + trip.estimatedDays, 0);
  const savings = rideType === 'SHARED' && fareEstimate 
    ? calculateSharedSavings(fareEstimate.privateFare, fareEstimate.sharedFarePerSeat)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-modernSg mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your bundle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md">
          <p className="text-red-800 dark:text-red-200 mb-4">{error}</p>
          <button
            onClick={() => router.push('/trips/kazakhstan')}
            className="text-red-600 dark:text-red-400 hover:underline"
          >
            ← Back to trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/trips/kazakhstan')}
            className="text-primary-modernSg hover:underline mb-4 flex items-center gap-2"
          >
            ← Back to trips
          </button>
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Configure Your Trip Bundle
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Customize your multi-trip itinerary and choose your ride preference
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Trip List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Trips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Selected Trips ({trips.length})
              </h2>
              <div className="space-y-3">
                {trips.map((trip, index) => {
                  const zoneInfo = getZoneInfo(trip.zone);
                  return (
                    <div
                      key={trip.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-modernSg text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {trip.title}
                            </h3>
                            <span
                              className="px-2 py-1 rounded text-xs font-bold"
                              style={{
                                backgroundColor: zoneInfo.backgroundColor,
                                color: zoneInfo.color,
                              }}
                            >
                              {zoneInfo.emoji} {zoneInfo.shortName}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span>{trip.originName} → {trip.destName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🗓️</span>
                              <span>{trip.estimatedDays} day{trip.estimatedDays > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🚗</span>
                              <span>{trip.distance.toFixed(0)} km</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duration Adjustment */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adjust Total Duration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Need more time? Add extra days to your itinerary for a more relaxed pace or additional exploration.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDaysAdjustment(-1)}
                  disabled={adjustedDays <= totalBaseDays}
                  className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-primary-modernSg">
                    {adjustedDays}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Days
                  </div>
                  {adjustedDays > totalBaseDays && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +{adjustedDays - totalBaseDays} extra day{adjustedDays - totalBaseDays > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDaysAdjustment(1)}
                  className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* Ride Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Choose Your Ride Type
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Private Ride Option */}
                <button
                  onClick={() => setRideType('PRIVATE')}
                  className={`
                    p-6 rounded-xl border-2 transition-all duration-200 text-left
                    ${rideType === 'PRIVATE'
                      ? 'border-primary-modernSg bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">👑</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Private Ride
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Exclusive vehicle just for you and your group. More privacy and flexibility.
                  </p>
                  {fareEstimate && (
                    <div className="text-2xl font-bold text-primary-modernSg">
                      {formatFare(fareEstimate.privateFare)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total for entire vehicle
                  </div>
                </button>

                {/* Shared Ride Option */}
                <button
                  onClick={() => setRideType('SHARED')}
                  className={`
                    p-6 rounded-xl border-2 transition-all duration-200 text-left
                    ${rideType === 'SHARED'
                      ? 'border-primary-modernSg bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">👥</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Shared Ride
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Share the vehicle with other travelers. More affordable and eco-friendly.
                  </p>
                  {fareEstimate && (
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatFare(fareEstimate.sharedFarePerSeat)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Per seat (up to 4 seats)
                  </div>
                  {savings && (
                    <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                      💰 Save {savings.savingsPercentage}% compared to private!
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Bundle Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Trips</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{trips.length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Days</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{adjustedDays}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Ride Type</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {rideType ? (rideType === 'PRIVATE' ? '👑 Private' : '👥 Shared') : 'Not selected'}
                  </span>
                </div>
              </div>

              {fareEstimate && rideType && (
                <>
                  <div className="bg-gradient-to-r from-primary-peranakan to-primary-modernSg rounded-lg p-4 mb-6 text-white">
                    <div className="text-sm opacity-90 mb-1">Estimated Fare</div>
                    <div className="text-3xl font-bold">
                      {rideType === 'PRIVATE' 
                        ? formatFare(fareEstimate.privateFare)
                        : `${formatFare(fareEstimate.sharedFarePerSeat)}/seat`
                      }
                    </div>
                    {trips.length >= 2 && (
                      <div className="text-xs opacity-90 mt-2">
                        ✨ Bundle discount applied!
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProceedToBooking}
                    className="w-full py-4 rounded-lg bg-primary-peranakan text-white font-bold text-lg hover:shadow-xl transition-all"
                  >
                    Proceed to Booking →
                  </button>
                </>
              )}

              {!rideType && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                  Please select a ride type to see the fare
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BundlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-modernSg mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bundle...</p>
        </div>
      </div>
    }>
      <BundlePageContent />
    </Suspense>
  );
}
