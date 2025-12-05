import { calculateHaversineDistance } from './geoUtils';

/**
 * Trip Zone Classification Utility
 * 
 * Classifies trips into zones based on distance and duration:
 * - Zone A: Day trips (< 8 hours or < 200 km)
 * - Zone B: 1-2 day trips (8-48 hours or 200-600 km)
 * - Zone C: Multi-day trips (> 48 hours or > 600 km)
 */

export enum TripZone {
  ZONE_A = 'ZONE_A',
  ZONE_B = 'ZONE_B',
  ZONE_C = 'ZONE_C',
}

export interface TripZoneClassification {
  zone: TripZone;
  estimatedDays: number;
  zoneName: string;
  description: string;
}

// Zone classification thresholds
const ZONE_THRESHOLDS = {
  // Duration thresholds (in hours)
  ZONE_A_MAX_HOURS: 8,
  ZONE_B_MAX_HOURS: 48,
  
  // Distance thresholds (in kilometers)
  ZONE_A_MAX_DISTANCE: 200,
  ZONE_B_MAX_DISTANCE: 600,
};

/**
 * Calculate trip duration in hours between two dates
 */
export function calculateTripDurationHours(departureTime: Date, returnTime: Date): number {
  const durationMs = returnTime.getTime() - departureTime.getTime();
  return durationMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Calculate estimated days based on hours (rounded up)
 */
export function calculateEstimatedDays(durationHours: number): number {
  return Math.max(1, Math.ceil(durationHours / 24));
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return calculateHaversineDistance(lat1, lng1, lat2, lng2);
}

/**
 * Classify a trip into a zone based on duration and distance
 * Uses both metrics to make a more accurate classification
 */
export function classifyTrip(
  departureTime: Date | string,
  returnTime: Date | string,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  providedDistance?: number
): TripZoneClassification {
  // Parse dates if they're strings
  const departure = typeof departureTime === 'string' ? new Date(departureTime) : departureTime;
  const returnDate = typeof returnTime === 'string' ? new Date(returnTime) : returnTime;
  
  // Calculate duration in hours
  const durationHours = calculateTripDurationHours(departure, returnDate);
  
  // Calculate or use provided distance
  const distance = providedDistance ?? calculateDistance(originLat, originLng, destLat, destLng);
  
  // Determine zone based on both duration AND distance
  // A trip is classified to a higher zone if EITHER metric exceeds the threshold
  let zone: TripZone;
  
  if (
    durationHours <= ZONE_THRESHOLDS.ZONE_A_MAX_HOURS &&
    distance <= ZONE_THRESHOLDS.ZONE_A_MAX_DISTANCE
  ) {
    zone = TripZone.ZONE_A;
  } else if (
    durationHours <= ZONE_THRESHOLDS.ZONE_B_MAX_HOURS &&
    distance <= ZONE_THRESHOLDS.ZONE_B_MAX_DISTANCE
  ) {
    zone = TripZone.ZONE_B;
  } else {
    zone = TripZone.ZONE_C;
  }
  
  // Calculate estimated days
  const estimatedDays = calculateEstimatedDays(durationHours);
  
  // Get zone metadata
  const zoneInfo = getZoneInfo(zone);
  
  return {
    zone,
    estimatedDays,
    zoneName: zoneInfo.name,
    description: zoneInfo.description,
  };
}

/**
 * Get zone metadata (name, description, color, etc.)
 */
export function getZoneInfo(zone: TripZone) {
  const zoneMap = {
    [TripZone.ZONE_A]: {
      name: 'Zone A - Day Trips',
      shortName: 'Day Trips',
      description: 'Perfect for single-day adventures. Complete your journey within the same calendar day.',
      color: '#10B981', // Green
      backgroundColor: '#D1FAE5',
      borderColor: '#6EE7B7',
      emoji: '☀️',
      durationRange: 'Under 8 hours',
      distanceRange: 'Under 200 km',
      typicalDays: '1 day',
    },
    [TripZone.ZONE_B]: {
      name: 'Zone B - Weekend Trips',
      shortName: 'Weekend Trips',
      description: 'Ideal for weekend getaways. Usually requires 1-2 days with an overnight stay.',
      color: '#F59E0B', // Amber
      backgroundColor: '#FEF3C7',
      borderColor: '#FCD34D',
      emoji: '🌙',
      durationRange: '8-48 hours',
      distanceRange: '200-600 km',
      typicalDays: '1-2 days',
    },
    [TripZone.ZONE_C]: {
      name: 'Zone C - Multi-Day Expeditions',
      shortName: 'Multi-Day',
      description: 'For longer journeys and explorations. Typically needs 3 or more days.',
      color: '#8B5CF6', // Purple
      backgroundColor: '#EDE9FE',
      borderColor: '#C4B5FD',
      emoji: '🏔️',
      durationRange: 'Over 48 hours',
      distanceRange: 'Over 600 km',
      typicalDays: '3+ days',
    },
  };
  
  return zoneMap[zone];
}

/**
 * Get zone badge styling
 */
export function getZoneBadgeStyles(zone: TripZone) {
  const info = getZoneInfo(zone);
  return {
    color: info.color,
    backgroundColor: info.backgroundColor,
    borderColor: info.borderColor,
  };
}

/**
 * Calculate total estimated days for a bundle of trips
 */
export function calculateBundleDays(trips: Array<{ estimatedDays: number }>): number {
  return trips.reduce((total, trip) => total + trip.estimatedDays, 0);
}

/**
 * Get zone display name with emoji
 */
export function getZoneDisplayName(zone: TripZone): string {
  const info = getZoneInfo(zone);
  return `${info.emoji} ${info.shortName}`;
}
