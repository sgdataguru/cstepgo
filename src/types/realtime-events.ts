/**
 * Real-Time Event Types for WebSocket Communication
 * Defines event payloads for trip offers, status updates, and notifications
 */

import { TripStatus } from '@prisma/client';

/**
 * Base event structure
 */
export interface BaseEvent {
  timestamp: string;
}

/**
 * Trip Offer Event - Sent to eligible drivers when a trip is published
 */
export interface TripOfferEvent extends BaseEvent {
  type: 'trip.offer.created';
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED'; // Trip type for filtering
  title: string;
  departureTime: string;
  returnTime: string;
  originName: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destName: string;
  destAddress: string;
  destLat: number;
  destLng: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number; // For shared rides
  basePrice: number;
  pricePerSeat?: number; // For shared rides
  platformFee: number;
  estimatedEarnings: number;
  distance: number; // Distance from driver's current location in km
  acceptanceDeadline?: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  difficulty: 'easy' | 'normal' | 'challenging' | 'difficult';
  tenantId?: string; // Multi-tenant context
}

/**
 * Trip Offer Accepted Event - Sent when a driver accepts an offer
 */
export interface TripOfferAcceptedEvent extends BaseEvent {
  type: 'trip.offer.accepted';
  tripId: string;
  driverId: string;
  driverName: string;
  acceptedAt: string;
}

/**
 * Trip Offer Expired Event - Sent when offer deadline passes
 */
export interface TripOfferExpiredEvent extends BaseEvent {
  type: 'trip.offer.expired';
  tripId: string;
  reason: 'timeout' | 'accepted_by_another' | 'cancelled';
}

/**
 * Trip Status Update Event - Sent to passengers and relevant parties
 */
export interface TripStatusUpdateEvent extends BaseEvent {
  type: 'trip.status.updated';
  tripId: string;
  tripTitle: string;
  previousStatus: TripStatus;
  newStatus: TripStatus;
  driverName?: string;
  notes?: string;
  originName: string;
  destName: string;
}

/**
 * Driver Location Update Event - Sent to passengers during active trip
 */
export interface DriverLocationUpdateEvent extends BaseEvent {
  type: 'driver.location.updated';
  tripId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  eta?: {
    pickupMinutes?: number;
    destinationMinutes?: number;
  };
}

/**
 * Notification Event - General notification to drivers or passengers
 */
export interface NotificationEvent extends BaseEvent {
  type: 'notification.driver' | 'notification.passenger';
  notificationId: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'trip' | 'booking' | 'payment' | 'system' | 'chat';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Trip Request Event - Sent when a passenger creates a trip request
 */
export interface TripRequestEvent extends BaseEvent {
  type: 'trip.requested';
  tripId: string;
  title: string;
  organizerId: string;
  organizerName: string;
  departureTime: string;
  originName: string;
  destName: string;
  totalSeats: number;
  estimatedEarnings: number;
  discoveryRadius: number; // km
}

/**
 * Booking Confirmed Event - Sent when a booking is confirmed
 */
export interface BookingConfirmedEvent extends BaseEvent {
  type: 'booking.confirmed';
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED'; // Trip type
  bookingId: string;
  passengerId: string;
  passengerName: string;
  seatsBooked: number;
  availableSeats: number;
  totalSeats: number; // Total seats on trip
  tenantId?: string; // Multi-tenant context
}

/**
 * Booking Cancelled Event - Sent when a booking is cancelled
 */
export interface BookingCancelledEvent extends BaseEvent {
  type: 'booking.cancelled';
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED'; // Trip type
  bookingId: string;
  passengerId: string;
  passengerName: string;
  seatsFreed: number;
  availableSeats: number;
  totalSeats: number; // Total seats on trip
  reason?: string;
  tenantId?: string; // Multi-tenant context
}

/**
 * Union type of all real-time events
 */
export type RealtimeEvent =
  | TripOfferEvent
  | TripOfferAcceptedEvent
  | TripOfferExpiredEvent
  | TripStatusUpdateEvent
  | DriverLocationUpdateEvent
  | NotificationEvent
  | TripRequestEvent
  | BookingConfirmedEvent
  | BookingCancelledEvent;

/**
 * WebSocket subscription types
 */
export interface DriverSubscription {
  driverId: string;
  userId: string;
  filters?: {
    maxDistance?: number; // Maximum distance in km
    minEarnings?: number; // Minimum trip earnings
    tripTypes?: ('PRIVATE' | 'SHARED')[];
    acceptsLongDistance?: boolean;
  };
}

export interface PassengerSubscription {
  passengerId: string;
  userId: string;
  tripIds: string[]; // Trips the passenger has booked or organized
}

/**
 * Socket authentication data
 */
export interface SocketAuthData {
  userId: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  driverId?: string;
  sessionToken: string;
}

/**
 * Socket room naming conventions
 */
export const SOCKET_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  driver: (driverId: string) => `driver:${driverId}`,
  trip: (tripId: string) => `trip:${tripId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  region: (region: string) => `region:${region}`, // For location-based broadcasting
} as const;

/**
 * Event name constants
 */
export const REALTIME_EVENTS = {
  // Trip offer events
  TRIP_OFFER_CREATED: 'trip.offer.created',
  TRIP_OFFER_ACCEPTED: 'trip.offer.accepted',
  TRIP_OFFER_EXPIRED: 'trip.offer.expired',
  
  // Trip status events
  TRIP_STATUS_UPDATED: 'trip.status.updated',
  TRIP_REQUESTED: 'trip.requested',
  
  // Driver location events
  DRIVER_LOCATION_UPDATED: 'driver.location.updated',
  
  // Booking events
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  
  // Notification events
  NOTIFICATION_DRIVER: 'notification.driver',
  NOTIFICATION_PASSENGER: 'notification.passenger',
  
  // Connection events
  CONNECTION_ESTABLISHED: 'connection.established',
  HEARTBEAT: 'heartbeat',
  ERROR: 'error',
} as const;
