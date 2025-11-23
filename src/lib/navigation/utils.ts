// Navigation service for GPS and routing

import type {
  Coordinates,
  RoutePoint,
  NavigationRoute,
  RouteStep,
  ETAInfo,
  NavigationPreferences,
} from './types';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
    Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 1000); // Return in meters
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate bearing between two coordinates
 */
export function calculateBearing(
  from: Coordinates,
  to: Coordinates
): number {
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  const bearing = toDegrees(Math.atan2(y, x));
  
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Calculate ETA based on current location, destination, and average speed
 */
export function calculateETA(
  currentLocation: Coordinates,
  destination: Coordinates,
  currentSpeed: number = 50 // Default average speed in km/h
): ETAInfo {
  const distance = calculateDistance(currentLocation, destination);
  const duration = (distance / 1000) / currentSpeed * 3600; // Convert to seconds
  
  const estimatedArrival = new Date(Date.now() + duration * 1000);
  
  return {
    estimatedArrival,
    remainingDistance: distance,
    remainingDuration: Math.round(duration),
    currentSpeed,
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format ETA time for display
 */
export function formatETA(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if a location is within a certain radius of a point
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radiusMeters;
}

/**
 * Get Google Maps Directions API URL
 */
export function getDirectionsApiUrl(
  origin: RoutePoint,
  destination: RoutePoint,
  waypoints?: RoutePoint[],
  preferences?: NavigationPreferences
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    key: apiKey,
    mode: 'driving',
    alternatives: 'true',
    departure_time: 'now',
  });
  
  if (waypoints && waypoints.length > 0) {
    const waypointsStr = waypoints
      .map(wp => `${wp.lat},${wp.lng}`)
      .join('|');
    params.append('waypoints', `optimize:true|${waypointsStr}`);
  }
  
  const avoid: string[] = [];
  if (preferences?.avoidTolls) avoid.push('tolls');
  if (preferences?.avoidHighways) avoid.push('highways');
  if (preferences?.avoidFerries) avoid.push('ferries');
  
  if (avoid.length > 0) {
    params.append('avoid', avoid.join('|'));
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse Google Maps Directions API response
 */
export function parseDirectionsResponse(response: any): NavigationRoute | null {
  try {
    if (!response.routes || response.routes.length === 0) {
      return null;
    }
    
    const route = response.routes[0];
    const leg = route.legs[0];
    
    const steps: RouteStep[] = leg.steps.map((step: any) => ({
      distance: step.distance.value,
      duration: step.duration.value,
      // Strip HTML tags from instructions using browser's DOMParser if available
      instruction: typeof DOMParser !== 'undefined' 
        ? new DOMParser().parseFromString(step.html_instructions, 'text/html').documentElement.textContent || step.html_instructions
        : step.html_instructions.replace(/<[^>]*>/g, ''), // Fallback for server-side
      maneuver: step.maneuver,
      startLocation: {
        lat: step.start_location.lat,
        lng: step.start_location.lng,
      },
      endLocation: {
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      },
      polyline: step.polyline.points,
    }));
    
    return {
      distance: leg.distance.value,
      duration: leg.duration.value,
      polyline: route.overview_polyline.points,
      steps,
      bounds: {
        northeast: {
          lat: route.bounds.northeast.lat,
          lng: route.bounds.northeast.lng,
        },
        southwest: {
          lat: route.bounds.southwest.lat,
          lng: route.bounds.southwest.lng,
        },
      },
      overview: `${leg.distance.text} via ${route.summary}`,
    };
  } catch (error) {
    console.error('Error parsing directions response:', error);
    return null;
  }
}
