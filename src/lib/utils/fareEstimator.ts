/**
 * Trip Bundle Fare Estimation Utility
 * 
 * Calculates estimated fares for single trips and bundles
 * Supports both private (full vehicle) and shared (per-seat) pricing
 */

import { TripZone } from './tripZoneClassifier';

export interface FareEstimate {
  privateFare: number;
  sharedFarePerSeat: number;
  currency: string;
  breakdown: FareBreakdown;
}

export interface FareBreakdown {
  basePrice: number;
  distanceFee: number;
  durationFee: number;
  zonePremium: number;
  platformFee: number;
  subtotal: number;
  total: number;
}

// Base pricing configuration
const PRICING_CONFIG = {
  // Base rates per zone (in KZT)
  BASE_RATES: {
    ZONE_A: 5000,
    ZONE_B: 10000,
    ZONE_C: 20000,
  },
  
  // Per kilometer rate
  RATE_PER_KM: 50,
  
  // Per hour rate
  RATE_PER_HOUR: 1000,
  
  // Zone multipliers
  ZONE_MULTIPLIERS: {
    ZONE_A: 1.0,
    ZONE_B: 1.2,
    ZONE_C: 1.5,
  },
  
  // Platform fee percentage
  PLATFORM_FEE_PERCENTAGE: 0.15, // 15%
  
  // Default number of seats for shared rides
  DEFAULT_SEATS: 4,
  
  // Currency
  CURRENCY: 'KZT',
};

/**
 * Calculate fare estimate for a single trip
 */
export function calculateTripFare(
  zone: TripZone,
  distance: number,
  durationHours: number,
  seats: number = PRICING_CONFIG.DEFAULT_SEATS
): FareEstimate {
  // Base price for the zone
  const basePrice = PRICING_CONFIG.BASE_RATES[zone];
  
  // Distance-based fee
  const distanceFee = distance * PRICING_CONFIG.RATE_PER_KM;
  
  // Duration-based fee
  const durationFee = durationHours * PRICING_CONFIG.RATE_PER_HOUR;
  
  // Zone premium
  const zonePremium = (distanceFee + durationFee) * (PRICING_CONFIG.ZONE_MULTIPLIERS[zone] - 1);
  
  // Subtotal before platform fee
  const subtotal = basePrice + distanceFee + durationFee + zonePremium;
  
  // Platform fee
  const platformFee = subtotal * PRICING_CONFIG.PLATFORM_FEE_PERCENTAGE;
  
  // Total private fare
  const total = subtotal + platformFee;
  
  // Shared fare per seat (divide by number of seats)
  const sharedFarePerSeat = total / seats;
  
  return {
    privateFare: Math.round(total),
    sharedFarePerSeat: Math.round(sharedFarePerSeat),
    currency: PRICING_CONFIG.CURRENCY,
    breakdown: {
      basePrice: Math.round(basePrice),
      distanceFee: Math.round(distanceFee),
      durationFee: Math.round(durationFee),
      zonePremium: Math.round(zonePremium),
      platformFee: Math.round(platformFee),
      subtotal: Math.round(subtotal),
      total: Math.round(total),
    },
  };
}

/**
 * Calculate fare estimate for a bundle of trips
 */
export function calculateBundleFare(
  trips: Array<{
    zone: TripZone;
    distance: number;
    durationHours: number;
  }>,
  seats: number = PRICING_CONFIG.DEFAULT_SEATS
): FareEstimate {
  // Calculate individual trip fares
  const tripFares = trips.map(trip =>
    calculateTripFare(trip.zone, trip.distance, trip.durationHours, seats)
  );
  
  // Sum up all components
  const breakdown: FareBreakdown = {
    basePrice: 0,
    distanceFee: 0,
    durationFee: 0,
    zonePremium: 0,
    platformFee: 0,
    subtotal: 0,
    total: 0,
  };
  
  tripFares.forEach(fare => {
    breakdown.basePrice += fare.breakdown.basePrice;
    breakdown.distanceFee += fare.breakdown.distanceFee;
    breakdown.durationFee += fare.breakdown.durationFee;
    breakdown.zonePremium += fare.breakdown.zonePremium;
    breakdown.platformFee += fare.breakdown.platformFee;
    breakdown.subtotal += fare.breakdown.subtotal;
    breakdown.total += fare.breakdown.total;
  });
  
  // Apply bundle discount (5% off for 2+ trips, 10% off for 3+ trips)
  let bundleDiscount = 0;
  if (trips.length >= 3) {
    bundleDiscount = 0.10;
  } else if (trips.length >= 2) {
    bundleDiscount = 0.05;
  }
  
  if (bundleDiscount > 0) {
    const discountAmount = breakdown.total * bundleDiscount;
    breakdown.total -= discountAmount;
  }
  
  const sharedFarePerSeat = breakdown.total / seats;
  
  return {
    privateFare: Math.round(breakdown.total),
    sharedFarePerSeat: Math.round(sharedFarePerSeat),
    currency: PRICING_CONFIG.CURRENCY,
    breakdown,
  };
}

/**
 * Format fare for display with currency
 */
export function formatFare(amount: number, currency: string = PRICING_CONFIG.CURRENCY): string {
  return `${amount.toLocaleString('en-US')} ${currency}`;
}

/**
 * Calculate potential savings for shared ride
 */
export function calculateSharedSavings(
  privateFare: number,
  sharedFarePerSeat: number,
  actualPassengers: number = 1
): {
  totalCostPrivate: number;
  totalCostShared: number;
  savings: number;
  savingsPercentage: number;
} {
  const totalCostPrivate = privateFare;
  const totalCostShared = sharedFarePerSeat * actualPassengers;
  const savings = totalCostPrivate - totalCostShared;
  const savingsPercentage = (savings / totalCostPrivate) * 100;
  
  return {
    totalCostPrivate,
    totalCostShared,
    savings,
    savingsPercentage: Math.round(savingsPercentage),
  };
}
