/**
 * Live tracking map component using 2GIS Maps
 * Shows driver position, pickup location, and optional destination
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { TwoGISLoader } from '@/lib/maps/2gis-adapter';

interface LiveTrackingMapProps {
  driverLocation: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  } | null;
  pickupLocation: {
    latitude: number;
    longitude: number;
    name: string;
  };
  destinationLocation?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  showDestination?: boolean;
  onMapReady?: (map: any) => void;
}

export default function LiveTrackingMap({
  driverLocation,
  pickupLocation,
  destinationLocation,
  showDestination = true,
  onMapReady,
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const driverMarkerRef = useRef<any | null>(null);
  const pickupMarkerRef = useRef<any | null>(null);
  const destinationMarkerRef = useRef<any | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize 2GIS Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
        
        if (!apiKey) {
          // Log for developers but show user-friendly message to users
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.error('2GIS Maps API key not configured. Please set NEXT_PUBLIC_2GIS_API_KEY in your environment variables.');
          }
          setMapError('Map service unavailable. Please try again later.');
          return;
        }

        const loader = TwoGISLoader.getInstance(apiKey);
        await loader.load();

        if (!mapRef.current || typeof window === 'undefined') return;

        const DG = (window as any).DG;

        // Create map centered on pickup location
        const map = DG.map(mapRef.current, {
          center: [pickupLocation.latitude, pickupLocation.longitude],
          zoom: 13,
          zoomControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Create pickup marker with custom icon
        const pickupMarker = DG.marker([pickupLocation.latitude, pickupLocation.longitude], {
          icon: DG.icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="white" stroke-width="3"/>
                <text x="20" y="27" text-anchor="middle" font-size="20" fill="white">📍</text>
              </svg>
            `),
            iconSize: [40, 40],
          }),
        }).addTo(map);
        
        pickupMarker.bindPopup(`<strong>Pickup Location</strong><br/>${pickupLocation.name}`);
        pickupMarkerRef.current = pickupMarker;

        // Create destination marker if provided
        if (showDestination && destinationLocation) {
          const destMarker = DG.marker([destinationLocation.latitude, destinationLocation.longitude], {
            icon: DG.icon({
              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3"/>
                  <text x="20" y="27" text-anchor="middle" font-size="20" fill="white">🏁</text>
                </svg>
              `),
              iconSize: [40, 40],
            }),
          }).addTo(map);
          
          destMarker.bindPopup(`<strong>Destination</strong><br/>${destinationLocation.name}`);
          destinationMarkerRef.current = destMarker;
        }

        setMapLoaded(true);
        onMapReady?.(map);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map');
      }
    };

    initMap();
  }, [pickupLocation, destinationLocation, showDestination, onMapReady]);

  // Update driver marker when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !driverLocation || typeof window === 'undefined') return;

    const map = mapInstanceRef.current;
    const DG = (window as any).DG;

    // Create or update driver marker
    if (!driverMarkerRef.current) {
      const driverMarker = DG.marker([driverLocation.latitude, driverLocation.longitude], {
        icon: DG.icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="23" fill="#3b82f6" stroke="white" stroke-width="3"/>
              <text x="25" y="32" text-anchor="middle" font-size="24" fill="white">🚗</text>
            </svg>
          `),
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        }),
      }).addTo(map);
      
      driverMarker.bindPopup('<strong>Your Driver</strong><br/>Live location');
      driverMarkerRef.current = driverMarker;
    } else {
      // Update marker position
      driverMarkerRef.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
    }

    // Adjust map bounds to show all markers
    const bounds = DG.latLngBounds([
      [driverLocation.latitude, driverLocation.longitude],
      [pickupLocation.latitude, pickupLocation.longitude],
    ]);
    
    if (showDestination && destinationLocation) {
      bounds.extend([destinationLocation.latitude, destinationLocation.longitude]);
    }
    
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [driverLocation, pickupLocation, destinationLocation, showDestination, mapLoaded]);

  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-gray-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {mapLoaded && !driverLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 shadow-md">
          <p className="text-sm text-yellow-800">⏳ Waiting for driver location...</p>
        </div>
      )}
    </div>
  );
}
