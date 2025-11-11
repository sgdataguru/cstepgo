// Zone-based pricing configuration and types

export enum Zone {
  A = 'A', // City Center: 0-10km radius
  B = 'B', // Suburban: 10-50km radius
  C = 'C', // Regional: 50-200km radius
}

export enum VehicleType {
  SEDAN = 'sedan',
  VAN = 'van',
  MINIBUS = 'minibus',
}

export interface ZoneConfig {
  zone: Zone;
  radiusMin: number; // in km
  radiusMax: number;
  description: string;
  priceMultiplier: number;
  attractionBaseFee: number;
  vehicleRecommendation: VehicleType[];
}

export const ZONE_CONFIG: Record<Zone, ZoneConfig> = {
  [Zone.A]: {
    zone: Zone.A,
    radiusMin: 0,
    radiusMax: 10,
    description: 'City Center - Quick urban tours',
    priceMultiplier: 1.0,
    attractionBaseFee: 10,
    vehicleRecommendation: [VehicleType.SEDAN, VehicleType.VAN],
  },
  [Zone.B]: {
    zone: Zone.B,
    radiusMin: 10,
    radiusMax: 50,
    description: 'Suburban - Day trips to nearby regions',
    priceMultiplier: 1.5,
    attractionBaseFee: 20,
    vehicleRecommendation: [VehicleType.VAN],
  },
  [Zone.C]: {
    zone: Zone.C,
    radiusMin: 50,
    radiusMax: 200,
    description: 'Regional - Multi-day adventures',
    priceMultiplier: 3.0,
    attractionBaseFee: 50,
    vehicleRecommendation: [VehicleType.MINIBUS],
  },
};

export const VEHICLE_BASE_PRICES: Record<VehicleType, number> = {
  [VehicleType.SEDAN]: 5000, // KZT
  [VehicleType.VAN]: 8000,
  [VehicleType.MINIBUS]: 15000,
};

export const OVERNIGHT_SURCHARGE = 5000; // KZT flat fee
export const CROSS_ZONE_PENALTY_RATE = 0.3; // 30% penalty
export const MAX_SINGLE_DAY_DISTANCE = 200; // km

export interface Attraction {
  id: string;
  name: string;
  zone: Zone;
  latitude: number;
  longitude: number;
  basePriceImpact: number;
  estimatedDurationHours: number;
  description?: string;
  category?: string;
  imageUrl?: string;
  address?: string;
  city?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  zoneName: string;
  zoneMultiplier: number;
  attractionCount: number;
  attractionFees: number;
  crossZonePenalty?: number;
  overnightRequired?: boolean;
  overnightSurcharge: number;
  totalDistance: number;
  estimatedDuration: number;
}

export interface PriceCalculation {
  baseVehiclePrice: number;
  zoneMultiplier: number;
  zoneAdjustedPrice: number;
  attractionFees: number;
  crossZonePenalty: number;
  overnightSurcharge: number;
  totalPrice: number;
  pricePerPerson: number;
  breakdown: PriceBreakdown;
}

export interface RouteValidationError {
  type: 'MAX_DISTANCE' | 'BACKTRACKING' | 'OVERNIGHT_REQUIRED' | 'NO_ATTRACTIONS';
  message: string;
  affectedAttractions: string[];
}

export interface RouteValidationWarning {
  type: 'OVERNIGHT_RECOMMENDED' | 'CROSS_ZONE' | 'LONG_DURATION';
  message: string;
  canProceed: boolean;
}

export interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}
