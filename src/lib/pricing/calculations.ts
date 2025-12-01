/**
 * Dynamic Trip Pricing Calculations
 * Implements the pricing formula based on occupancy, distance, and time
 */

import { DEFAULT_PLATFORM_FEE_RATE } from '@/lib/services/platformSettingsService';

export interface PricingParams {
  distance: number; // in km
  duration: number; // in hours
  baseRatePerKm: number; // base cost per km
  fixedFees: number; // fixed operational costs
  platformMargin: number; // platform percentage (0-1)
  totalSeats: number;
  occupiedSeats: number;
  minimumPrice?: number; // optional minimum price floor
  currency?: string;
}

export interface PriceBreakdown {
  distanceCost: number;
  timeCost: number;
  fixedFees: number;
  subtotal: number;
  platformFee: number;
  totalBeforeOccupancy: number;
  occupancyDiscount: number;
  finalTotalPrice: number;
  pricePerPerson: number;
  minimumPriceApplied: boolean;
  savings: number;
  savingsPercentage: number;
}

export interface SeatInfo {
  total: number;
  occupied: number;
  available: number;
}

/**
 * Calculate base trip cost before occupancy adjustment
 */
export function calculateBaseTripCost(params: PricingParams): number {
  const { distance, duration, baseRatePerKm, fixedFees } = params;
  
  // Distance cost: distance * rate per km
  const distanceCost = distance * baseRatePerKm;
  
  // Time cost: duration * hourly rate (derived from base rate)
  const hourlyRate = baseRatePerKm * 30; // Approximate hourly equivalent
  const timeCost = duration * hourlyRate;
  
  // Total base cost
  const baseCost = distanceCost + timeCost + fixedFees;
  
  return Math.round(baseCost);
}

/**
 * Calculate occupancy multiplier
 * More passengers = lower multiplier = lower price per person
 */
export function calculateOccupancyMultiplier(occupiedSeats: number, totalSeats: number): number {
  if (occupiedSeats === 0) return 1.0;
  if (occupiedSeats >= totalSeats) return 1.0 / totalSeats;
  
  // Progressive discount: more seats filled = better rates
  // Formula: 1 / (1 + (occupied / total) * 0.5)
  // This gives gradual discounts as more people join
  const occupancyRatio = occupiedSeats / totalSeats;
  const multiplier = 1 / (1 + occupancyRatio * 1.5);
  
  return multiplier;
}

/**
 * Calculate dynamic price based on occupancy
 */
export function calculateDynamicPrice(params: PricingParams): number {
  const { platformMargin, totalSeats, occupiedSeats, minimumPrice } = params;
  
  // Calculate base cost
  const baseCost = calculateBaseTripCost(params);
  
  // Add platform margin
  const totalWithMargin = baseCost * (1 + platformMargin);
  
  // Apply occupancy multiplier
  const occupancyMultiplier = calculateOccupancyMultiplier(occupiedSeats, totalSeats);
  const adjustedTotal = totalWithMargin * occupancyMultiplier;
  
  // Calculate per-person price
  const seatsToSplitBy = Math.max(occupiedSeats, 1);
  let pricePerPerson = adjustedTotal / seatsToSplitBy;
  
  // Enforce minimum price if specified
  if (minimumPrice && pricePerPerson < minimumPrice) {
    pricePerPerson = minimumPrice;
  }
  
  return Math.round(pricePerPerson);
}

/**
 * Calculate detailed price breakdown
 */
export function calculatePriceBreakdown(params: PricingParams): PriceBreakdown {
  const {
    distance,
    duration,
    baseRatePerKm,
    fixedFees,
    platformMargin,
    totalSeats,
    occupiedSeats,
    minimumPrice = 0,
  } = params;
  
  // Component costs
  const distanceCost = Math.round(distance * baseRatePerKm);
  const hourlyRate = baseRatePerKm * 30;
  const timeCost = Math.round(duration * hourlyRate);
  const subtotal = distanceCost + timeCost + fixedFees;
  
  // Platform fee
  const platformFee = Math.round(subtotal * platformMargin);
  const totalBeforeOccupancy = subtotal + platformFee;
  
  // Occupancy discount
  const occupancyMultiplier = calculateOccupancyMultiplier(occupiedSeats, totalSeats);
  const totalAfterOccupancy = totalBeforeOccupancy * occupancyMultiplier;
  const occupancyDiscount = totalBeforeOccupancy - totalAfterOccupancy;
  
  // Per person calculation
  const seatsToSplitBy = Math.max(occupiedSeats, 1);
  let pricePerPerson = Math.round(totalAfterOccupancy / seatsToSplitBy);
  
  // Check minimum price
  let minimumPriceApplied = false;
  if (minimumPrice && pricePerPerson < minimumPrice) {
    pricePerPerson = minimumPrice;
    minimumPriceApplied = true;
  }
  
  const finalTotalPrice = pricePerPerson * seatsToSplitBy;
  
  // Calculate savings compared to single passenger
  const singlePassengerPrice = Math.round(totalBeforeOccupancy);
  const savings = Math.max(0, singlePassengerPrice - pricePerPerson);
  const savingsPercentage = singlePassengerPrice > 0 
    ? Math.round((savings / singlePassengerPrice) * 100) 
    : 0;
  
  return {
    distanceCost,
    timeCost,
    fixedFees,
    subtotal,
    platformFee,
    totalBeforeOccupancy,
    occupancyDiscount,
    finalTotalPrice,
    pricePerPerson,
    minimumPriceApplied,
    savings,
    savingsPercentage,
  };
}

