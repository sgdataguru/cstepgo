/**
 * Driver availability constants
 * 
 * Configuration values for driver auto-offline logic and browser-based
 * activity tracking for the CstepGO web application.
 */

// Auto-offline timing (minutes)
// Driver is marked OFFLINE if: now - lastActivityAt >= autoOfflineMinutes
export const DEFAULT_AUTO_OFFLINE_MINUTES = 120; // 2 hours (default)
export const MIN_AUTO_OFFLINE_MINUTES = 60;      // 1 hour (minimum)
export const MAX_AUTO_OFFLINE_MINUTES = 240;     // 4 hours (maximum)

// Heartbeat configuration (milliseconds)
// Periodic heartbeat calls from browser to keep driver ONLINE
export const DRIVER_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const DRIVER_HEARTBEAT_WARNING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes without heartbeat triggers warning

// Activity types that update lastActivityAt
export const DRIVER_ACTIVITY_TYPES = {
  AVAILABILITY_TOGGLE: 'availability_toggle',
  TRIP_ACCEPT: 'trip_accept',
  TRIP_DECLINE: 'trip_decline',
  HEARTBEAT: 'heartbeat',
  LOCATION_UPDATE: 'location_update',
  PREFERENCES_UPDATE: 'preferences_update',
  SCHEDULE_UPDATE: 'schedule_update',
  PORTAL_ACTION: 'portal_action',
} as const;

// Driver availability statuses
export const DRIVER_AVAILABILITY = {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
} as const;

// Auto-offline change reason templates
export const AUTO_OFFLINE_REASON = {
  INACTIVITY: (minutes: number) => `Auto-offline after ${minutes} minutes of inactivity`,
  SCHEDULED: (scheduleType: string, reason?: string) => 
    `Scheduled ${scheduleType}: ${reason || 'No reason provided'}`,
  SCHEDULE_ENDED: (scheduleType: string) => `Scheduled ${scheduleType} ended`,
} as const;
