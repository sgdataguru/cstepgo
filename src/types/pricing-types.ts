/**
 * Pricing-related TypeScript type definitions
 */

export interface PricingState {
  tripId: string;
  currentPrice: number;
  originalPrice: number;
  currency: string;
  lastUpdated: Date;
  breakdown: PriceBreakdown | null;
  isLoading: boolean;
  error: string | null;
  priceHistory: PricePoint[];
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

export interface PricePoint {
  timestamp: Date;
  price: number;
  seats: number;
  occupiedSeats: number;
}

export interface PricingParams {
  distance: number;
  duration: number;
  baseRatePerKm: number;
  fixedFees: number;
  platformMargin: number;
  totalSeats: number;
  occupiedSeats: number;
  minimumPrice?: number;
  currency?: string;
}

export interface DynamicPricingHookResult {
  pricing: PricingState;
  breakdown: PriceBreakdown | null;
  isLoading: boolean;
  error: string | null;
  refreshPricing: () => Promise<void>;
  showBreakdown: () => void;
  hideBreakdown: () => void;
}

export interface PriceAnimationConfig {
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  onComplete?: () => void;
}

export interface SeatInfo {
  total: number;
  occupied: number;
  available: number;
}

export interface PriceTier {
  tier: 'excellent' | 'good' | 'fair' | 'standard';
  description: string;
  color: string;
}

export interface PriceProjection {
  seats: number;
  price: number;
  savings: number;
  savingsPercentage: number;
}

// WebSocket event types
export interface PriceUpdateEvent {
  tripId: string;
  newPrice: number;
  occupiedSeats: number;
  totalSeats: number;
  timestamp: Date;
}

export interface SeatBookedEvent {
  tripId: string;
  newOccupiedSeats: number;
  newPrice: number;
  timestamp: Date;
}

// API Response types
export interface CalculatePricingRequest {
  tripId: string;
  includeBreakdown?: boolean;
  includeProjections?: boolean;
}

export interface PricingResponse {
  success: boolean;
  data: {
    tripId: string;
    currentPrice: number;
    originalPrice: number;
    currency: string;
    breakdown?: PriceBreakdown;
    projections?: PriceProjection[];
    lastCalculated: string;
  };
  error?: string;
}

export interface PricingWebSocketEvents {
  'price:update': PriceUpdateEvent;
  'seat:booked': SeatBookedEvent;
  'trip:full': { tripId: string };
}
