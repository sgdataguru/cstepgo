'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TripCard from './components/TripCard';
import { Trip } from '@/types/trip-types';

/**
 * Inner component that uses search params
 */
function TripsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filter states
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tripTypeFilter, setTripTypeFilter] = useState<'all' | 'PRIVATE' | 'SHARED'>('all');
  
  // Check for success message from URL params (after creating a shared trip)
  useEffect(() => {
    const createdTripId = searchParams.get('created');
    const tripType = searchParams.get('type');
    
    if (createdTripId && tripType === 'shared') {
      setSuccessMessage('🎉 Your shared ride has been created and is now visible below!');
      
      // Clear the success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Clear URL params without page refresh
      window.history.replaceState({}, '', '/trips');
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch trips from API
  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async (filters?: { origin?: string; destination?: string; date?: string; tripType?: string }) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filters?.origin) params.append('origin', filters.origin);
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.tripType && filters.tripType !== 'all') {
        params.append('tripType', filters.tripType);
      }

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
      tripType: tripTypeFilter,
    });
  };

  const handleBook = (tripId: string) => {
    router.push(`/trips/${tripId}` as any);
  };

  const handleViewDetails = (tripId: string) => {
    router.push(`/trips/${tripId}` as any);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8">
        {/* Success Banner for newly created shared trips - Neon Green */}
        {successMessage && (
          <div className="mb-6 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-[#00ff88] font-medium">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-[#00ff88]/70 hover:text-[#00ff88]"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Browse <span className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Trips</span>
          </h1>
          <p className="text-lg text-[#b3b3b3]">
            Find your perfect ride across Kazakhstan and Kyrgyzstan
          </p>
        </div>

        {/* Filters - Gaming Card Style */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                From
              </label>
              <input
                type="text"
                placeholder="Origin city"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#00f0ff]/30 bg-[#111111] text-white placeholder-[#666666] focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                To
              </label>
              <input
                type="text"
                placeholder="Destination city"
                value={destFilter}
                onChange={(e) => setDestFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#00f0ff]/30 bg-[#111111] text-white placeholder-[#666666] focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#00f0ff]/30 bg-[#111111] text-white focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                Ride Type
              </label>
              <select
                value={tripTypeFilter}
                onChange={(e) => setTripTypeFilter(e.target.value as 'all' | 'PRIVATE' | 'SHARED')}
                className="w-full px-4 py-2 rounded-lg border border-[#00f0ff]/30 bg-[#111111] text-white focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-all duration-300"
              >
                <option value="all">All Types</option>
                <option value="PRIVATE">👑 Private</option>
                <option value="SHARED">👥 Shared</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSearch}
                className="w-full bg-[#00f0ff] text-[#0a0a0a] px-6 py-2 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all duration-300"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Loading State - Neon Style */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] mx-auto mb-4"></div>
            <p className="text-[#808080]">Loading trips...</p>
          </div>
        )}

        {/* Error State - Neon Red */}
        {error && (
          <div className="bg-[#ff0055]/10 border border-[#ff0055]/30 rounded-xl p-6 mb-8">
            <p className="text-[#ff0055]">{error}</p>
            <button
              onClick={() => fetchTrips()}
              className="mt-4 text-[#ff0055] hover:text-[#ff3366] hover:underline transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Trip Cards Grid */}
        {!loading && !error && (
          trips.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#808080] text-lg mb-4">
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
                  className="text-[#00f0ff] hover:text-[#0099ff] hover:underline transition-colors"
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

        {/* Footer CTA - Neon Gradient */}
        <div className="mt-12 space-y-6">
          <div className="text-center">
            <p className="text-[#b3b3b3] mb-4">
              Explore trips by zone in Kazakhstan
            </p>
            <a
              href="/trips/kazakhstan"
              className="inline-block bg-gradient-to-r from-[#00f0ff] to-[#cc00ff] text-[#0a0a0a] px-8 py-3 rounded-lg font-semibold hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all duration-300 mb-4"
            >
              🇰🇿 Browse Kazakhstan Trips by Zone
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-[#b3b3b3] mb-4">
              Don't see a trip you like?
            </p>
            <a
              href="/trips/create"
              className="inline-block bg-[#cc00ff] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(204,0,255,0.5)] transition-all duration-300"
            >
              Create Your Own Trip
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Trips Page - Browse all available trips with filters
 */
export default function TripsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00f0ff] mx-auto mb-4"></div>
          <p className="text-[#808080]">Loading trips...</p>
        </div>
      </div>
    }>
      <TripsPageContent />
    </Suspense>
  );
}
