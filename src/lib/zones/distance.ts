// Distance calculation utilities using Haversine formula

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate total distance for a route visiting multiple attractions
 * @param attractions Array of attractions with lat/lng coordinates
 * @returns Total distance in kilometers
 */
export function calculateRouteDistance(
  attractions: Array<{ latitude: number; longitude: number }>
): number {
  if (attractions.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 0; i < attractions.length - 1; i++) {
    const from = attractions[i];
    const to = attractions[i + 1];
    totalDistance += calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
  }

  return Math.round(totalDistance * 10) / 10;
}

/**
 * Find the maximum distance between any two attractions
 * @param attractions Array of attractions with lat/lng coordinates
 * @returns Maximum distance in kilometers
 */
export function calculateMaxDistance(
  attractions: Array<{ latitude: number; longitude: number }>
): number {
  if (attractions.length < 2) {
    return 0;
  }

  let maxDistance = 0;
  for (let i = 0; i < attractions.length; i++) {
    for (let j = i + 1; j < attractions.length; j++) {
      const distance = calculateDistance(
        attractions[i].latitude,
        attractions[i].longitude,
        attractions[j].latitude,
        attractions[j].longitude
      );
      maxDistance = Math.max(maxDistance, distance);
    }
  }

  return Math.round(maxDistance * 10) / 10;
}

/**
 * Calculate estimated duration in hours based on distance and number of attractions
 * Assumes 60 km/h average speed + time at each attraction
 * @param attractions Array of attractions with duration estimates
 * @returns Estimated duration in hours
 */
export function calculateEstimatedDuration(
  attractions: Array<{ estimatedDurationHours: number; latitude: number; longitude: number }>
): number {
  if (attractions.length === 0) {
    return 0;
  }

  // Time at attractions
  const attractionTime = attractions.reduce(
    (sum, attr) => sum + attr.estimatedDurationHours,
    0
  );

  // Travel time (distance / average speed)
  const travelDistance = calculateRouteDistance(attractions);
  const averageSpeed = 60; // km/h
  const travelTime = travelDistance / averageSpeed;

  return Math.round((attractionTime + travelTime) * 10) / 10;
}

/**
 * Find attractions that are too far apart
 * @param attractions Array of attractions with coordinates
 * @param maxDistance Maximum allowed distance
 * @returns Array of attraction IDs that exceed the distance limit
 */
export function findDistantAttractions(
  attractions: Array<{ id: string; latitude: number; longitude: number }>,
  maxDistance: number
): string[] {
  const distantIds = new Set<string>();

  for (let i = 0; i < attractions.length; i++) {
    for (let j = i + 1; j < attractions.length; j++) {
      const distance = calculateDistance(
        attractions[i].latitude,
        attractions[i].longitude,
        attractions[j].latitude,
        attractions[j].longitude
      );
      
      if (distance > maxDistance) {
        distantIds.add(attractions[i].id);
        distantIds.add(attractions[j].id);
      }
    }
  }

  return Array.from(distantIds);
}
