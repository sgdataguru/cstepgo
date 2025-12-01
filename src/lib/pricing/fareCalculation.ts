/**
 * Simple Fare Calculation for Trip Bookings
 * 
 * Provides deterministic fare calculation based on distance and trip type.
 * Used for both Private and Shared ride fare estimates.
 */

import { DEFAULT_PLATFORM_FEE_RATE } from '@/lib/services/platformSettingsService';

export interface FareCalculationInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  tripType: 'PRIVATE' | 'SHARED';
  vehicleType: 'sedan' | 'suv' | 'van' | 'bus';
  totalSeats?: number;
}

export interface FareCalculationResult {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  vehicleMultiplier: number;
  platformFee: number;
  totalFare: number;
  pricePerSeat: number | null;
  currency: string;
  breakdown: {
    label: string;
    amount: number;
  }[];
}

// Base rates (KZT per km)
const BASE_RATE_PER_KM = 50;
const BASE_FARE = 500; // Minimum base fare

// Vehicle multipliers
const VEHICLE_MULTIPLIERS: Record<string, number> = {
  sedan: 1.0,
  suv: 1.3,
  van: 1.5,
  bus: 2.0,
};

// Default seats by vehicle type
const DEFAULT_SEATS: Record<string, number> = {
  sedan: 4,
  suv: 6,
  van: 8,
  bus: 15,
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Add 20% for road distance approximation (roads aren't straight lines)
  return Math.round(distance * 1.2 * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate fare for a trip
 */
export function calculateFare(input: FareCalculationInput): FareCalculationResult {
  const {
    originLat,
    originLng,
    destLat,
    destLng,
    tripType,
    vehicleType,
    totalSeats,
  } = input;

  // Calculate distance
  const distanceKm = calculateDistanceKm(originLat, originLng, destLat, destLng);
  
  // Get vehicle multiplier
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
  
  // Calculate distance fare
  const distanceFare = Math.round(distanceKm * BASE_RATE_PER_KM * vehicleMultiplier);
  
  // Calculate base fare with vehicle multiplier
  const adjustedBaseFare = Math.round(BASE_FARE * vehicleMultiplier);
  
  // Calculate subtotal before platform fee
  const subtotal = adjustedBaseFare + distanceFare;
  
  // Calculate platform fee
  const platformFee = Math.round(subtotal * DEFAULT_PLATFORM_FEE_RATE);
  
  // Total fare
  const totalFare = subtotal + platformFee;
  
  // Calculate price per seat for shared rides
  const seats = totalSeats || DEFAULT_SEATS[vehicleType] || 4;
  const pricePerSeat = tripType === 'SHARED' 
    ? Math.round(totalFare / seats)
    : null;

  // Build breakdown
  const breakdown = [
    { label: 'Base Fare', amount: adjustedBaseFare },
    { label: `Distance (${distanceKm} km)`, amount: distanceFare },
    { label: 'Platform Fee', amount: platformFee },
  ];

  return {
    baseFare: adjustedBaseFare,
    distanceKm,
    distanceFare,
    vehicleMultiplier,
    platformFee,
    totalFare,
    pricePerSeat,
    currency: 'KZT',
    breakdown,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'KZT'): string {
  if (currency === 'KZT') {
    return `₸${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Estimate travel duration based on distance
 */
export function estimateDuration(distanceKm: number): {
  minutes: number;
  displayText: string;
} {
  // Assume average speed of 50 km/h for mixed city/highway
  const minutes = Math.round((distanceKm / 50) * 60);
  
  if (minutes < 60) {
    return {
      minutes,
      displayText: `~${minutes} min`,
    };
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return {
      minutes,
      displayText: `~${hours} hr`,
    };
  }
  
  return {
    minutes,
    displayText: `~${hours} hr ${remainingMinutes} min`,
  };
}
