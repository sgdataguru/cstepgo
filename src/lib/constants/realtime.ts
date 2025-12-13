/**
 * Real-time WebSocket configuration constants
 */

// Connection timeouts (milliseconds)
export const WEBSOCKET_CONNECT_TIMEOUT = 10000; // 10 seconds
export const WEBSOCKET_HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const WEBSOCKET_RECONNECT_DELAY = 2000; // 2 seconds
export const WEBSOCKET_MAX_RECONNECT_ATTEMPTS = 5;

// Trip offer timeouts (seconds)
export const TRIP_OFFER_DEFAULT_TIMEOUT = 300; // 5 minutes
export const TRIP_OFFER_URGENT_TIMEOUT = 120; // 2 minutes
export const TRIP_OFFER_HIGH_TIMEOUT = 180; // 3 minutes

// Driver subscription settings
export const DEFAULT_DISCOVERY_RADIUS = 50; // km
export const MAX_DISCOVERY_RADIUS = 200; // km
export const MIN_DISCOVERY_RADIUS = 5; // km

// Location update intervals (milliseconds)
export const DRIVER_LOCATION_UPDATE_INTERVAL = 10000; // 10 seconds during active trip
export const DRIVER_LOCATION_IDLE_INTERVAL = 60000; // 1 minute when idle

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Trip urgency levels
export const TRIP_URGENCY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Trip difficulty levels
export const TRIP_DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  CHALLENGING: 'challenging',
  DIFFICULT: 'difficult',
} as const;

// Default driver earnings rate (85% of total fare) - actual rate from database config
// Note: For actual calculations, use getDriverEarningsRate() from platformSettingsService
// These constants are kept for backward compatibility
import { DEFAULT_PLATFORM_FEE_RATE } from '@/lib/services/platformSettingsService';
export const DRIVER_EARNINGS_RATE = 1 - DEFAULT_PLATFORM_FEE_RATE;
export const PLATFORM_FEE_RATE = DEFAULT_PLATFORM_FEE_RATE;

// Distance thresholds for trip matching (km)
export const DISTANCE_THRESHOLDS = {
  VERY_CLOSE: 5,
  CLOSE: 15,
  NEARBY: 30,
  FAR: 50,
} as const;

// ETA thresholds (minutes)
export const ETA_THRESHOLDS = {
  ARRIVING_SOON: 5,
  ARRIVING: 15,
  EN_ROUTE: 30,
} as const;

// Maximum concurrent trip offers per driver
export const MAX_CONCURRENT_OFFERS = 5;

// Subscription cleanup interval (milliseconds)
export const SUBSCRIPTION_CLEANUP_INTERVAL = 300000; // 5 minutes

// Event retention (for debugging)
export const EVENT_LOG_RETENTION = 86400000; // 24 hours in milliseconds

// Location replay settings
export const LOCATION_REPLAY_ENABLED = true; // Enable location replay for new passengers
export const LOCATION_REPLAY_MAX_AGE = 300000; // Only replay if less than 5 minutes old (milliseconds)
export const LOCATION_REPLAY_COUNT = 1; // Number of recent location updates to replay (currently only last one)
