'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TripZone, getZoneInfo, getZoneDisplayName } from '@/lib/utils/tripZoneClassifier';
import { calculateTripFare, formatFare } from '@/lib/utils/fareEstimator';

interface KazakhstanTrip {
  id: string;
  title: string;
  description: string;
  zone: TripZone;
  estimatedDays: number;
  distance: number;
  departureTime: Date | string;
  returnTime: Date | string;
  originName: string;
  destName: string;
  tripType: 'PRIVATE' | 'SHARED';
  basePrice: number;
  availableSeats: number;
  status: string;
}

/**
 * Kazakhstan Trips Page - Browse trips by zone
 */
export default function KazakhstanTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<KazakhstanTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedZones, setSelectedZones] = useState<TripZone[]>([]);
  const [tripTypeFilter, setTripTypeFilter] = useState<'all' | 'PRIVATE' | 'SHARED'>('all');
  
  // Bundle states
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());
  const [showBundleSummary, setShowBundleSummary] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trips with zone information
      const params = new URLSearchParams();
      params.append('status', 'PUBLISHED');
      
      // Add zone filter if selected
      if (selectedZones.length > 0) {
        selectedZones.forEach(zone => params.append('zone', zone));
      }
      
      // Add trip type filter
      if (tripTypeFilter !== 'all') {
        params.append('tripType', tripTypeFilter);
      }

      const response = await fetch(`/api/trips/kazakhstan?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch trips');
      }

      setTrips(data.data || []);
    } catch (err) {
      console.error('Error fetching Kazakhstan trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleZoneToggle = (zone: TripZone) => {
    setSelectedZones(prev => {
      const newZones = new Set(prev);
      if (newZones.has(zone)) {
        newZones.delete(zone);
      } else {
        newZones.add(zone);
      }
      return Array.from(newZones);
    });
  };

  const handleTripSelection = (tripId: string) => {
    setSelectedTrips(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(tripId)) {
        newSelection.delete(tripId);
      } else {
        newSelection.add(tripId);
      }
      return newSelection;
    });
  };

  const handleProceedToBooking = () => {
    const selectedTripList = trips.filter(trip => selectedTrips.has(trip.id));
    
    if (selectedTripList.length === 0) {
      alert('Please select at least one trip to proceed');
      return;
    }

    if (selectedTripList.length === 1) {
      // Single trip booking - redirect to trip details page
      router.push(`/trips/${selectedTripList[0].id}`);
    } else {
      // Bundle booking - redirect to bundle configuration page
      const tripIds = Array.from(selectedTrips).join(',');
      router.push(`/trips/bundle?trips=${tripIds}`);
    }
  };

  const getSelectedTripsData = () => {
    return trips.filter(trip => selectedTrips.has(trip.id));
  };

  const calculateBundleStats = () => {
    const selectedTripList = getSelectedTripsData();
    const totalDays = selectedTripList.reduce((sum, trip) => sum + trip.estimatedDays, 0);
    const zones = new Set(selectedTripList.map(trip => trip.zone));
    
    return {
      count: selectedTripList.length,
      totalDays,
      zones: Array.from(zones),
    };
  };

  const zones = [TripZone.ZONE_A, TripZone.ZONE_B, TripZone.ZONE_C];
  const bundleStats = calculateBundleStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🇰🇿</span>
            <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white">
              Trips in Kazakhstan
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore Kazakhstan by zones - from quick day trips to multi-day expeditions
          </p>
        </div>

        {/* Zone Filter Chips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Filter by Zone
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select one or more zones to filter trips by duration and distance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {zones.map(zone => {
              const info = getZoneInfo(zone);
              const isSelected = selectedZones.includes(zone);
              
              return (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200
                    ${isSelected 
                      ? 'border-current shadow-lg scale-105' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  style={{
                    borderColor: isSelected ? info.borderColor : undefined,
                    backgroundColor: isSelected ? info.backgroundColor : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{info.emoji}</span>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {info.shortName}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {info.description}
                      </p>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">⏱</span>
                          <span className="text-gray-700 dark:text-gray-300">{info.durationRange}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📍</span>
                          <span className="text-gray-700 dark:text-gray-300">{info.distanceRange}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Trip Type Filter */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ride Type:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTripTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tripTypeFilter === 'all'
                    ? 'bg-primary-modernSg text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTripTypeFilter('PRIVATE')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tripTypeFilter === 'PRIVATE'
                    ? 'bg-primary-modernSg text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                👑 Private
              </button>
              <button
                onClick={() => setTripTypeFilter('SHARED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tripTypeFilter === 'SHARED'
                    ? 'bg-primary-modernSg text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                👥 Shared
              </button>
            </div>
            <button
              onClick={fetchTrips}
              className="ml-auto px-6 py-2 rounded-lg bg-primary-modernSg text-white font-semibold hover:bg-primary-modernSg/90 transition-colors"
            >
              Apply Filters
            </button>
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
          <div className="bg-[#1a1a1a] border border-[#ff0055]/30 rounded-xl p-6 mb-8 shadow-[0_0_15px_rgba(255,0,85,0.2)]">
            <p className="text-[#ff3366]">{error}</p>
            <button
              onClick={fetchTrips}
              className="mt-4 px-4 py-2 bg-[#ff0055]/10 border border-[#ff0055]/50 rounded-lg text-[#ff0055] hover:bg-[#ff0055]/20 hover:shadow-[0_0_10px_rgba(255,0,85,0.3)] transition-all duration-300"
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
                No trips available for the selected filters. Try adjusting your filters!
              </p>
              <button
                onClick={() => {
                  setSelectedZones([]);
                  setTripTypeFilter('all');
                  fetchTrips();
                }}
                className="text-primary-modernSg hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Available Trips ({trips.length})
                </h2>
                {selectedTrips.size > 0 && (
                  <button
                    onClick={() => setShowBundleSummary(!showBundleSummary)}
                    className="px-4 py-2 rounded-lg bg-primary-peranakan text-white font-semibold hover:shadow-lg transition-all"
                  >
                    {showBundleSummary ? 'Hide' : 'Show'} Bundle Summary ({selectedTrips.size})
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <TripZoneCard
                    key={trip.id}
                    trip={trip}
                    isSelected={selectedTrips.has(trip.id)}
                    onSelect={() => handleTripSelection(trip.id)}
                  />
                ))}
              </div>
            </>
          )
        )}

        {/* Bundle Summary Sidebar */}
        {showBundleSummary && selectedTrips.size > 0 && (
          <div className="fixed right-4 bottom-4 top-24 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Your Bundle
              </h3>
              <button
                onClick={() => setShowBundleSummary(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Trips:</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{bundleStats.count}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Days:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{bundleStats.totalDays}</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Zones:</span>
                <div className="flex flex-wrap gap-2">
                  {bundleStats.zones.map(zone => {
                    const info = getZoneInfo(zone);
                    return (
                      <span
                        key={zone}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: info.backgroundColor,
                          color: info.color,
                        }}
                      >
                        {info.emoji} {info.shortName}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selected Trips:
              </h4>
              {getSelectedTripsData().map(trip => (
                <div
                  key={trip.id}
                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{trip.title}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {trip.originName} → {trip.destName}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleProceedToBooking}
              className="w-full py-3 rounded-lg bg-primary-peranakan text-white font-bold hover:shadow-xl transition-all"
            >
              Proceed to Booking →
            </button>
          </div>
        )}

        {/* Floating Action Button for Mobile */}
        {selectedTrips.size > 0 && !showBundleSummary && (
          <button
            onClick={handleProceedToBooking}
            className="fixed bottom-4 right-4 md:hidden px-6 py-4 rounded-full bg-primary-peranakan text-white font-bold shadow-2xl hover:shadow-3xl transition-all z-50"
          >
            Book {selectedTrips.size} Trip{selectedTrips.size > 1 ? 's' : ''} →
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Trip Zone Card Component
 */
interface TripZoneCardProps {
  trip: KazakhstanTrip;
  isSelected: boolean;
  onSelect: () => void;
}

function TripZoneCard({ trip, isSelected, onSelect }: TripZoneCardProps) {
  const zoneInfo = getZoneInfo(trip.zone);
  
  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden
        transition-all duration-200 cursor-pointer hover:shadow-lg
        ${isSelected ? 'ring-4 ring-primary-modernSg scale-105' : ''}
      `}
      onClick={onSelect}
    >
      {/* Zone Badge */}
      <div
        className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
        style={{
          backgroundColor: zoneInfo.backgroundColor,
          color: zoneInfo.color,
        }}
      >
        {zoneInfo.emoji} {zoneInfo.shortName}
      </div>

      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all duration-200
            ${isSelected 
              ? 'bg-primary-modernSg border-primary-modernSg' 
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
            }
          `}
        >
          {isSelected && <span className="text-white text-sm">✓</span>}
        </div>
      </div>

      <div className="p-6 pt-12">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {trip.title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {trip.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">📍</span>
            <span className="text-gray-700 dark:text-gray-300">
              {trip.originName} → {trip.destName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">🗓️</span>
            <span className="text-gray-700 dark:text-gray-300">
              {trip.estimatedDays} day{trip.estimatedDays > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">🚗</span>
            <span className="text-gray-700 dark:text-gray-300">
              {trip.distance.toFixed(0)} km
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">
              {trip.tripType === 'PRIVATE' ? '👑' : '👥'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {trip.tripType === 'PRIVATE' ? 'Private' : 'Shared'}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Starting from</span>
            <span className="text-xl font-bold text-primary-modernSg">
              {formatFare(trip.basePrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
