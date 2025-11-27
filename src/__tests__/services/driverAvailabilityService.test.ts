/**
 * Tests for Driver Availability Service - Auto-Offline Logic
 * 
 * This tests the core auto-offline functionality:
 * - ONLINE state: now - lastActivityAt < autoOfflineMinutes
 * - OFFLINE state: now - lastActivityAt >= autoOfflineMinutes
 */

import { 
  DEFAULT_AUTO_OFFLINE_MINUTES,
  MIN_AUTO_OFFLINE_MINUTES,
  MAX_AUTO_OFFLINE_MINUTES,
  DRIVER_HEARTBEAT_INTERVAL_MS,
  DRIVER_ACTIVITY_TYPES,
  DRIVER_AVAILABILITY,
  AUTO_OFFLINE_REASON,
} from '../../lib/constants/driver';

describe('Driver Constants', () => {
  describe('Auto-Offline Configuration', () => {
    it('should have default auto-offline set to 120 minutes (2 hours)', () => {
      expect(DEFAULT_AUTO_OFFLINE_MINUTES).toBe(120);
    });

    it('should have minimum auto-offline set to 60 minutes (1 hour)', () => {
      expect(MIN_AUTO_OFFLINE_MINUTES).toBe(60);
    });

    it('should have maximum auto-offline set to 240 minutes (4 hours)', () => {
      expect(MAX_AUTO_OFFLINE_MINUTES).toBe(240);
    });

    it('should have valid range for auto-offline minutes', () => {
      expect(MIN_AUTO_OFFLINE_MINUTES).toBeLessThan(DEFAULT_AUTO_OFFLINE_MINUTES);
      expect(DEFAULT_AUTO_OFFLINE_MINUTES).toBeLessThan(MAX_AUTO_OFFLINE_MINUTES);
    });
  });

  describe('Heartbeat Configuration', () => {
    it('should have heartbeat interval of 5 minutes', () => {
      expect(DRIVER_HEARTBEAT_INTERVAL_MS).toBe(5 * 60 * 1000);
    });

    it('should have heartbeat interval less than auto-offline threshold', () => {
      // Heartbeat should fire multiple times before auto-offline triggers
      const autoOfflineMs = MIN_AUTO_OFFLINE_MINUTES * 60 * 1000;
      expect(DRIVER_HEARTBEAT_INTERVAL_MS).toBeLessThan(autoOfflineMs);
    });
  });

  describe('Activity Types', () => {
    it('should include heartbeat as an activity type', () => {
      expect(DRIVER_ACTIVITY_TYPES.HEARTBEAT).toBe('heartbeat');
    });

    it('should include all required activity types', () => {
      expect(DRIVER_ACTIVITY_TYPES.AVAILABILITY_TOGGLE).toBeDefined();
      expect(DRIVER_ACTIVITY_TYPES.TRIP_ACCEPT).toBeDefined();
      expect(DRIVER_ACTIVITY_TYPES.TRIP_DECLINE).toBeDefined();
      expect(DRIVER_ACTIVITY_TYPES.HEARTBEAT).toBeDefined();
      expect(DRIVER_ACTIVITY_TYPES.LOCATION_UPDATE).toBeDefined();
      expect(DRIVER_ACTIVITY_TYPES.PREFERENCES_UPDATE).toBeDefined();
      expect(DRIVER_ACTIVITY_TYPES.SCHEDULE_UPDATE).toBeDefined();
      expect(DRIVER_ACTIVITY_TYPES.PORTAL_ACTION).toBeDefined();
    });
  });

  describe('Driver Availability Statuses', () => {
    it('should have correct availability statuses', () => {
      expect(DRIVER_AVAILABILITY.AVAILABLE).toBe('AVAILABLE');
      expect(DRIVER_AVAILABILITY.BUSY).toBe('BUSY');
      expect(DRIVER_AVAILABILITY.OFFLINE).toBe('OFFLINE');
    });
  });

  describe('Auto-Offline Reason Templates', () => {
    it('should generate correct inactivity reason', () => {
      const reason = AUTO_OFFLINE_REASON.INACTIVITY(120);
      expect(reason).toBe('Auto-offline after 120 minutes of inactivity');
    });

    it('should generate correct scheduled reason with custom message', () => {
      const reason = AUTO_OFFLINE_REASON.SCHEDULED('break', 'Lunch break');
      expect(reason).toBe('Scheduled break: Lunch break');
    });

    it('should generate correct scheduled reason without custom message', () => {
      const reason = AUTO_OFFLINE_REASON.SCHEDULED('break');
      expect(reason).toBe('Scheduled break: No reason provided');
    });

    it('should generate correct schedule ended reason', () => {
      const reason = AUTO_OFFLINE_REASON.SCHEDULE_ENDED('break');
      expect(reason).toBe('Scheduled break ended');
    });
  });
});

