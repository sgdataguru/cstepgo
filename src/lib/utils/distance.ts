/**
 * Distance and Travel Time Calculation Utilities
 * Uses Haversine formula for calculating great-circle distances
 */

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param from Origin coordinates
 * @param to Destination coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  
  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return Math.round(distance); // Return rounded kilometers
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance
 * Assumes average speed accounting for road conditions, traffic, and stops
 * 
 * @param distanceKm Distance in kilometers
 * @returns Object containing hours and minutes
 */
export function estimateTravelTime(distanceKm: number): { hours: number; minutes: number; totalMinutes: number } {
  // Average speed assumptions:
  // - Highway: 80 km/h
  // - Mountain roads: 40 km/h
  // - City streets: 30 km/h
  // Average overall: 60 km/h accounting for mixed conditions
  
  const averageSpeedKmh = 60;
  const totalHours = distanceKm / averageSpeedKmh;
  const totalMinutes = Math.round(totalHours * 60);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return {
    hours,
    minutes,
    totalMinutes,
  };
}

/**
 * Format travel time as human-readable string
 * @param distanceKm Distance in kilometers
 * @returns Formatted string like "2h 30m"
 */
export function formatTravelTime(distanceKm: number): string {
  const { hours, minutes } = estimateTravelTime(distanceKm);
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

/**
 * Format distance as human-readable string
 * @param distanceKm Distance in kilometers
 * @returns Formatted string like "150 km"
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  
  return `${distanceKm} km`;
}
