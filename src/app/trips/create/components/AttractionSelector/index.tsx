'use client';

import { useState, useEffect, useMemo } from 'react';
import { Attraction, Zone, VehicleType, calculateZonePrice, validateItinerary } from '@/lib/zones';
import ZoneSelector from './ZoneSelector';
import AttractionList from './AttractionList';
import PriceCalculator from './PriceCalculator';
import RouteValidator from './RouteValidator';

interface AttractionSelectorProps {
  vehicleType: VehicleType;
  passengers: number;
  onAttractionsChange: (attractionIds: string[]) => void;
  onPriceChange: (price: number) => void;
}

export default function AttractionSelector({
  vehicleType,
  passengers,
  onAttractionsChange,
  onPriceChange,
}: AttractionSelectorProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | 'ALL'>('ALL');
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttractionIds, setSelectedAttractionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch attractions on mount
  useEffect(() => {
    async function fetchAttractions() {
      try {
        setLoading(true);
        const response = await fetch('/api/attractions');
        const data = await response.json();

        if (data.success) {
          setAttractions(data.data);
        } else {
          setError(data.error || 'Failed to load attractions');
        }
      } catch (err) {
        console.error('Error fetching attractions:', err);
        setError('Failed to load attractions. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchAttractions();
  }, []);

  // Get selected attractions
  const selectedAttractions = useMemo(() => {
    return attractions.filter(a => selectedAttractionIds.includes(a.id));
  }, [attractions, selectedAttractionIds]);

  // Calculate price
  const priceCalculation = useMemo(() => {
    if (selectedAttractions.length === 0) {
      return null;
    }
    return calculateZonePrice(selectedAttractions, vehicleType, passengers);
  }, [selectedAttractions, vehicleType, passengers]);

  // Validate route
  const validation = useMemo(() => {
    if (selectedAttractions.length === 0) {
      return null;
    }
    return validateItinerary(selectedAttractions);
  }, [selectedAttractions]);

  // Update parent components
  useEffect(() => {
    onAttractionsChange(selectedAttractionIds);
  }, [selectedAttractionIds, onAttractionsChange]);

  useEffect(() => {
    if (priceCalculation) {
      onPriceChange(priceCalculation.totalPrice);
    }
  }, [priceCalculation, onPriceChange]);

  const handleToggleAttraction = (attractionId: string) => {
    setSelectedAttractionIds(prev => {
      if (prev.includes(attractionId)) {
        return prev.filter(id => id !== attractionId);
      } else {
        return [...prev, attractionId];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedAttractionIds([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-modernSg mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attractions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading attractions</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with selected count and clear button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Select Attractions</h2>
          <p className="text-gray-600 mt-1">
            Choose points of interest for your trip
            {selectedAttractionIds.length > 0 && (
              <span className="ml-2 text-primary-modernSg font-semibold">
                ({selectedAttractionIds.length} selected)
              </span>
            )}
          </p>
        </div>
        {selectedAttractionIds.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Zone Selector */}
      <ZoneSelector selectedZone={selectedZone} onZoneChange={setSelectedZone} />

      {/* Route Validation */}
      <RouteValidator validation={validation} />

      {/* Main Content: Attractions List + Price Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attractions List */}
        <div className="lg:col-span-2">
          <AttractionList
            attractions={attractions}
            selectedAttractionIds={selectedAttractionIds}
            onToggleAttraction={handleToggleAttraction}
            selectedZone={selectedZone}
          />
        </div>

        {/* Price Calculator - Sticky Sidebar */}
        <div className="lg:col-span-1">
          <PriceCalculator priceCalculation={priceCalculation} loading={false} />
        </div>
      </div>
    </div>
  );
}
