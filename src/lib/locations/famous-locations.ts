/**
 * Famous locations in Kazakhstan and Kyrgyzstan
 * Used for autocomplete suggestions and quick selection
 */

export interface FamousLocation {
  id: string;
  name: string;
  country: 'Kazakhstan' | 'Kyrgyzstan';
  address: string;
  placeId?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'city' | 'landmark' | 'region';
  description?: string;
  isPopular?: boolean;
}

/**
 * Famous cities and locations in Kazakhstan
 */
export const KAZAKHSTAN_LOCATIONS: FamousLocation[] = [
  // Major Cities
  {
    id: 'kz-almaty',
    name: 'Almaty',
    country: 'Kazakhstan',
    address: 'Almaty, Kazakhstan',
    coordinates: { lat: 43.2220, lng: 76.8512 },
    type: 'city',
    description: 'Largest city and former capital',
    isPopular: true,
  },
  {
    id: 'kz-astana',
    name: 'Astana (Nur-Sultan)',
    country: 'Kazakhstan',
    address: 'Astana, Kazakhstan',
    coordinates: { lat: 51.1694, lng: 71.4491 },
    type: 'city',
    description: 'Capital city',
    isPopular: true,
  },
  {
    id: 'kz-shymkent',
    name: 'Shymkent',
    country: 'Kazakhstan',
    address: 'Shymkent, Kazakhstan',
    coordinates: { lat: 42.3417, lng: 69.5901 },
    type: 'city',
    description: 'Third largest city',
    isPopular: true,
  },
  {
    id: 'kz-karaganda',
    name: 'Karaganda',
    country: 'Kazakhstan',
    address: 'Karaganda, Kazakhstan',
    coordinates: { lat: 49.8028, lng: 73.0878 },
    type: 'city',
    description: 'Industrial center',
    isPopular: true,
  },
  {
    id: 'kz-aktobe',
    name: 'Aktobe',
    country: 'Kazakhstan',
    address: 'Aktobe, Kazakhstan',
    coordinates: { lat: 50.2797, lng: 57.2070 },
    type: 'city',
    description: 'Western Kazakhstan',
    isPopular: false,
  },
  {
    id: 'kz-taraz',
    name: 'Taraz',
    country: 'Kazakhstan',
    address: 'Taraz, Kazakhstan',
    coordinates: { lat: 42.9000, lng: 71.3667 },
    type: 'city',
    description: 'Ancient Silk Road city',
    isPopular: false,
  },
  {
    id: 'kz-pavlodar',
    name: 'Pavlodar',
    country: 'Kazakhstan',
    address: 'Pavlodar, Kazakhstan',
    coordinates: { lat: 52.2873, lng: 76.9674 },
    type: 'city',
    description: 'Northern industrial city',
    isPopular: false,
  },
  {
    id: 'kz-semey',
    name: 'Semey',
    country: 'Kazakhstan',
    address: 'Semey, Kazakhstan',
    coordinates: { lat: 50.4265, lng: 80.2647 },
    type: 'city',
    description: 'Eastern Kazakhstan',
    isPopular: false,
  },
  {
    id: 'kz-atyrau',
    name: 'Atyrau',
    country: 'Kazakhstan',
    address: 'Atyrau, Kazakhstan',
    coordinates: { lat: 47.1164, lng: 51.8834 },
    type: 'city',
    description: 'Oil capital',
    isPopular: false,
  },
  {
    id: 'kz-kostanay',
    name: 'Kostanay',
    country: 'Kazakhstan',
    address: 'Kostanay, Kazakhstan',
    coordinates: { lat: 53.2144, lng: 63.6246 },
    type: 'city',
    description: 'Northern city',
    isPopular: false,
  },

  // Famous Landmarks
  {
    id: 'kz-medeu',
    name: 'Medeu',
    country: 'Kazakhstan',
    address: 'Medeu, Almaty Region, Kazakhstan',
    coordinates: { lat: 43.1667, lng: 77.0833 },
    type: 'landmark',
    description: 'Famous ice skating rink',
    isPopular: true,
  },
  {
    id: 'kz-shymbulak',
    name: 'Shymbulak Ski Resort',
    country: 'Kazakhstan',
    address: 'Shymbulak, Almaty Region, Kazakhstan',
    coordinates: { lat: 43.1167, lng: 77.0667 },
    type: 'landmark',
    description: 'Premier ski resort',
    isPopular: true,
  },
  {
    id: 'kz-charyn',
    name: 'Charyn Canyon',
    country: 'Kazakhstan',
    address: 'Charyn National Park, Kazakhstan',
    coordinates: { lat: 43.3500, lng: 79.0833 },
    type: 'landmark',
    description: 'Grand Canyon of Kazakhstan',
    isPopular: true,
  },
  {
    id: 'kz-big-almaty-lake',
    name: 'Big Almaty Lake',
    country: 'Kazakhstan',
    address: 'Big Almaty Lake, Almaty Region, Kazakhstan',
    coordinates: { lat: 43.0556, lng: 76.9833 },
    type: 'landmark',
    description: 'Scenic mountain lake',
    isPopular: true,
  },
  {
    id: 'kz-turkistan',
    name: 'Turkistan',
    country: 'Kazakhstan',
    address: 'Turkistan, Kazakhstan',
    coordinates: { lat: 43.3000, lng: 68.2667 },
    type: 'landmark',
    description: 'Historic city with Yasawi Mausoleum',
    isPopular: true,
  },
  {
    id: 'kz-kolsai-lakes',
    name: 'Kolsai Lakes',
    country: 'Kazakhstan',
    address: 'Kolsai Lakes National Park, Kazakhstan',
    coordinates: { lat: 42.9667, lng: 78.3333 },
    type: 'landmark',
    description: 'Three beautiful mountain lakes',
    isPopular: true,
  },
  {
    id: 'kz-kaindy-lake',
    name: 'Kaindy Lake',
    country: 'Kazakhstan',
    address: 'Kaindy Lake, Almaty Region, Kazakhstan',
    coordinates: { lat: 42.9833, lng: 78.4500 },
    type: 'landmark',
    description: 'Sunken forest lake',
    isPopular: true,
  },
];

