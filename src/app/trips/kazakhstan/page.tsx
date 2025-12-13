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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 🎮 Gaming Neon Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
          {/* Animated neon gradient overlay */}
          <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-[#00f0ff]/20 via-transparent to-[#cc00ff]/20 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}></div>
          
          {/* Floating neon orbs for gaming atmosphere */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-20 w-48 h-48 bg-[#cc00ff]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00ff88]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with Neon Glow */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🇰🇿</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]">
              Trips in <span className="text-[#00f0ff]">Kazakhstan</span>
            </h1>
          </div>
          
          {/* 🎮 Stylized Zone Legend Banner */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/30 rounded-2xl p-6 shadow-neon-cyan mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🗺️</span>
              <h2 className="text-2xl font-display font-bold text-white">
                Day Trips to <span className="text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">Multi-Day Expeditions</span>
              </h2>
            </div>
            <p className="text-lg text-[#b3b3b3] leading-relaxed">
              Explore Kazakhstan by zones - from quick city escapes to epic cross-country adventures. 
              Each zone is carefully classified by distance and duration for your perfect journey.
            </p>
          </div>
        </div>

        {/* Zone Filter Chips - Gaming Neon Style */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#cc00ff]/20 rounded-2xl shadow-neon-purple p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-2">
              Filter by <span className="text-[#cc00ff] drop-shadow-[0_0_10px_rgba(204,0,255,0.5)]">Zone</span>
            </h2>
            <p className="text-sm text-[#b3b3b3]">
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
                    relative p-4 rounded-xl border-2 transition-all duration-300
                    ${isSelected 
                      ? 'border-current shadow-neon-cyan scale-105 bg-[#1a1a1a]' 
                      : 'border-[#252525] bg-[#111111]/50 hover:border-[#00f0ff]/40 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                    }
                  `}
                  style={{
                    borderColor: isSelected ? info.borderColor : undefined,
                    boxShadow: isSelected ? `0 0 20px ${info.borderColor}40` : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{info.emoji}</span>
                    <div className="flex-1 text-left">
                      <h3 className="font-display font-semibold text-white mb-1">
                        {info.shortName}
                      </h3>
                      <p className="text-xs text-[#808080] mb-2">
                        {info.description}
                      </p>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#666666]">⏱</span>
                          <span className="text-[#b3b3b3]">{info.durationRange}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#666666]">📍</span>
                          <span className="text-[#b3b3b3]">{info.distanceRange}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#00ff88] flex items-center justify-center shadow-neon-green">
                      <span className="text-[#0a0a0a] text-sm font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Trip Type Filter - Neon Gaming Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-semibold font-display text-[#b3b3b3]">
              Ride Type:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTripTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all duration-300 min-h-[44px] ${
                  tripTypeFilter === 'all'
                    ? 'bg-[#00f0ff] text-[#0a0a0a] shadow-neon-cyan'
                    : 'bg-[#1a1a1a] border border-[#252525] text-[#b3b3b3] hover:border-[#00f0ff]/50 hover:text-[#00f0ff] hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTripTypeFilter('PRIVATE')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all duration-300 min-h-[44px] ${
                  tripTypeFilter === 'PRIVATE'
                    ? 'bg-[#cc00ff] text-white shadow-neon-purple'
                    : 'bg-[#1a1a1a] border border-[#252525] text-[#b3b3b3] hover:border-[#cc00ff]/50 hover:text-[#cc00ff] hover:shadow-[0_0_10px_rgba(204,0,255,0.2)]'
                }`}
              >
                👑 Private
              </button>
              <button
                onClick={() => setTripTypeFilter('SHARED')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all duration-300 min-h-[44px] ${
                  tripTypeFilter === 'SHARED'
                    ? 'bg-[#00ff88] text-[#0a0a0a] shadow-neon-green'
                    : 'bg-[#1a1a1a] border border-[#252525] text-[#b3b3b3] hover:border-[#00ff88]/50 hover:text-[#00ff88] hover:shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                }`}
              >
                👥 Shared
              </button>
            </div>
            <button
              onClick={fetchTrips}
              className="ml-auto px-6 py-2 rounded-lg bg-[#00f0ff] text-[#0a0a0a] font-display font-bold hover:shadow-neon-cyan-lg hover:scale-105 transition-all duration-300 min-h-[44px]"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Loading State - Neon Gaming Style */}
        {loading && (
          <div className="text-center py-16">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-[#252525] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin shadow-neon-cyan"></div>
            </div>
            <p className="text-[#b3b3b3] font-display">Loading trips...</p>
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
            <div className="text-center py-16 bg-[#1a1a1a]/50 backdrop-blur-sm rounded-2xl border border-[#252525]">
              <p className="text-[#808080] text-lg mb-4 font-display">
                No trips available for the selected filters. Try adjusting your filters!
              </p>
              <button
                onClick={() => {
                  setSelectedZones([]);
                  setTripTypeFilter('all');
                  fetchTrips();
                }}
                className="text-[#00f0ff] hover:text-[#00f0ff]/80 font-display font-semibold hover:drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-white">
                  Available <span className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Trips</span> ({trips.length})
                </h2>
                {selectedTrips.size > 0 && (
                  <button
                    onClick={() => setShowBundleSummary(!showBundleSummary)}
                    className="px-4 py-2 rounded-lg bg-[#cc00ff] text-white font-display font-semibold hover:shadow-neon-purple-lg hover:scale-105 transition-all duration-300 min-h-[44px]"
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

        {/* Bundle Summary Sidebar - Neon Gaming Style */}
        {showBundleSummary && selectedTrips.size > 0 && (
          <div className="fixed right-4 bottom-4 top-24 w-80 bg-[#1a1a1a]/95 backdrop-blur-lg border border-[#00f0ff]/30 rounded-2xl shadow-neon-cyan p-6 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-white">
                Your <span className="text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">Bundle</span>
              </h3>
              <button
                onClick={() => setShowBundleSummary(false)}
                className="text-[#808080] hover:text-[#ff0055] transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-lg">
                <span className="text-sm font-semibold font-display text-[#b3b3b3]">Total Trips:</span>
                <span className="text-lg font-bold text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">{bundleStats.count}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg">
                <span className="text-sm font-semibold font-display text-[#b3b3b3]">Estimated Days:</span>
                <span className="text-lg font-bold text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">{bundleStats.totalDays}</span>
              </div>
              <div className="p-3 bg-[#cc00ff]/10 border border-[#cc00ff]/20 rounded-lg">
                <span className="text-sm font-semibold font-display text-[#b3b3b3] block mb-2">Zones:</span>
                <div className="flex flex-wrap gap-2">
                  {bundleStats.zones.map(zone => {
                    const info = getZoneInfo(zone);
                    return (
                      <span
                        key={zone}
                        className="px-2 py-1 rounded text-xs font-semibold font-display border"
                        style={{
                          backgroundColor: `${info.borderColor}20`,
                          borderColor: `${info.borderColor}40`,
                          color: info.borderColor,
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
              <h4 className="text-sm font-display font-semibold text-[#b3b3b3] mb-2">
                Selected Trips:
              </h4>
              {getSelectedTripsData().map(trip => (
                <div
                  key={trip.id}
                  className="p-2 bg-[#111111] border border-[#252525] rounded-lg text-sm"
                >
                  <div className="font-semibold font-display text-white">{trip.title}</div>
                  <div className="text-xs text-[#808080]">
                    {trip.originName} → {trip.destName}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleProceedToBooking}
              className="w-full py-3 rounded-lg bg-[#00ff88] text-[#0a0a0a] font-display font-bold hover:shadow-neon-green-lg hover:scale-105 transition-all duration-300"
            >
              Proceed to Booking →
            </button>
          </div>
        )}

        {/* Floating Action Button for Mobile - Neon Gaming Style */}
        {selectedTrips.size > 0 && !showBundleSummary && (
          <button
            onClick={handleProceedToBooking}
            className="fixed bottom-4 right-4 md:hidden px-6 py-4 rounded-full bg-[#00ff88] text-[#0a0a0a] font-display font-bold shadow-neon-green-lg hover:scale-110 transition-all duration-300 z-50 min-h-[48px]"
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
        relative bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#252525] rounded-2xl overflow-hidden
        transition-all duration-300 cursor-pointer hover:border-[#00f0ff]/50 hover:shadow-neon-cyan
        ${isSelected ? 'ring-2 ring-[#00f0ff] shadow-neon-cyan scale-105 border-[#00f0ff]' : 'hover:scale-105'}
      `}
      onClick={onSelect}
    >
      {/* Zone Badge - Neon Style */}
      <div
        className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold font-display z-10 border"
        style={{
          backgroundColor: `${zoneInfo.borderColor}20`,
          borderColor: `${zoneInfo.borderColor}40`,
          color: zoneInfo.borderColor,
          boxShadow: `0 0 10px ${zoneInfo.borderColor}30`,
        }}
      >
        {zoneInfo.emoji} {zoneInfo.shortName}
      </div>

      {/* Selection Checkbox - Neon Style */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all duration-300
            ${isSelected 
              ? 'bg-[#00ff88] border-[#00ff88] shadow-neon-green' 
              : 'bg-[#111111] border-[#252525] hover:border-[#00f0ff]/50'
            }
          `}
        >
          {isSelected && <span className="text-[#0a0a0a] text-sm font-bold">✓</span>}
        </div>
      </div>

      <div className="p-6 pt-12">
        <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-[#00f0ff] transition-colors">
          {trip.title}
        </h3>
        
        <p className="text-sm text-[#808080] mb-4 line-clamp-2">
          {trip.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#666666]">📍</span>
            <span className="text-[#b3b3b3]">
              {trip.originName} → {trip.destName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#666666]">🗓️</span>
            <span className="text-[#b3b3b3]">
              {trip.estimatedDays} day{trip.estimatedDays > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#666666]">🚗</span>
            <span className="text-[#b3b3b3]">
              {trip.distance.toFixed(0)} km
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#666666]">
              {trip.tripType === 'PRIVATE' ? '👑' : '👥'}
            </span>
            <span className="text-[#b3b3b3]">
              {trip.tripType === 'PRIVATE' ? 'Private' : 'Shared'}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#252525]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#808080] font-display">Starting from</span>
            <span className="text-xl font-display font-bold text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">
              {formatFare(trip.basePrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
