/**
 * Trip Broadcasting Utilities
 * 
 * Helper functions for determining when trips should be broadcast to drivers
 */

/**
 * Trip interface for broadcast eligibility checking
 */
export interface BroadcastableTrip {
  tripType: string;
  status: string;
  driverId: string | null;
}

/**
 * Determine if a trip should be broadcast to eligible drivers
 * 
 * A trip is eligible for broadcasting when:
 * 1. It's a PRIVATE trip
 * 2. It has PUBLISHED status
 * 3. It has no driver assigned yet
 * 
 * @param trip Trip object with required fields
 * @returns true if trip should be broadcast to drivers
 */
export function shouldBroadcastTrip(trip: BroadcastableTrip): boolean {
  return (
    trip.tripType === 'PRIVATE' &&
    trip.status === 'PUBLISHED' &&
    trip.driverId === null
  );
}

/**
 * Determine if a trip should be published immediately upon creation
 * 
 * @param tripType 'PRIVATE' or 'SHARED'
 * @param publishImmediatelyFlag Flag indicating immediate publish for shared rides
 * @returns true if trip should be published immediately
 */
export function shouldPublishImmediately(
  tripType: string,
  publishImmediatelyFlag?: boolean
): boolean {
  return tripType === 'PRIVATE' || (tripType === 'SHARED' && !!publishImmediatelyFlag);
}
