'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TripCard from './components/TripCard';
import { Trip } from '@/types/trip-types';
import RegistrationPromptModal from '@/components/modals/RegistrationPromptModal';
import { useRegistrationPrompt } from '@/hooks/useRegistrationPrompt';
import TripListingSchema from '@/components/seo/TripListingSchema';
import { TripListingSkeleton } from '@/components/skeletons/TripCardSkeleton';
import Pagination from '@/components/ui/Pagination';
import SortDropdown, { SortOption } from '@/components/filters/SortDropdown';

/**
 * Trips Page - Browse all available trips with filters (No registration required)
 */
export default function TripsPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // NEW: Read URL search params
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Registration prompt modal
  const registrationPrompt = useRegistrationPrompt({
    redirectUrl: selectedTrip ? `/trips/${selectedTrip.id}` : undefined,
    tripTitle: selectedTrip?.title,
  });
  
  // Filter states
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentSortOption, setCurrentSortOption] = useState<SortOption>({
    value: 'date-asc',
    label: 'Date: Soonest First',
    sortBy: 'departureTime',
    sortOrder: 'asc',
  });

  // Fetch trips from API
  useEffect(() => {
    // Read URL parameters on mount
    const origin = searchParams.get('origin_city') || '';
    const dest = searchParams.get('destination_city') || '';
    const date = searchParams.get('departure_date') || '';
    const tripType = searchParams.get('tripType') || '';
    const showAll = searchParams.get('show_all') || '';
    
    setOriginFilter(origin);
    setDestFilter(dest);
    setDateFilter(date);
    
    // Fetch trips with URL parameters
    fetchTrips({ 
      origin, 
      destination: dest, 
      date,
      tripType: tripType || (showAll === 'true' ? 'SHARED' : ''),
      showAll: showAll === 'true'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchParams]);

  const fetchTrips = async (filters?: { 
    origin?: string; 
    destination?: string; 
    date?: string;
    tripType?: string;
    showAll?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      params.append('sortBy', currentSortOption.sortBy);
      params.append('sortOrder', currentSortOption.sortOrder);
      if (filters?.origin) params.append('origin', filters.origin);
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.tripType) params.append('tripType', filters.tripType); // NEW
      if (filters?.showAll) params.append('show_all', 'true'); // NEW

      const response = await fetch(`/api/trips?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch trips');
      }

      setTrips(data.data || []);
      
      // Update pagination info
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    fetchTrips({
      origin: originFilter,
      destination: destFilter,
      date: dateFilter,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (option: SortOption) => {
    setCurrentSortOption(option);
    setCurrentPage(1); // Reset to first page on sort change
    // Trigger a new fetch with the updated sort
    setTimeout(() => fetchTrips(), 0);
  };

  const handleBook = (tripId: string) => {
    // Open registration prompt for non-authenticated users
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setSelectedTrip(trip);
      registrationPrompt.open();
    }
  };

  const handleViewDetails = (tripId: string) => {
    router.push(`/trips/${tripId}` as any);
  };

  return (
    <>
      {/* SEO: Structured Data for Search Engines */}
      {trips.length > 0 && <TripListingSchema trips={trips} />}

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
          <div className="grid md:grid-cols-5 gap-4">
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
            <SortDropdown
              currentSort={currentSortOption.value}
              onSortChange={handleSortChange}
            />
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
        {loading && <TripListingSkeleton count={6} />}

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
            <>
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  className="mt-12"
                />
              )}
            </>
          )
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Don&apos;t see a trip you like?
          </p>
          <a
            href="/trips/create"
            className="inline-block bg-primary-peranakan text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-200"
          >
            Create Your Own Trip
          </a>
        </div>
      </div>

      {/* Registration Prompt Modal */}
      <RegistrationPromptModal
        isOpen={registrationPrompt.isOpen}
        onClose={registrationPrompt.close}
        redirectUrl={registrationPrompt.redirectUrl}
        tripTitle={registrationPrompt.tripTitle}
      />
      </div>
    </>
  );
}