describe('Auto-Offline Logic', () => {
  /**
   * Test helper to determine if a driver should be set offline
   * This mirrors the logic in driverAvailabilityService.ts
   */
  function shouldSetDriverOffline(
    lastActivityAt: Date | null, 
    autoOfflineMinutes: number | null,
    now: Date = new Date()
  ): boolean {
    // If no lastActivityAt, driver should be set offline
    if (!lastActivityAt) return true;
    
    // Calculate inactivity time
    const inactiveMinutes = (now.getTime() - lastActivityAt.getTime()) / (1000 * 60);
    
    // Use provided timeout or default
    const timeout = autoOfflineMinutes || DEFAULT_AUTO_OFFLINE_MINUTES;
    
    // Driver should be offline if inactive >= timeout
    return inactiveMinutes >= timeout;
  }

  describe('ONLINE state (now - lastActivityAt < autoOfflineMinutes)', () => {
    it('should keep driver online when recently active', () => {
      const now = new Date();
      const recentActivity = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
      
      expect(shouldSetDriverOffline(recentActivity, DEFAULT_AUTO_OFFLINE_MINUTES, now)).toBe(false);
    });

    it('should keep driver online when activity is just under threshold', () => {
      const now = new Date();
      const justUnder = new Date(now.getTime() - (DEFAULT_AUTO_OFFLINE_MINUTES - 1) * 60 * 1000); // 119 minutes ago
      
      expect(shouldSetDriverOffline(justUnder, DEFAULT_AUTO_OFFLINE_MINUTES, now)).toBe(false);
    });

    it('should keep driver online with custom timeout when under threshold', () => {
      const now = new Date();
      const customTimeout = 180; // 3 hours
      const activity = new Date(now.getTime() - 150 * 60 * 1000); // 150 minutes ago (under 180)
      
      expect(shouldSetDriverOffline(activity, customTimeout, now)).toBe(false);
    });

    it('should keep driver online with minimum timeout when under threshold', () => {
      const now = new Date();
      const activity = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago (under 60 min threshold)
      
      expect(shouldSetDriverOffline(activity, MIN_AUTO_OFFLINE_MINUTES, now)).toBe(false);
    });
  });

  describe('OFFLINE state (now - lastActivityAt >= autoOfflineMinutes)', () => {
    it('should set driver offline when no activity recorded', () => {
      expect(shouldSetDriverOffline(null, DEFAULT_AUTO_OFFLINE_MINUTES)).toBe(true);
    });

    it('should set driver offline when activity exceeds default threshold', () => {
      const now = new Date();
      const oldActivity = new Date(now.getTime() - (DEFAULT_AUTO_OFFLINE_MINUTES + 10) * 60 * 1000); // 130 minutes ago
      
      expect(shouldSetDriverOffline(oldActivity, DEFAULT_AUTO_OFFLINE_MINUTES, now)).toBe(true);
    });

    it('should set driver offline when activity equals threshold exactly', () => {
      const now = new Date();
      const exactThreshold = new Date(now.getTime() - DEFAULT_AUTO_OFFLINE_MINUTES * 60 * 1000); // Exactly 120 minutes ago
      
      expect(shouldSetDriverOffline(exactThreshold, DEFAULT_AUTO_OFFLINE_MINUTES, now)).toBe(true);
    });

    it('should set driver offline with custom timeout when exceeded', () => {
      const now = new Date();
      const customTimeout = 180; // 3 hours
      const activity = new Date(now.getTime() - 200 * 60 * 1000); // 200 minutes ago (over 180)
      
      expect(shouldSetDriverOffline(activity, customTimeout, now)).toBe(true);
    });

    it('should use default timeout when autoOfflineMinutes is null', () => {
      const now = new Date();
      // 130 minutes ago - exceeds default 120 but would be under higher thresholds
      const activity = new Date(now.getTime() - 130 * 60 * 1000);
      
      expect(shouldSetDriverOffline(activity, null, now)).toBe(true);
    });

    it('should handle very old activity dates', () => {
      const now = new Date();
      const veryOld = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      expect(shouldSetDriverOffline(veryOld, DEFAULT_AUTO_OFFLINE_MINUTES, now)).toBe(true);
    });
  });

  describe('Boundary conditions', () => {
    it('should handle activity at exactly minimum timeout boundary', () => {
      const now = new Date();
      const atMinBoundary = new Date(now.getTime() - MIN_AUTO_OFFLINE_MINUTES * 60 * 1000);
      
      expect(shouldSetDriverOffline(atMinBoundary, MIN_AUTO_OFFLINE_MINUTES, now)).toBe(true);
    });

    it('should handle activity just before minimum timeout boundary', () => {
      const now = new Date();
      const justBefore = new Date(now.getTime() - (MIN_AUTO_OFFLINE_MINUTES - 0.1) * 60 * 1000);
      
      expect(shouldSetDriverOffline(justBefore, MIN_AUTO_OFFLINE_MINUTES, now)).toBe(false);
    });

    it('should handle activity at maximum timeout boundary', () => {
      const now = new Date();
      const atMaxBoundary = new Date(now.getTime() - MAX_AUTO_OFFLINE_MINUTES * 60 * 1000);
      
      expect(shouldSetDriverOffline(atMaxBoundary, MAX_AUTO_OFFLINE_MINUTES, now)).toBe(true);
    });
  });
});

