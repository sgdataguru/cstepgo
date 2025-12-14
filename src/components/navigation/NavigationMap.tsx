'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TwoGISLoader } from '@/lib/maps/2gis-adapter';
import type { Coordinates, NavigationRoute } from '@/lib/navigation/types';

interface NavigationMapProps {
  origin: Coordinates;
  destination: Coordinates;
  currentLocation?: Coordinates;
  route?: NavigationRoute;
  showTraffic?: boolean;
  onMapReady?: (map: any) => void;
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
  const [map, setMap] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
    
    if (!apiKey) {
      setError('2GIS Maps API key is not configured');
      return;
    }
    
    if (!mapRef.current) return;

    const loader = TwoGISLoader.getInstance(apiKey);

    loader.load().then(() => {
      if (!mapRef.current || typeof window === 'undefined') return;

      const DG = (window as any).DG;
      
      const mapInstance = DG.map(mapRef.current, {
        center: [origin.lat, origin.lng],
        zoom: 13,
        zoomControl: true,
        fullscreenControl: true,
      });

      // Add markers for origin and destination
      DG.marker([origin.lat, origin.lng])
        .addTo(mapInstance)
        .bindPopup('Origin');
      
      DG.marker([destination.lat, destination.lng])
        .addTo(mapInstance)
        .bindPopup('Destination');

      setMap(mapInstance);
      onMapReady?.(mapInstance);
    }).catch((err) => {
      setError('Failed to load 2GIS Maps');
      console.error('Maps loading error:', err);
    });
  }, [origin, destination, onMapReady]);

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
