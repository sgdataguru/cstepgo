/**
 * Shared Ride Booking Types
 * Type definitions for shared ride seat booking feature with multi-tenant support
 */

export interface SharedRideBookingRequest {
  tripId: string;
  userId: string;
  seatsBooked: number;
  passengers: PassengerInfo[];
  notes?: string;
  tenantId?: string; // Multi-tenant context
}

export interface PassengerInfo {
  name: string;
  age?: number;
  phone?: string;
  specialRequirements?: string;
}

export interface SharedRideBookingResponse {
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    tripId: string;
    tripTitle: string;
    seatsBooked: number;
    seatsRemaining: number;
    totalAmount: number;
    currency: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
    departureTime: Date;
    route: {
      from: string;
      to: string;
    };
    passengers: PassengerInfo[];
    tenantId?: string;
    createdAt: Date;
  };
}

export interface SharedRideTripInfo {
  id: string;
  title: string;
  description: string;
  tripType: 'SHARED';
  departureTime: Date;
  returnTime: Date;
  route: {
    origin: LocationInfo;
    destination: LocationInfo;
  };
  capacity: {
    totalSeats: number;
    bookedSeats: number;
    availableSeats: number;
  };
  pricing: {
    pricePerSeat: number;
    platformFee: number;
    currency: string;
    totalForOnePassenger: number;
  };
  organizer: {
    id: string;
    name: string;
    avatar?: string;
  };
  driver?: {
    id: string;
    name: string;
    rating: number;
    avatar?: string;
  };
  status: string;
  tenantId?: string;
}

export interface LocationInfo {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface SharedRideBookingFilters {
  userId?: string;
  tripId?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  tenantId?: string;
  page?: number;
  limit?: number;
}

export interface SharedRideBookingListResponse {
  success: boolean;
  data: {
    bookings: SharedRideBookingSummary[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface SharedRideBookingSummary {
  id: string;
  tripId: string;
  tripTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  seatsBooked: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  passengers: PassengerInfo[];
  notes?: string;
  tenantId?: string;
  departureTime: Date;
  route: {
    from: string;
    to: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
  };
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}

export interface SeatAvailabilityCheck {
  tripId: string;
  requestedSeats: number;
  availableSeats: number;
  totalSeats: number;
  bookedSeats: number;
  canBook: boolean;
  pricePerSeat: number;
  estimatedTotal: number;
  currency: string;
}

export interface SharedRideSearchFilters {
  origin?: string;
  destination?: string;
  date?: Date;
  minSeats?: number;
  maxPricePerSeat?: number;
  tenantId?: string;
}

/**
 * Driver preferences for shared rides
 */
export interface DriverSharedRidePreferences {
  acceptsSharedTrips: boolean;
  acceptsPrivateTrips: boolean;
  preferredTripTypes?: ('PRIVATE' | 'SHARED')[];
  maxPassengersPerTrip?: number;
}

/**
 * Multi-tenant context validation
 */
export interface TenantContext {
  tenantId: string;
  organizationName: string;
  allowCrossTenantBooking: boolean;
}

/**
 * Shared ride analytics
 */
export interface SharedRideAnalytics {
  totalBookings: number;
  totalSeatsBooked: number;
  averageSeatsPerBooking: number;
  utilizationRate: number; // percentage of seats booked
  revenuePerSeat: number;
  totalRevenue: number;
  tenantId?: string;
}
