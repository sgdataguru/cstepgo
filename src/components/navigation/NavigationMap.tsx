'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { Coordinates, NavigationRoute } from '@/lib/navigation/types';

interface NavigationMapProps {
  origin: Coordinates;
  destination: Coordinates;
  currentLocation?: Coordinates;
  route?: NavigationRoute;
  showTraffic?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
  className?: string;
}

export function NavigationMap({
  origin,
  destination,
  currentLocation,
  route,
  showTraffic = false,
  onMapReady,
  className = 'w-full h-96',
}: NavigationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key is not configured');
      return;
    }
    
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader.load().then(() => {
      const mapInstance = new google.maps.Map(mapRef.current!, {
        center: origin,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
      onMapReady?.(mapInstance);
    }).catch((err) => {
      setError('Failed to load Google Maps');
      console.error('Maps loading error:', err);
    });
  }, [origin, onMapReady]);

  if (error) {
    return (
      <div className={className}>
        <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center p-6">
            <p className="text-red-600 font-semibold mb-2">Map Unavailable</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