/**
 * Calculate per-person price with occupancy
 */
export function calculatePerPersonPrice(totalCost: number, seatInfo: SeatInfo): number {
  const { occupied } = seatInfo;
  const seatsToSplitBy = Math.max(occupied, 1);
  return Math.round(totalCost / seatsToSplitBy);
}

/**
 * Enforce minimum price floor
 */
export function enforceMinimumPrice(price: number, minimum: number): number {
  return Math.max(price, minimum);
}

/**
 * Calculate savings percentage
 */
export function calculateSavingsPercentage(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= 0) return 0;
  const savings = originalPrice - currentPrice;
  return Math.round((savings / originalPrice) * 100);
}

/**
 * Project price at different occupancy levels
 * Useful for showing "price drops as more people join"
 */
export function projectPriceAtCapacity(params: PricingParams): Array<{
  seats: number;
  price: number;
  savings: number;
  savingsPercentage: number;
}> {
  const { totalSeats } = params;
  const projection: Array<{
    seats: number;
    price: number;
    savings: number;
    savingsPercentage: number;
  }> = [];
  
  // Calculate price for single passenger as baseline
  const baselinePrice = calculateDynamicPrice({ ...params, occupiedSeats: 1 });
  
  // Project prices for each occupancy level
  for (let seats = 1; seats <= totalSeats; seats++) {
    const price = calculateDynamicPrice({ ...params, occupiedSeats: seats });
    const savings = Math.max(0, baselinePrice - price);
    const savingsPercentage = calculateSavingsPercentage(baselinePrice, price);
    
    projection.push({
      seats,
      price,
      savings,
      savingsPercentage,
    });
  }
  
  return projection;
}

/**
 * Estimate pricing based on route distance
 * Uses Kazakhstan/Kyrgyzstan typical rates
 */
export function estimatePricingFromDistance(
  distanceKm: number,
  totalSeats: number = 4,
  occupiedSeats: number = 1
): PricingParams {
  // Typical rates for Central Asia
  const baseRatePerKm = 50; // KZT per km (approximately)
  const fixedFees = 2000; // KZT (fuel, tolls, etc.)
  const platformMargin = DEFAULT_PLATFORM_FEE_RATE; // Use configured default platform fee
  const minimumPrice = 3000; // KZT minimum
  
  // Estimate duration (60 km/h average for mountain roads)
  const duration = distanceKm / 60;
  
  return {
    distance: distanceKm,
    duration,
    baseRatePerKm,
    fixedFees,
    platformMargin,
    totalSeats,
    occupiedSeats,
    minimumPrice,
    currency: 'KZT',
  };
}

/**
 * Get pricing tier description
 */
export function getPricingTier(
  currentPrice: number,
  baselinePrice: number
): {
  tier: 'excellent' | 'good' | 'fair' | 'standard';
  description: string;
  color: string;
} {
  const savingsPercentage = calculateSavingsPercentage(baselinePrice, currentPrice);
  
  if (savingsPercentage >= 40) {
    return {
      tier: 'excellent',
      description: 'Excellent Value',
      color: '#10b981', // emerald
    };
  } else if (savingsPercentage >= 25) {
    return {
      tier: 'good',
      description: 'Good Value',
      color: '#3b82f6', // blue
    };
  } else if (savingsPercentage >= 10) {
    return {
      tier: 'fair',
      description: 'Fair Price',
      color: '#f59e0b', // amber
    };
  } else {
    return {
      tier: 'standard',
      description: 'Standard Rate',
      color: '#6b7280', // gray
    };
  }
}
