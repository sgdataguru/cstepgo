/**
 * Safely parse driver data from localStorage
 * Returns null if parsing fails or data is invalid
 */
export function getDriverDataFromStorage(): { id: string } | null {
  try {
    const driverData = localStorage.getItem('driver_data');
    if (!driverData) return null;
    
    const parsed = JSON.parse(driverData);
    
    // Validate that it has the required id field
    if (parsed && typeof parsed.id === 'string') {
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing driver data from storage:', error);
    return null;
  }
}

/**
 * Get driver session token from localStorage
 */
export function getDriverSessionFromStorage(): string | null {
  return localStorage.getItem('driver_session');
}

/**
 * Check if driver is authenticated and redirect if not
 * Returns driver data and session if authenticated
 */
export function requireDriverAuth(router: any): { driverData: { id: string }, session: string } | null {
  const driverData = getDriverDataFromStorage();
  const session = getDriverSessionFromStorage();
  
  if (!driverData || !session) {
    router.push('/driver/login');
    return null;
  }
  
  return { driverData, session };
}
