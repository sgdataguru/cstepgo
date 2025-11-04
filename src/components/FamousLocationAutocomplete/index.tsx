'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, X, Search, AlertCircle } from 'lucide-react';
import { searchLocations, FamousLocation, getPopularLocations } from '@/lib/locations/famous-locations';
import { Location } from '@/types/trip-types';

interface FamousLocationAutocompleteProps {
  value?: Location | null;
  onChange?: (location: Location | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Location Autocomplete Component using Famous Kazakhstan/Kyrgyzstan Locations
 */
export default function FamousLocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  label,
  error: externalError,
  required = false,
  className = '',
}: FamousLocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FamousLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(value || null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected location when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
      setQuery(value.name);
    }
  }, [value]);

  // Handle search query changes
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    
    if (newQuery.trim().length === 0) {
      // Show popular locations when empty
      setSuggestions(getPopularLocations());
      setIsOpen(true);
    } else {
      // Search locations
      const results = searchLocations(newQuery);
      setSuggestions(results.slice(0, 10)); // Limit to 10 results
      setIsOpen(results.length > 0);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: FamousLocation) => {
    const selectedLoc: Location = {
      name: location.name,
      address: location.address,
      placeId: location.placeId || location.id,
      coordinates: location.coordinates,
    };

    setSelectedLocation(selectedLoc);
    setQuery(location.name);
    setIsOpen(false);
    onChange?.(selectedLoc);
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setSelectedLocation(null);
    setSuggestions(getPopularLocations());
    setIsOpen(true);
    onChange?.(null);
    inputRef.current?.focus();
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length === 0) {
      setSuggestions(getPopularLocations());
    }
    setIsOpen(true);
  };

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showClearButton = query.length > 0;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MapPin className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 py-2.5 
            bg-white dark:bg-gray-800 
            border rounded-lg
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            transition-colors
            ${externalError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
        />

        {/* Clear Button */}
        {showClearButton && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {externalError && (
        <div className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{externalError}</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-auto"
        >
          {/* Header */}
          {query.length === 0 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Search className="w-4 h-4" />
                <span>Popular Destinations</span>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => handleLocationSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {location.name}
                    </span>
                    {location.isPopular && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {location.description || location.address}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      location.type === 'city' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {location.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {location.country}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length > 0 && suggestions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
        >
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No locations found</p>
            <p className="text-xs mt-1">Try searching for cities or landmarks in Kazakhstan or Kyrgyzstan</p>
          </div>
        </div>
      )}

      {/* Selected Location Display */}
      {selectedLocation && !isOpen && (
        <div className="mt-2 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-teal-900 dark:text-teal-100">
                {selectedLocation.name}
              </div>
              <div className="text-sm text-teal-700 dark:text-teal-300">
                {selectedLocation.address}
              </div>
              {selectedLocation.coordinates && (
                <div className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                  {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
