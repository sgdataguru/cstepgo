import { useState, useCallback, useRef, useEffect } from 'react';
import { use2GISPlaces, PlaceSuggestion, Location } from './use2GISPlaces';

interface UseAutocompleteOptions {
  apiKey: string;
  countryRestrictions?: string[];
  types?: string[];
  debounceMs?: number;
  minSearchLength?: number;
  onLocationSelect?: (location: Location) => void;
}

/**
 * Hook to manage autocomplete state and interactions
 * Updated to use 2GIS Maps API for Kazakhstan and Central Asia
 */
export function useAutocomplete({
  apiKey,
  countryRestrictions = ['kz', 'kg', 'uz'], // Kazakhstan, Kyrgyzstan, Uzbekistan
  types,
  debounceMs = 300,
  minSearchLength = 3,
  onLocationSelect,
}: UseAutocompleteOptions) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isLoaded, getAutocompletePredictions, getPlaceDetails } = use2GISPlaces(apiKey);

  // Handle query changes with debouncing
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setError(null);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Clear suggestions if query is too short
      if (value.length < minSearchLength) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await getAutocompletePredictions(value, {
            countryRestrictions,
            types,
          });
          setSuggestions(results);
          setIsOpen(results.length > 0);
        } catch (err) {
          console.error('Autocomplete error:', err);
          setError('Failed to load suggestions');
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [
      getAutocompletePredictions,
      countryRestrictions,
      types,
      debounceMs,
      minSearchLength,
    ]
  );

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    async (suggestion: PlaceSuggestion) => {
      setQuery(suggestion.description);
      setIsOpen(false);
      setIsLoading(true);
      setError(null);

      try {
        const location = await getPlaceDetails(suggestion.placeId);
        setSelectedLocation(location);
        onLocationSelect?.(location);
      } catch (err) {
        console.error('Place details error:', err);
        setError('Failed to load location details');
      } finally {
        setIsLoading(false);
      }
    },
    [getPlaceDetails, onLocationSelect]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setSelectedLocation(null);
    setIsOpen(false);
    setError(null);
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    query,
    suggestions,
    isOpen,
    isLoading,
    selectedLocation,
    error,
    isApiLoaded: isLoaded,

    // Actions
    handleQueryChange,
    handleSuggestionSelect,
    clearSelection,
    closeDropdown,
  };
}
