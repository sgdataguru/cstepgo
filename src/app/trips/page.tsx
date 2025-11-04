'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TripCard from './components/TripCard';
import { Trip } from '@/types/trip-types';

/**
 * Trips Page - Browse all available trips with filters
 */
export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Fetch trips from API
  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async (filters?: { origin?: string; destination?: string; date?: string }) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filters?.origin) params.append('origin', filters.origin);
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.date) params.append('date', filters.date);

      const response = await fetch(`/api/trips?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch trips');
      }

      setTrips(data.data || []);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTrips({
      origin: originFilter,
      destination: destFilter,
      date: dateFilter,
    });
  };

  const handleBook = (tripId: string) => {
    // TODO: Implement booking flow in Gate 2
    router.push(`/trips/${tripId}` as any);
  };

  const handleViewDetails = (tripId: string) => {
    router.push(`/trips/${tripId}` as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Browse Trips
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find your perfect ride across Kazakhstan and Kyrgyzstan
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <input
                type="text"
                placeholder="Origin city"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <input
                type="text"
                placeholder="Destination city"
                value={destFilter}
                onChange={(e) => setDestFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSearch}
                className="w-full bg-primary-modernSg text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-modernSg/90 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-modernSg mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading trips...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => fetchTrips()}
              className="mt-4 text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Trip Cards Grid */}
        {!loading && !error && (
          trips.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                No trips available at the moment. Check back soon!
              </p>
              {(originFilter || destFilter || dateFilter) && (
                <button
                  onClick={() => {
                    setOriginFilter('');
                    setDestFilter('');
                    setDateFilter('');
                    fetchTrips();
                  }}
                  className="text-primary-modernSg hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onBookClick={() => handleBook(trip.id)}
                  onViewDetails={() => handleViewDetails(trip.id)}
                />
              ))}
            </div>
          )
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Don't see a trip you like?
          </p>
          <a
            href="/trips/create"
            className="inline-block bg-primary-peranakan text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-200"
          >
            Create Your Own Trip
          </a>
        </div>
      </div>
    </div>
  );
}
