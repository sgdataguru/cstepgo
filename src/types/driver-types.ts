// Driver-related TypeScript interfaces for StepperGO

export type DriverRole = 'DRIVER' | 'ORGANIZER';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'REJECTED';
export type VerificationBadgeType = 
  | 'IDENTITY' 
  | 'LICENSE' 
  | 'INSURANCE' 
  | 'BACKGROUND_CHECK' 
  | 'TRAINING';
export type LanguageProficiency = 'NATIVE' | 'FLUENT' | 'CONVERSATIONAL';
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

/**
 * Driver Profile - Complete driver information
 */
export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  bio?: string;
  role: DriverRole;
  
  // Professional Information
  joinedDate: Date;
  yearsOfExperience: number;
  totalTrips: number;
  totalDistance: number; // in kilometers
  
  // Ratings & Reviews
  rating: number; // Average rating (0-5)
  reviewCount: number;
  
  // Verification
  verificationBadges: VerificationBadge[];
  verificationLevel: 'BASIC' | 'STANDARD' | 'PREMIUM';
  isVerified: boolean;
  
  // Communication
  languages: DriverLanguage[];
  responseTime: string; // e.g., "< 1 hour"
  
  // Availability
  availability: AvailabilityStatus;
  currentLocation?: string; // e.g., "Currently in Almaty"
  
  // Vehicle Information
  vehicles: Vehicle[];
  
  // Performance Stats
  onTimePercentage: number;
  cancellationRate: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Verification Badge - Driver trust indicators
 */
export interface VerificationBadge {
  id: string;
  type: VerificationBadgeType;
  status: VerificationStatus;
  verifiedDate?: Date;
  expiryDate?: Date;
  verifiedBy?: string;
  documentUrl?: string;
}

/**
 * Driver Language - Spoken languages with proficiency
 */
export interface DriverLanguage {
  code: string; // ISO 639-1 (e.g., 'en', 'ru', 'kk')
  name: string; // Full name (e.g., 'English', 'Russian')
  proficiency: LanguageProficiency;
}

/**
 * Vehicle - Driver's vehicle information
 */
export interface Vehicle {
  id: string;
  driverId: string;
  
  // Basic Information
  make: string; // e.g., 'Mercedes-Benz'
  model: string; // e.g., 'Sprinter'
  year: number;
  color: string;
  licensePlate: string;
  
  // Vehicle Type
  type: 'SEDAN' | 'SUV' | 'MINIBUS' | 'BUS' | 'VAN';
  
  // Capacity
  passengerCapacity: number;
  luggageCapacity: number;
  
  // Features & Amenities
  amenities: string[]; // e.g., ['WiFi', 'AC', 'USB Charging']
  
  // Documentation
  photos: string[];
  insuranceExpiryDate?: Date;
  registrationExpiryDate?: Date;
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review - Driver review from passenger
 */
export interface Review {
  id: string;
  driverId: string;
  tripId: string;
  
  // Review Content
  rating: number; // 1-5 stars
  comment?: string;
  
  // Reviewer Information
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  
  // Response
  response?: ReviewResponse;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review Response - Driver's response to a review
 */
export interface ReviewResponse {
  comment: string;
  createdAt: Date;
}

/**
 * Review Statistics - Aggregated review data
 */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>; // { 5: 80, 4: 15, 3: 3, 2: 1, 1: 1 }
  recentReviews: Review[];
}

/**
 * Driver Stats - Performance metrics
 */
export interface DriverStats {
  totalTrips: number;
  totalDistance: number;
  totalPassengers: number;
  yearsOfExperience: number;
  onTimeRate: number; // Percentage
  responseTime: string;
  completionRate: number; // Percentage
  cancellationRate: number; // Percentage
}

/**
 * API Response Types
 */
export interface DriverProfileResponse {
  driver: DriverProfile;
  stats: DriverStats;
}

export interface DriverReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface DriverTripsResponse {
  trips: Array<{
    id: string;
    title: string;
    fromLocation: string;
    toLocation: string;
    departureDate: Date;
    price: number;
    availableSeats: number;
    totalSeats: number;
  }>;
  total: number;
}

/**
 * Compact Driver Info - For trip cards and listings
 */
export interface CompactDriverInfo {
  id: string;
  name: string;
  photoUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  currentLocation?: string;
  availability: AvailabilityStatus;
  vehicleType: string;
  vehicleCapacity: number;
  languages: string[]; // e.g., ['English', 'Russian']
}
