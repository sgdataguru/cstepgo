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
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
    
    if (!apiKey || apiKey === 'demo' || apiKey === 'your-api-key-here') {
      setIsLoading(false);
      return;
    }
    
    if (!mapRef.current) return;

    const loader = TwoGISLoader.getInstance(apiKey);

    loader.load().then(() => {
      if (!mapRef.current || typeof window === 'undefined') return;

      const mapgl = (window as any).mapgl;
      
      // Create map using MapGL
      const mapInstance = new mapgl.Map(mapRef.current, {
        center: [origin.lng, origin.lat], // MapGL uses [lng, lat]
        zoom: 13,
        key: apiKey,
      });

      // Add origin marker
      new mapgl.Marker(mapInstance, {
        coordinates: [origin.lng, origin.lat],
        label: {
          text: 'Start',
          offset: [0, -10],
        },
      });
      
      // Add destination marker
      new mapgl.Marker(mapInstance, {
        coordinates: [destination.lng, destination.lat],
        label: {
          text: 'End',
          offset: [0, -10],
        },
      });

      // Fit bounds to show both markers
      mapInstance.fitBounds(
        [
          [Math.min(origin.lng, destination.lng) - 0.01, Math.min(origin.lat, destination.lat) - 0.01],
          [Math.max(origin.lng, destination.lng) + 0.01, Math.max(origin.lat, destination.lat) + 0.01]
        ],
        { padding: 50 }
      );

      setMap(mapInstance);
      setIsLoading(false);
      onMapReady?.(mapInstance);
    }).catch((err) => {
      setError('Failed to load 2GIS Maps');
      setIsLoading(false);
      console.error('Maps loading error:', err);
    });

    // Cleanup
    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [origin, destination, onMapReady]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="w-full h-full rounded-lg bg-[#1a1a1a] border border-[#00f0ff]/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <div className="w-full h-full rounded-lg bg-[#1a1a1a] border border-[#ff0055]/30 flex items-center justify-center">
          <div className="text-center p-6">
            <p className="text-[#ff0055] font-semibold mb-2">Map Unavailable</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show placeholder when no API key (demo mode)
  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
  if (!apiKey || apiKey === 'demo' || apiKey === 'your-api-key-here') {
    return (
      <div className={className}>
        <div className="w-full h-full rounded-lg bg-[#1a1a1a] border border-[#00f0ff]/30 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Decorative grid background */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
          </div>
          
          {/* Route visualization */}
          <div className="relative z-10 text-center p-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse" />
              <div className="w-24 h-0.5 bg-gradient-to-r from-[#00ff88] to-[#00f0ff]" />
              <div className="w-3 h-3 rounded-full bg-[#00f0ff]" />
            </div>
            <p className="text-[#00f0ff] font-semibold mb-1">Navigation Preview</p>
            <p className="text-gray-400 text-sm">
              {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)} → {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
            </p>
            <p className="text-gray-500 text-xs mt-2">Live map requires 2GIS API key</p>
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
