/**
 * Location and ETA calculation utilities
 * Shared functions for distance and time calculations
 */

/**
 * Calculate ETA to destination using Haversine distance and average speed
 * 
 * @param fromLat - Starting latitude
 * @param fromLng - Starting longitude
 * @param toLat - Destination latitude
 * @param toLng - Destination longitude
 * @param currentSpeed - Current speed in km/h (defaults to 40 km/h if 0 or undefined)
 * @returns Object with ETA in minutes, distance in km, and nearby flag
 */
export function calculateETA(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  currentSpeed: number = 0
): {
  pickupMinutes: number;
  distance: number;
  isNearby: boolean;
  minutes?: number; // Alias for compatibility
} {
  // Calculate distance using Haversine formula
  const distance = calculateDistance(fromLat, fromLng, toLat, toLng);

  // Use current speed or assume average city speed of 40 km/h
  const speed = currentSpeed > 0 ? currentSpeed : 40;
  
  // Calculate ETA in minutes, add 20% buffer for traffic
  const minutes = Math.round((distance / speed) * 60 * 1.2);

  // Driver is nearby if within 1 km
  const isNearby = distance < 1.0;

  return {
    pickupMinutes: minutes,
    minutes, // Alias for backward compatibility
    distance: Number(distance.toFixed(2)),
    isNearby,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * 
 * @param lat1 - Starting latitude
 * @param lon1 - Starting longitude
 * @param lat2 - Destination latitude
 * @param lon2 - Destination longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if driver is nearby the pickup location
 * 
 * @param driverLat - Driver's current latitude
 * @param driverLng - Driver's current longitude
 * @param pickupLat - Pickup location latitude
 * @param pickupLng - Pickup location longitude
 * @param threshold - Distance threshold in km (default 1.0)
 * @returns True if driver is within threshold
 */
export function isDriverNearby(
  driverLat: number,
  driverLng: number,
  pickupLat: number,
  pickupLng: number,
  threshold: number = 1.0
): boolean {
  const distance = calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
  return distance < threshold;
}

/**
 * Format ETA for display
 * 
 * @param minutes - ETA in minutes
 * @returns Formatted string (e.g., "5 min", "1 hr 30 min")
 */
export function formatETA(minutes: number): string {
  if (minutes <= 0) return 'Arriving now';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Constants for location-based features
 */
export const LOCATION_CONSTANTS = {
  /** Distance threshold for "driver is nearby" alert (km) */
  NEARBY_THRESHOLD: 1.0,
  
  /** Default assumed speed when actual speed is unknown (km/h) */
  DEFAULT_SPEED: 40,
  
  /** Traffic buffer multiplier for ETA (20% buffer) */
  TRAFFIC_BUFFER: 1.2,
  
  /** Maximum reasonable distance for a trip (km) */
  MAX_TRIP_DISTANCE: 1000,
  
  /** Earth's radius in kilometers */
  EARTH_RADIUS_KM: 6371,
} as const;
