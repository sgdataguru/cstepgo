// Core Trip Types
export interface Trip {
  id: string;
  title: string;
  description: string;
  departureTime: Date;
  returnTime: Date;
  timezone: string;
  status: TripStatus;
  tripType?: 'PRIVATE' | 'SHARED'; // Trip type for filtering and display
  pricing: TripPricing;
  itinerary: TripItinerary;
  capacity: TripCapacity;
  organizer: TripOrganizer;
  location: {
    origin: Location;
    destination: Location;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type TripStatus = 
  | 'draft'
  | 'published'
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TripPricing {
  basePrice: number;
  currency: string;
  pricePerPerson: number;
  dynamicFactors: PricingFactor[];
  platformFee: number;
  minimumPrice: number;
}

export interface PricingFactor {
  type: 'distance' | 'duration' | 'demand' | 'time_of_day';
  value: number;
  multiplier: number;
}

export interface TripItinerary {
  version: string;
  days: ItineraryDay[];
}

export interface ItineraryDay {
  dayNumber: number;
  date: Date | string;
  title: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  startTime: string;
  endTime?: string;
  location: Location;
  type: ActivityType;
  description: string;
  notes?: string;
  order: number;
}

export type ActivityType = 
  | 'transport'
  | 'activity'
  | 'meal'
  | 'accommodation'
  | 'other';

export interface Location {
  name: string;
  address?: string;
  placeId?: string;
  coordinates?: Coordinates;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TripCapacity {
  total: number;
  booked: number;
  available: number;
}

export interface TripOrganizer {
  id: string;
  name: string;
  role: 'DRIVER' | 'ORGANIZER';
  photoUrl?: string;
  rating?: number;
}

// Countdown Types
export interface CountdownState {
  timeRemaining: number; // milliseconds
  displayText: string;
  urgencyLevel: 'high' | 'medium' | 'low' | 'departed';
  isLoading: boolean;
}

export interface UrgencyLevel {
  level: 'high' | 'medium' | 'low' | 'departed';
  color: string;
  backgroundColor: string;
  borderColor: string;
}

// Trip Card Types
export interface TripCardProps {
  trip: Trip;
  onBookClick?: (tripId: string) => void;
  onViewDetails?: (tripId: string) => void;
}
