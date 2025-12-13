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
 * Get 2GIS Directions API URL
 */
export function getDirectionsApiUrl(
  origin: RoutePoint,
  destination: RoutePoint,
  waypoints?: RoutePoint[],
  preferences?: NavigationPreferences
): string {
  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY || '';
  const baseUrl = 'https://catalog.api.2gis.com/carrouting/6.0.0/global';
  
  const params = new URLSearchParams({
    key: apiKey,
    type: 'car',
  });
  
  // Add origin
  params.append('points', `${origin.lng},${origin.lat}`);
  
  // Add waypoints if provided
  if (waypoints && waypoints.length > 0) {
    waypoints.forEach(wp => {
      params.append('points', `${wp.lng},${wp.lat}`);
    });
  }
  
  // Add destination
  params.append('points', `${destination.lng},${destination.lat}`);
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse 2GIS Directions API response
 */
export function parseDirectionsResponse(response: any): NavigationRoute | null {
  try {
    if (!response.result || response.result.length === 0) {
      return null;
    }
    
    const route = response.result[0];
    
    // Convert 2GIS geometry format to steps
    const steps: RouteStep[] = [];
    const points = route.points || [];
    
    // Create steps from maneuvers
    if (route.maneuvers && route.maneuvers.length > 0) {
      route.maneuvers.forEach((maneuver: any, index: number) => {
        const nextIndex = index < route.maneuvers.length - 1 ? route.maneuvers[index + 1].outgoing_path_index : points.length - 1;
        const stepPoints = points.slice(maneuver.outgoing_path_index, nextIndex + 1);
        
        steps.push({
          distance: maneuver.length || 0,
          duration: maneuver.time || 0,
          instruction: maneuver.comment || 'Continue',
          maneuver: maneuver.type,
          startLocation: {
            lat: stepPoints[0][1],
            lng: stepPoints[0][0],
          },
          endLocation: {
            lat: stepPoints[stepPoints.length - 1][1],
            lng: stepPoints[stepPoints.length - 1][0],
          },
          polyline: JSON.stringify(stepPoints),
        });
      });
    }
    
    return {
      distance: route.total_distance || 0,
      duration: route.total_duration || 0,
      polyline: JSON.stringify(points),
      steps,
      bounds: {
        northeast: {
          lat: Math.max(...points.map((p: [number, number]) => p[1])),
          lng: Math.max(...points.map((p: [number, number]) => p[0])),
        },
        southwest: {
          lat: Math.min(...points.map((p: [number, number]) => p[1])),
          lng: Math.min(...points.map((p: [number, number]) => p[0])),
        },
      },
      overview: `${formatDistance(route.total_distance)} via 2GIS route`,
    };
  } catch (error) {
    console.error('Error parsing directions response:', error);
    return null;
  }
}
