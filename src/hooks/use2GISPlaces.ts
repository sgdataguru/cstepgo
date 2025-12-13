/// <reference types="@types/google.maps" />
import { useState, useEffect, useCallback } from 'react';
import { TwoGISService, TwoGISCoordinates, TwoGISSuggestion, TwoGISPlace } from '@/lib/maps/2gis-adapter';

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
 * Hook to integrate 2GIS Places API
 * Replaces Google Places Autocomplete with 2GIS implementation
 */
export function use2GISPlaces(apiKey: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [service, setService] = useState<TwoGISService | null>(null);

  // Load 2GIS Maps API
  useEffect(() => {
    const twoGisService = new TwoGISService(apiKey);
    
    twoGisService
      .loadMaps()
      .then(() => {
        setService(twoGisService);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Error loading 2GIS Maps:', error);
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
      if (!service || !input) {
        return [];
      }

      try {
        const geocoder = service.getGeocoder();
        
        // Map country codes to 2GIS region IDs if needed
        // For Kazakhstan, the region_id is typically the country code
        const region = options?.countryRestrictions?.[0] || 'kz';
        
        const suggestions = await geocoder.search(input, {
          region,
          limit: 10,
        });

        return suggestions.map((suggestion: TwoGISSuggestion) => ({
          placeId: suggestion.id,
          primaryText: suggestion.name,
          secondaryText: suggestion.address,
          description: `${suggestion.name}, ${suggestion.address}`,
        }));
      } catch (error) {
        console.error('2GIS autocomplete error:', error);
        return [];
      }
    },
    [service]
  );

  // Get place details
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<Location> => {
      if (!service) {
        throw new Error('2GIS service not loaded');
      }

      try {
        const geocoder = service.getGeocoder();
        const place = await geocoder.getPlaceById(placeId);
        
        if (!place) {
          throw new Error('Place not found');
        }

        const location: Location = {
          placeId: place.id,
          name: place.name,
          address: place.address,
          coordinates: {
            lat: place.point.lat,
            lng: place.point.lon,
          },
        };
        
        return location;
      } catch (error) {
        console.error('2GIS place details error:', error);
        throw new Error(`Place details failed: ${error}`);
      }
    },
    [service]
  );

  return {
    isLoaded,
    getAutocompletePredictions,
    getPlaceDetails,
  };
}
