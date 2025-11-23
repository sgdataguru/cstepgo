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

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;

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
    });
  }, [origin, onMapReady]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
