'use client';

import { useRef, useEffect } from 'react';
import { MapPin, X, Loader2, AlertCircle } from 'lucide-react';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import type { Location } from '@/hooks/use2GISPlaces';

interface LocationAutocompleteProps {
  value?: Location | null;
  onChange?: (location: Location | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  countryRestrictions?: string[];
  types?: string[];
  className?: string;
}

/**
 * Location Autocomplete Component with 2GIS Maps integration
 * Optimized for Kazakhstan and Central Asia
 */
export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  label,
  error: externalError,
  required = false,
  countryRestrictions,
  types,
  className = '',
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY || '';

  const {
    query,
    suggestions,
    isOpen,
    isLoading,
    selectedLocation,
    error: autocompleteError,
    isApiLoaded,
    handleQueryChange,
    handleSuggestionSelect,
    clearSelection,
    closeDropdown,
  } = useAutocomplete({
    apiKey,
    countryRestrictions,
    types,
    onLocationSelect: onChange || undefined,
  });

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  // Handle clear
  const handleClear = () => {
    clearSelection();
    onChange?.(null);
    inputRef.current?.focus();
  };

  const showError = externalError || autocompleteError;
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
          placeholder={placeholder}
          disabled={!isApiLoaded}
          className={`
            w-full pl-10 pr-10 py-2.5 
            bg-white dark:bg-gray-800 
            border rounded-lg
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
            transition-colors
            ${showError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
        />

        {/* Loading/Clear Button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : showClearButton ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {showError && (
        <div className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{showError}</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {suggestion.primaryText}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {suggestion.secondaryText}
                  </div>
                </div>
              </div>
            </button>
          ))}
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

      {/* API Not Loaded Warning */}
      {!isApiLoaded && (
        <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading 2GIS Maps...</span>
        </div>
      )}
    </div>
  );
}
