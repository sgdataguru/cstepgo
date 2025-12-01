/**
 * Popular Routes Configuration
 * 
 * Source of truth for popular routes displayed on the landing page.
 * Includes both shared rides and sample private trips for discovery.
 */

export interface PopularRoute {
  id: string;
  originCity: string;
  destinationCity: string;
  approxDistance: string;
  startingPrice: number;
  currency: string;
  isPrivateSample: boolean;
  bookingType: 'PRIVATE' | 'SHARED';
  /** Optional real trip ID if this links to an actual trip */
  tripId?: string;
}

/**
 * Popular routes data
 * Mix of shared and private sample routes for user discovery
 */
export const popularRoutes: PopularRoute[] = [
  // Private Sample Routes
  {
    id: 'route-1',
    originCity: 'Almaty',
    destinationCity: 'Charyn Canyon',
    approxDistance: '~200 km',
    startingPrice: 2500,
    currency: 'KZT',
    isPrivateSample: true,
    bookingType: 'PRIVATE',
  },
  {
    id: 'route-2',
    originCity: 'Almaty Airport',
    destinationCity: 'Almaty City',
    approxDistance: '~25 km',
    startingPrice: 800,
    currency: 'KZT',
    isPrivateSample: true,
    bookingType: 'PRIVATE',
  },
  {
    id: 'route-3',
    originCity: 'Bishkek',
    destinationCity: 'Issyk-Kul',
    approxDistance: '~250 km',
    startingPrice: 3000,
    currency: 'KZT',
    isPrivateSample: true,
    bookingType: 'PRIVATE',
  },
  // Shared Routes
  {
    id: 'route-4',
    originCity: 'Almaty',
    destinationCity: 'Bishkek',
    approxDistance: '~240 km',
    startingPrice: 3500,
    currency: 'KZT',
    isPrivateSample: false,
    bookingType: 'SHARED',
  },
  {
    id: 'route-5',
    originCity: 'Almaty',
    destinationCity: 'Medeu',
    approxDistance: '~30 km',
    startingPrice: 1200,
    currency: 'KZT',
    isPrivateSample: false,
    bookingType: 'SHARED',
  },
  {
    id: 'route-6',
    originCity: 'Bishkek',
    destinationCity: 'Osh',
    approxDistance: '~680 km',
    startingPrice: 8500,
    currency: 'KZT',
    isPrivateSample: false,
    bookingType: 'SHARED',
  },
];

/**
 * Build URL params for a popular route
 */
export function buildRouteUrl(route: PopularRoute): string {
  const params = new URLSearchParams({
    origin_city: route.originCity,
    destination_city: route.destinationCity,
  });
  
  if (route.bookingType === 'PRIVATE') {
    params.set('bookingType', 'PRIVATE');
  }
  
  return `/trips?${params.toString()}`;
}

/**
 * Format price with currency symbol
 */
export function formatRoutePrice(route: PopularRoute): string {
  const symbol = route.currency === 'KZT' ? '₸' : route.currency;
  const priceText = `From ${symbol}${route.startingPrice.toLocaleString()}`;
  
  if (route.bookingType === 'PRIVATE') {
    return `${priceText} (Private cab)`;
  }
  
  return priceText;
}