/**
 * Famous cities and locations in Kyrgyzstan
 */
export const KYRGYZSTAN_LOCATIONS: FamousLocation[] = [
  // Major Cities
  {
    id: 'kg-bishkek',
    name: 'Bishkek',
    country: 'Kyrgyzstan',
    address: 'Bishkek, Kyrgyzstan',
    coordinates: { lat: 42.8746, lng: 74.5698 },
    type: 'city',
    description: 'Capital city',
    isPopular: true,
  },
  {
    id: 'kg-osh',
    name: 'Osh',
    country: 'Kyrgyzstan',
    address: 'Osh, Kyrgyzstan',
    coordinates: { lat: 40.5283, lng: 72.7985 },
    type: 'city',
    description: 'Second largest city, Southern capital',
    isPopular: true,
  },
  {
    id: 'kg-jalal-abad',
    name: 'Jalal-Abad',
    country: 'Kyrgyzstan',
    address: 'Jalal-Abad, Kyrgyzstan',
    coordinates: { lat: 40.9333, lng: 73.0000 },
    type: 'city',
    description: 'Southern city',
    isPopular: false,
  },
  {
    id: 'kg-karakol',
    name: 'Karakol',
    country: 'Kyrgyzstan',
    address: 'Karakol, Kyrgyzstan',
    coordinates: { lat: 42.4908, lng: 78.3936 },
    type: 'city',
    description: 'Gateway to Issyk-Kul',
    isPopular: true,
  },
  {
    id: 'kg-tokmok',
    name: 'Tokmok',
    country: 'Kyrgyzstan',
    address: 'Tokmok, Kyrgyzstan',
    coordinates: { lat: 42.8417, lng: 75.2958 },
    type: 'city',
    description: 'Near ancient Burana Tower',
    isPopular: false,
  },
  {
    id: 'kg-naryn',
    name: 'Naryn',
    country: 'Kyrgyzstan',
    address: 'Naryn, Kyrgyzstan',
    coordinates: { lat: 41.4289, lng: 75.9911 },
    type: 'city',
    description: 'Mountain city',
    isPopular: false,
  },

  // Famous Landmarks
  {
    id: 'kg-issyk-kul',
    name: 'Issyk-Kul Lake',
    country: 'Kyrgyzstan',
    address: 'Issyk-Kul, Kyrgyzstan',
    coordinates: { lat: 42.4414, lng: 77.0891 },
    type: 'landmark',
    description: "World's second-largest alpine lake",
    isPopular: true,
  },
  {
    id: 'kg-cholpon-ata',
    name: 'Cholpon-Ata',
    country: 'Kyrgyzstan',
    address: 'Cholpon-Ata, Issyk-Kul Region, Kyrgyzstan',
    coordinates: { lat: 42.6489, lng: 77.0825 },
    type: 'landmark',
    description: 'Resort town on Issyk-Kul',
    isPopular: true,
  },
  {
    id: 'kg-ala-archa',
    name: 'Ala-Archa National Park',
    country: 'Kyrgyzstan',
    address: 'Ala-Archa National Park, Kyrgyzstan',
    coordinates: { lat: 42.5667, lng: 74.5000 },
    type: 'landmark',
    description: 'Alpine national park near Bishkek',
    isPopular: true,
  },
  {
    id: 'kg-song-kol',
    name: 'Song-Kol Lake',
    country: 'Kyrgyzstan',
    address: 'Song-Kol Lake, Naryn Region, Kyrgyzstan',
    coordinates: { lat: 41.8333, lng: 75.1333 },
    type: 'landmark',
    description: 'High-altitude alpine lake',
    isPopular: true,
  },
  {
    id: 'kg-jeti-oguz',
    name: 'Jeti-Oguz (Seven Bulls)',
    country: 'Kyrgyzstan',
    address: 'Jeti-Oguz, Issyk-Kul Region, Kyrgyzstan',
    coordinates: { lat: 42.3667, lng: 78.2333 },
    type: 'landmark',
    description: 'Red rock formations',
    isPopular: true,
  },
  {
    id: 'kg-burana-tower',
    name: 'Burana Tower',
    country: 'Kyrgyzstan',
    address: 'Burana Tower, Chuy Region, Kyrgyzstan',
    coordinates: { lat: 42.7833, lng: 75.2500 },
    type: 'landmark',
    description: 'Ancient minaret',
    isPopular: true,
  },
  {
    id: 'kg-tash-rabat',
    name: 'Tash Rabat',
    country: 'Kyrgyzstan',
    address: 'Tash Rabat, Naryn Region, Kyrgyzstan',
    coordinates: { lat: 40.3167, lng: 75.2333 },
    type: 'landmark',
    description: 'Ancient caravanserai',
    isPopular: true,
  },
  {
    id: 'kg-sary-chelek',
    name: 'Sary-Chelek Lake',
    country: 'Kyrgyzstan',
    address: 'Sary-Chelek Lake, Jalal-Abad Region, Kyrgyzstan',
    coordinates: { lat: 41.7833, lng: 71.9667 },
    type: 'landmark',
    description: 'Mountain lake biosphere reserve',
    isPopular: true,
  },
];

