/**
 * Kazakhstan Geography Validation Utility
 * 
 * Provides geographic boundary validation to ensure trips are scoped to Kazakhstan.
 * This enforces domain boundaries and prevents data leakage outside Kazakhstan geography.
 */

/**
 * Kazakhstan geographic boundaries
 * 
 * These coordinates define the rectangular bounding box for Kazakhstan.
 * Source: OpenStreetMap and official Kazakhstan geographic data
 * 
 * Boundaries (WGS84 coordinate system):
 * - Latitude range: 40.5° N to 55.5° N (approx. 1,670 km north-south)
 * - Longitude range: 46.5° E to 87.5° E (approx. 3,000 km east-west)
 * 
 * Note: This is a simplified rectangular boundary. For higher precision border
 * validation, consider using a polygon-based approach with actual border coordinates.
 * The current implementation is sufficient for filtering trips and preventing
 * obvious geographic mismatches (e.g., trips in Europe or Asia outside Kazakhstan).
 */
export const KAZAKHSTAN_BOUNDS = {
  minLat: 40.5,
  maxLat: 55.5,
  minLng: 46.5,
  maxLng: 87.5,
} as const;

/**
 * Check if a coordinate point is within Kazakhstan's geographic boundaries
 * 
 * @param lat - Latitude of the point
 * @param lng - Longitude of the point
 * @returns true if the point is within Kazakhstan bounds, false otherwise
 */
export function isWithinKazakhstan(lat: number, lng: number): boolean {
  return (
    lat >= KAZAKHSTAN_BOUNDS.minLat &&
    lat <= KAZAKHSTAN_BOUNDS.maxLat &&
    lng >= KAZAKHSTAN_BOUNDS.minLng &&
    lng <= KAZAKHSTAN_BOUNDS.maxLng
  );
}

/**
 * Check if a trip (origin and destination) is within Kazakhstan's geographic boundaries
 * Both origin and destination must be within Kazakhstan for the trip to be considered valid
 * 
 * @param originLat - Origin latitude
 * @param originLng - Origin longitude
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @returns true if both origin and destination are within Kazakhstan, false otherwise
 */
export function isTripWithinKazakhstan(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): boolean {
  const originInKazakhstan = isWithinKazakhstan(originLat, originLng);
  const destInKazakhstan = isWithinKazakhstan(destLat, destLng);
  
  return originInKazakhstan && destInKazakhstan;
}

/**
 * Validate that coordinates are valid numbers and within valid lat/lng ranges
 * 
 * @param lat - Latitude to validate
 * @param lng - Longitude to validate
 * @returns true if coordinates are valid, false otherwise
 */
export function areCoordinatesValid(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get a descriptive error message for why coordinates are invalid
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Error message or null if valid
 */
export function getCoordinateErrorMessage(lat: number, lng: number): string | null {
  if (!areCoordinatesValid(lat, lng)) {
    return 'Invalid coordinates: Latitude must be between -90 and 90, longitude must be between -180 and 180';
  }
  
  if (!isWithinKazakhstan(lat, lng)) {
    return 'Coordinates are outside Kazakhstan geographic boundaries';
  }
  
  return null;
}
