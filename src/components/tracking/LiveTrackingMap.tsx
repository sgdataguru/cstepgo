/**
 * Live tracking map component using Google Maps
 * Shows driver position, pickup location, and optional destination
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

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
  onMapReady?: (map: google.maps.Map) => void;
}

export default function LiveTrackingMap({
  driverLocation,
  pickupLocation,
  destinationLocation,
  showDestination = true,
  onMapReady,
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          setMapError('Google Maps API key not configured');
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
        });

        await loader.load();

        if (!mapRef.current) return;

        // Create map centered on pickup location
        const map = new google.maps.Map(mapRef.current, {
          center: {
            lat: pickupLocation.latitude,
            lng: pickupLocation.longitude,
          },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // Create pickup marker
        const pickupMarker = new google.maps.Marker({
          position: {
            lat: pickupLocation.latitude,
            lng: pickupLocation.longitude,
          },
          map,
          title: pickupLocation.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="white" stroke-width="3"/>
                <text x="20" y="27" text-anchor="middle" font-size="20" fill="white">📍</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
          },
        });
        pickupMarkerRef.current = pickupMarker;

        // Create info window for pickup
        const pickupInfoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px;"><strong>Pickup Location</strong><br/>${pickupLocation.name}</div>`,
        });
        pickupMarker.addListener('click', () => {
          pickupInfoWindow.open(map, pickupMarker);
        });

        // Create destination marker if provided
        if (showDestination && destinationLocation) {
          const destMarker = new google.maps.Marker({
            position: {
              lat: destinationLocation.latitude,
              lng: destinationLocation.longitude,
            },
            map,
            title: destinationLocation.name,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3"/>
                  <text x="20" y="27" text-anchor="middle" font-size="20" fill="white">🏁</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            },
          });
          destinationMarkerRef.current = destMarker;

          const destInfoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px;"><strong>Destination</strong><br/>${destinationLocation.name}</div>`,
          });
          destMarker.addListener('click', () => {
            destInfoWindow.open(map, destMarker);
          });
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
    if (!mapInstanceRef.current || !mapLoaded || !driverLocation) return;

    const map = mapInstanceRef.current;

    // Create or update driver marker
    if (!driverMarkerRef.current) {
      const driverMarker = new google.maps.Marker({
        position: {
          lat: driverLocation.latitude,
          lng: driverLocation.longitude,
        },
        map,
        title: 'Driver Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="23" fill="#3b82f6" stroke="white" stroke-width="3"/>
              <text x="25" y="32" text-anchor="middle" font-size="24" fill="white">🚗</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25),
        },
        animation: google.maps.Animation.DROP,
      });
      driverMarkerRef.current = driverMarker;

      const driverInfoWindow = new google.maps.InfoWindow({
        content: '<div style="padding: 8px;"><strong>Your Driver</strong><br/>Live location</div>',
      });
      driverMarker.addListener('click', () => {
        driverInfoWindow.open(map, driverMarker);
      });
    } else {
      // Animate marker to new position
      driverMarkerRef.current.setPosition({
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
      });
    }

    // Draw route from driver to pickup
    const drawRoute = async () => {
      if (!driverLocation || !pickupLocation) return;

      try {
        const directionsService = new google.maps.DirectionsService();
        const result = await directionsService.route({
          origin: {
            lat: driverLocation.latitude,
            lng: driverLocation.longitude,
          },
          destination: {
            lat: pickupLocation.latitude,
            lng: pickupLocation.longitude,
          },
          travelMode: google.maps.TravelMode.DRIVING,
        });

        // Remove old polyline
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
        }

        // Draw new route
        const route = result.routes[0];
        if (route) {
          const polyline = new google.maps.Polyline({
            path: route.overview_path,
            geodesic: true,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map,
          });
          routePolylineRef.current = polyline;
        }
      } catch (error) {
        console.error('Error drawing route:', error);
      }
    };

    drawRoute();

    // Adjust map bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
    bounds.extend({ lat: pickupLocation.latitude, lng: pickupLocation.longitude });
    if (showDestination && destinationLocation) {
      bounds.extend({ lat: destinationLocation.latitude, lng: destinationLocation.longitude });
    }
    map.fitBounds(bounds, 50);
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
