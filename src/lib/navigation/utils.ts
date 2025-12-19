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
/**
 * Build 2GIS Routing API request body
 */
export function getDirectionsApiRequest(
  origin: RoutePoint,
  destination: RoutePoint,
  waypoints?: RoutePoint[],
  preferences?: NavigationPreferences
): { url: string; body: object } {
  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY || '';
  const baseUrl = 'https://routing.api.2gis.com/routing/7.0.0/global';
  
  // Build points array
  const points: { lat: number; lon: number }[] = [
    { lat: origin.lat, lon: origin.lng }
  ];
  
  // Add waypoints if provided
  if (waypoints && waypoints.length > 0) {
    waypoints.forEach(wp => {
      points.push({ lat: wp.lat, lon: wp.lng });
    });
  }
  
  // Add destination
  points.push({ lat: destination.lat, lon: destination.lng });
  
  return {
    url: `${baseUrl}?key=${apiKey}`,
    body: {
      type: 'car',
      points,
    }
  };
}

/**
 * Legacy: Build 2GIS Directions API URL (GET request) - deprecated
 */
export function getDirectionsApiUrl(
  origin: RoutePoint,
  destination: RoutePoint,
  waypoints?: RoutePoint[],
  preferences?: NavigationPreferences
): string {
  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY || '';
  const baseUrl = 'https://routing.api.2gis.com/routing/7.0.0/global';
  
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
 * Parse 2GIS Directions API response (v7)
 */
export function parseDirectionsResponse(response: any): NavigationRoute | null {
  try {
    if (!response.result || response.result.length === 0) {
      return null;
    }
    
    const route = response.result[0];
    
    // Convert 2GIS v7 maneuvers to steps
    const steps: RouteStep[] = [];
    const allPoints: [number, number][] = [];
    
    // Parse maneuvers
    if (route.maneuvers && route.maneuvers.length > 0) {
      route.maneuvers.forEach((maneuver: any) => {
        const outPath = maneuver.outcoming_path;
        if (!outPath) return;
        
        // Parse LINESTRING geometry
        let startLat = 0, startLng = 0, endLat = 0, endLng = 0;
        if (outPath.geometry && outPath.geometry.length > 0) {
          const geomString = outPath.geometry[0].selection || '';
          // Parse LINESTRING(lon lat, lon lat, ...)
          const match = geomString.match(/LINESTRING\(([^)]+)\)/);
          if (match) {
            const coords = match[1].split(',').map((c: string) => {
              const [lon, lat] = c.trim().split(' ').map(Number);
              return [lon, lat] as [number, number];
            });
            if (coords.length > 0) {
              startLng = coords[0][0];
              startLat = coords[0][1];
              endLng = coords[coords.length - 1][0];
              endLat = coords[coords.length - 1][1];
              allPoints.push(...coords);
            }
          }
        }
        
        steps.push({
          distance: outPath.distance || 0,
          duration: outPath.duration || 0,
          instruction: maneuver.outcoming_path_comment || maneuver.comment || 'Continue',
          maneuver: maneuver.icon || maneuver.type || 'straight',
          startLocation: { lat: startLat, lng: startLng },
          endLocation: { lat: endLat, lng: endLng },
          polyline: outPath.geometry?.[0]?.selection || '',
        });
      });
    }
    
    // Get bounds from waypoints
    const waypoints = route.waypoints || [];
    let northeast = { lat: -90, lng: -180 };
    let southwest = { lat: 90, lng: 180 };
    
    if (allPoints.length > 0) {
      northeast = {
        lat: Math.max(...allPoints.map(p => p[1])),
        lng: Math.max(...allPoints.map(p => p[0])),
      };
      southwest = {
        lat: Math.min(...allPoints.map(p => p[1])),
        lng: Math.min(...allPoints.map(p => p[0])),
      };
    } else if (waypoints.length >= 2) {
      // Fallback to waypoints
      const lats = waypoints.map((w: any) => w.lat);
      const lngs = waypoints.map((w: any) => w.lon);
      northeast = { lat: Math.max(...lats), lng: Math.max(...lngs) };
      southwest = { lat: Math.min(...lats), lng: Math.min(...lngs) };
    }
    
    return {
      distance: route.total_distance || 0,
      duration: route.total_duration || 0,
      polyline: allPoints.map(p => `${p[1]},${p[0]}`).join(';'),
      steps,
      bounds: { northeast, southwest },
      overview: route.ui_total_distance 
        ? `${route.ui_total_distance.value} ${route.ui_total_distance.unit} (${route.ui_total_duration})`
        : formatDistance(route.total_distance),
    };
  } catch (error) {
    console.error('Error parsing directions response:', error);
    return null;
  }
}