/**
 * All famous locations combined
 */
export const ALL_FAMOUS_LOCATIONS: FamousLocation[] = [
  ...KAZAKHSTAN_LOCATIONS,
  ...KYRGYZSTAN_LOCATIONS,
];

/**
 * Get popular locations (for quick suggestions)
 */
export function getPopularLocations(): FamousLocation[] {
  return ALL_FAMOUS_LOCATIONS.filter((loc) => loc.isPopular);
}

/**
 * Search locations by name or description
 */
export function searchLocations(query: string): FamousLocation[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return getPopularLocations();
  }

  return ALL_FAMOUS_LOCATIONS.filter((loc) => {
    const nameMatch = loc.name.toLowerCase().includes(lowerQuery);
    const addressMatch = loc.address.toLowerCase().includes(lowerQuery);
    const descMatch = loc.description?.toLowerCase().includes(lowerQuery);
    const countryMatch = loc.country.toLowerCase().includes(lowerQuery);
    
    return nameMatch || addressMatch || descMatch || countryMatch;
  }).sort((a, b) => {
    // Prioritize popular locations
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    
    // Then prioritize exact matches
    const aExact = a.name.toLowerCase() === lowerQuery;
    const bExact = b.name.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Then prioritize starts with
    const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
    const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    return 0;
  });
}

/**
 * Get locations by country
 */
export function getLocationsByCountry(country: 'Kazakhstan' | 'Kyrgyzstan'): FamousLocation[] {
  return ALL_FAMOUS_LOCATIONS.filter((loc) => loc.country === country);
}

/**
 * Get location by ID
 */
export function getLocationById(id: string): FamousLocation | undefined {
  return ALL_FAMOUS_LOCATIONS.find((loc) => loc.id === id);
}

/**
 * Calculate distance between two locations (in km)
 * Using Haversine formula
 */
export function calculateDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
    Math.cos(toRad(to.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get estimated travel time (in hours) based on distance
 * Assumes average speed of 60 km/h for mountain roads
 */
export function estimateTravelTime(distanceKm: number): number {
  const avgSpeed = 60; // km/h
  return Math.round((distanceKm / avgSpeed) * 10) / 10; // Round to 1 decimal
}
