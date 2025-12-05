'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getZoneInfo } from '@/lib/utils/tripZoneClassifier';
import { formatFare } from '@/lib/utils/fareEstimator';

interface BundleBookingData {
  tripIds: string[];
  adjustedDays: number;
  rideType: 'PRIVATE' | 'SHARED';
  fareEstimate: {
    privateFare: number;
    sharedFarePerSeat: number;
    currency: string;
  };
}

interface TripSummary {
  id: string;
  title: string;
  zone: string;
  originName: string;
  destName: string;
}

export default function BundleConfirmPage() {
  const router = useRouter();
  const [bundleData, setBundleData] = useState<BundleBookingData | null>(null);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load bundle data from session storage
    const storedData = sessionStorage.getItem('bundleBooking');
    if (!storedData) {
      router.push('/trips/kazakhstan');
      return;
    }

    const data = JSON.parse(storedData) as BundleBookingData;
    setBundleData(data);
    
    // Fetch trip summaries
    fetchTripSummaries(data.tripIds);
  }, [router]);

  const fetchTripSummaries = async (tripIds: string[]) => {
    try {
      const responses = await Promise.all(
        tripIds.map(id => fetch(`/api/trips/kazakhstan?id=${id}`))
      );
      const results = await Promise.all(responses.map(r => r.json()));
      
      const summaries = results
        .filter(r => r.success && r.data?.length > 0)
        .map(r => ({
          id: r.data[0].id,
          title: r.data[0].title,
          zone: r.data[0].zone,
          originName: r.data[0].originName,
          destName: r.data[0].destName,
        }));

      setTrips(summaries);
    } catch (error) {
      console.error('Error fetching trip summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!bundleData) return;

    setSubmitting(true);
    try {
      // Create bundle booking
      const response = await fetch('/api/trips/bundle/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripIds: bundleData.tripIds,
          totalDays: bundleData.adjustedDays,
          rideType: bundleData.rideType,
          estimatedFare: bundleData.fareEstimate.privateFare,
          farePerSeat: bundleData.fareEstimate.sharedFarePerSeat,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear session storage
        sessionStorage.removeItem('bundleBooking');
        
        // Redirect to booking confirmation or payment page
        router.push(`/booking/confirmed/${data.bundleId}`);
      } else {
        throw new Error(data.error || 'Failed to create bundle booking');
      }
    } catch (error) {
      console.error('Error creating bundle booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !bundleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-modernSg mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Preparing your booking...</p>
        </div>
      </div>
    );
  }

  const totalFare = bundleData.rideType === 'PRIVATE' 
    ? bundleData.fareEstimate.privateFare 
    : bundleData.fareEstimate.sharedFarePerSeat;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Confirm Your Bundle Booking
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Review your trip bundle before finalizing
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Bundle Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🗺️</span>
                Your Itinerary ({trips.length} trips)
              </h2>
              <div className="space-y-3">
                {trips.map((trip, index) => {
                  const zoneInfo = getZoneInfo(trip.zone as any);
                  return (
                    <div
                      key={trip.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-modernSg text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {trip.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {trip.originName} → {trip.destName}
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                        style={{
                          backgroundColor: zoneInfo.backgroundColor,
                          color: zoneInfo.color,
                        }}
                      >
                        {zoneInfo.emoji} {zoneInfo.shortName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duration & Ride Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>⚙️</span>
                Bundle Configuration
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Duration</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {bundleData.adjustedDays} Days
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ride Type</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {bundleData.rideType === 'PRIVATE' ? '👑 Private' : '👥 Shared'}
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                <span>ℹ️</span>
                Important Information
              </h3>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>This is a multi-trip bundle booking that will be managed as a single reservation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    {bundleData.rideType === 'PRIVATE' 
                      ? 'You will have exclusive use of the vehicle for all trips in this bundle.'
                      : 'You may share the vehicle with other travelers. Final cost depends on actual occupancy.'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Cancellation policies apply to the entire bundle.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Price Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Trips</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {trips.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Days</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {bundleData.adjustedDays}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {bundleData.rideType === 'PRIVATE' ? 'Private' : 'Shared'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                {bundleData.rideType === 'SHARED' && (
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Price per seat</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatFare(bundleData.fareEstimate.sharedFarePerSeat)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total Fare
                  </span>
                  <span className="text-2xl font-bold text-primary-modernSg">
                    {formatFare(totalFare)}
                  </span>
                </div>
                {bundleData.rideType === 'SHARED' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    * Final price may vary based on actual seat occupancy
                  </p>
                )}
              </div>

              {trips.length >= 2 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
                  <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                    <span>✨</span>
                    <span>Bundle discount applied!</span>
                  </p>
                </div>
              )}

              <button
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="w-full py-4 rounded-lg bg-primary-peranakan text-white font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm & Book'}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full mt-3 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