describe('Heartbeat Logic', () => {
  /**
   * Test helper to simulate heartbeat behavior
   */
  function calculateMinutesUntilOffline(
    lastActivityAt: Date,
    autoOfflineMinutes: number,
    now: Date = new Date()
  ): number {
    const timeSinceActivity = (now.getTime() - lastActivityAt.getTime()) / (1000 * 60);
    return Math.max(0, Math.round(autoOfflineMinutes - timeSinceActivity));
  }

  it('should calculate correct minutes until offline after recent activity', () => {
    const now = new Date();
    const recentActivity = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
    
    const minutesUntil = calculateMinutesUntilOffline(recentActivity, DEFAULT_AUTO_OFFLINE_MINUTES, now);
    expect(minutesUntil).toBe(110); // 120 - 10 = 110 minutes remaining
  });

  it('should return 0 when activity is past threshold', () => {
    const now = new Date();
    const oldActivity = new Date(now.getTime() - 150 * 60 * 1000); // 150 minutes ago
    
    const minutesUntil = calculateMinutesUntilOffline(oldActivity, DEFAULT_AUTO_OFFLINE_MINUTES, now);
    expect(minutesUntil).toBe(0); // Already past threshold
  });

  it('should refresh timer after heartbeat', () => {
    const now = new Date();
    
    // Before heartbeat: 100 minutes since last activity
    const oldActivity = new Date(now.getTime() - 100 * 60 * 1000);
    const beforeHeartbeat = calculateMinutesUntilOffline(oldActivity, DEFAULT_AUTO_OFFLINE_MINUTES, now);
    expect(beforeHeartbeat).toBe(20); // 120 - 100 = 20 minutes remaining
    
    // After heartbeat: activity refreshed to now
    const afterHeartbeat = calculateMinutesUntilOffline(now, DEFAULT_AUTO_OFFLINE_MINUTES, now);
    expect(afterHeartbeat).toBe(DEFAULT_AUTO_OFFLINE_MINUTES); // Full 120 minutes remaining
  });

  it('should extend online time with each heartbeat', () => {
    const now = new Date();
    
    // Simulate multiple heartbeats over time
    const heartbeatInterval = DRIVER_HEARTBEAT_INTERVAL_MS / (1000 * 60); // Convert to minutes
    
    // After 3 heartbeats (15 minutes), driver should still have almost full time remaining
    const lastHeartbeat = new Date(now.getTime() - heartbeatInterval * 1000 * 60); // 5 minutes ago
    const minutesRemaining = calculateMinutesUntilOffline(lastHeartbeat, DEFAULT_AUTO_OFFLINE_MINUTES, now);
    
    expect(minutesRemaining).toBe(DEFAULT_AUTO_OFFLINE_MINUTES - heartbeatInterval);
    expect(minutesRemaining).toBeGreaterThan(MIN_AUTO_OFFLINE_MINUTES); // Still well within online period
  });
});
