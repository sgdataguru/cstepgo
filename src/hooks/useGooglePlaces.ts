// @ts-nocheck
// Note: This hook is legacy code kept for reference. The app now uses 2GIS Maps.
// Google Maps packages (@googlemaps/js-api-loader, @types/google.maps) not installed.
import { useState, useEffect, useCallback } from 'react';

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
}

export interface Location {
  placeId: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Hook to integrate Google Places Autocomplete
 */
export function useGooglePlaces(apiKey: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);
  const [sessionToken, setSessionToken] =
    useState<google.maps.places.AutocompleteSessionToken | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then(() => {
        setAutocompleteService(new google.maps.places.AutocompleteService());
        
        // Create a div for Places Service (required)
        const div = document.createElement('div');
        setPlacesService(new google.maps.places.PlacesService(div));
        
        setSessionToken(new google.maps.places.AutocompleteSessionToken());
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
      });
  }, [apiKey]);

  // Get autocomplete predictions
  const getAutocompletePredictions = useCallback(
    async (
      input: string,
      options?: {
        countryRestrictions?: string[];
        types?: string[];
      }
    ): Promise<PlaceSuggestion[]> => {
      if (!autocompleteService || !sessionToken || !input) {
        return [];
      }

      return new Promise((resolve, reject) => {
        const request: google.maps.places.AutocompletionRequest = {
          input,
          sessionToken,
          componentRestrictions: options?.countryRestrictions
            ? { country: options.countryRestrictions }
            : undefined,
          types: options?.types,
        };

        autocompleteService.getPlacePredictions(request, (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestions: PlaceSuggestion[] = predictions.map((prediction) => ({
              placeId: prediction.place_id,
              primaryText: prediction.structured_formatting.main_text,
              secondaryText: prediction.structured_formatting.secondary_text || '',
              description: prediction.description,
            }));
            resolve(suggestions);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Autocomplete failed: ${status}`));
          }
        });
      });
    },
    [autocompleteService, sessionToken]
  );

  // Get place details
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<Location> => {
      if (!placesService) {
        throw new Error('Places service not loaded');
      }

      return new Promise((resolve, reject) => {
        const request = {
          placeId,
          fields: ['name', 'formatted_address', 'geometry', 'place_id'],
          ...(sessionToken && { sessionToken }),
        };

        placesService.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const location: Location = {
              placeId: place.place_id!,
              name: place.name || '',
              address: place.formatted_address || '',
              coordinates: place.geometry?.location
                ? {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  }
                : undefined,
            };
            
            // Reset session token after successful place details request
            setSessionToken(new google.maps.places.AutocompleteSessionToken());
            
            resolve(location);
          } else {
            reject(new Error(`Place details failed: ${status}`));
          }
        });
      });
    },
    [placesService, sessionToken]
  );

  return {
    isLoaded,
    getAutocompletePredictions,
    getPlaceDetails,
  };
}
