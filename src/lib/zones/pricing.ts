// Zone-based pricing calculation

import {
  Attraction,
  PriceCalculation,
  VehicleType,
  Zone,
  ZONE_CONFIG,
  VEHICLE_BASE_PRICES,
  OVERNIGHT_SURCHARGE,
  CROSS_ZONE_PENALTY_RATE,
} from './types';
import { calculateRouteDistance, calculateEstimatedDuration } from './distance';

/**
 * Calculate the total price for a trip based on selected attractions and vehicle type
 * @param attractions Array of selected attractions
 * @param vehicleType Type of vehicle for the trip
 * @param passengers Number of passengers (for per-person calculation)
 * @returns Detailed price calculation with breakdown
 */
export function calculateZonePrice(
  attractions: Attraction[],
  vehicleType: VehicleType,
  passengers: number = 1
): PriceCalculation {
  // Extract unique zones
  const zones = [...new Set(attractions.map(a => a.zone))];
  
  // Base vehicle price
  const baseVehiclePrice = VEHICLE_BASE_PRICES[vehicleType];
  
  // Apply highest zone multiplier
  let maxZone = zones[0] || Zone.A;
  let maxMultiplier = ZONE_CONFIG[maxZone].priceMultiplier;
  
  zones.forEach(zone => {
    const multiplier = ZONE_CONFIG[zone].priceMultiplier;
    if (multiplier > maxMultiplier) {
      maxMultiplier = multiplier;
      maxZone = zone;
    }
  });
  
  const zoneMultiplier = maxMultiplier;
  const zoneAdjustedPrice = baseVehiclePrice * zoneMultiplier;
  
  // Calculate attraction fees based on their zones
  const attractionFees = attractions.reduce((sum, attraction) => {
    return sum + Number(attraction.basePriceImpact);
  }, 0);
  
  // Cross-zone penalty (30% if mixing non-adjacent zones or all 3 zones)
  let crossZonePenaltyAmount = 0;
  const hasZoneA = zones.includes(Zone.A);
  const hasZoneB = zones.includes(Zone.B);
  const hasZoneC = zones.includes(Zone.C);
  
  // Penalty applied if: (A and C without B) OR (all 3 zones)
  if ((hasZoneA && hasZoneC && !hasZoneB) || zones.length >= 3) {
    crossZonePenaltyAmount = CROSS_ZONE_PENALTY_RATE;
  }
  
  // Overnight surcharge (Zone C with multiple attractions)
  let overnightSurcharge = 0;
  const zoneCAttractions = attractions.filter(a => a.zone === Zone.C).length;
  if (zoneCAttractions > 1) {
    overnightSurcharge = OVERNIGHT_SURCHARGE;
  }
  
  // Total calculation
  const subtotal = zoneAdjustedPrice + attractionFees + overnightSurcharge;
  const penaltyAmount = subtotal * crossZonePenaltyAmount;
  const totalPrice = subtotal + penaltyAmount;
  const pricePerPerson = passengers > 0 ? totalPrice / passengers : totalPrice;
  
  // Calculate distance and duration
  const totalDistance = calculateRouteDistance(attractions);
  const estimatedDuration = calculateEstimatedDuration(attractions);
  
  return {
    baseVehiclePrice,
    zoneMultiplier,
    zoneAdjustedPrice,
    attractionFees,
    crossZonePenalty: penaltyAmount,
    overnightSurcharge,
    totalPrice,
    pricePerPerson: Math.round(pricePerPerson),
    breakdown: {
      basePrice: baseVehiclePrice,
      zoneName: `Zone ${maxZone}`,
      zoneMultiplier,
      attractionCount: attractions.length,
      attractionFees,
      crossZonePenalty: crossZonePenaltyAmount > 0 ? crossZonePenaltyAmount : undefined,
      overnightRequired: overnightSurcharge > 0,
      overnightSurcharge,
      totalDistance,
      estimatedDuration,
    },
  };
}

/**
 * Format price for display (with currency)
 * @param price Price in KZT
 * @param currency Currency code
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'KZT'): string {
  return `${Math.round(price).toLocaleString()} ${currency}`;
}

/**
 * Get recommended vehicle types for selected attractions
 * @param attractions Array of selected attractions
 * @returns Array of recommended vehicle types
 */
export function getRecommendedVehicles(attractions: Attraction[]): VehicleType[] {
  if (attractions.length === 0) {
    return [VehicleType.SEDAN, VehicleType.VAN, VehicleType.MINIBUS];
  }

  // Get unique zones
  const zones = [...new Set(attractions.map(a => a.zone))];
  
  // Find the highest zone
  let maxZone = zones[0] || Zone.A;
  zones.forEach(zone => {
    if (ZONE_CONFIG[zone].priceMultiplier > ZONE_CONFIG[maxZone].priceMultiplier) {
      maxZone = zone;
    }
  });
  
  return ZONE_CONFIG[maxZone].vehicleRecommendation;
}
