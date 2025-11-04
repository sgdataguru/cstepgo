import { useState, useEffect, useRef } from 'react';
import { calculateTimeRemaining, formatTimeRemaining, getUrgencyLevel } from '@/lib/utils/time-formatters';
import type { UrgencyLevel } from '@/lib/utils/time-formatters';

export interface CountdownState {
  timeRemaining: number;
  displayText: string;
  urgencyLevel: UrgencyLevel;
  isExpired: boolean;
}

export interface UseCountdownOptions {
  updateInterval?: number; // milliseconds
  serverTime?: Date; // for time sync
  onExpire?: () => void;
}

/**
 * Hook to manage countdown timer with urgency levels
 */
export function useCountdown(
  targetDate: Date,
  options: UseCountdownOptions = {}
): CountdownState {
  const {
    updateInterval = 60000, // Update every minute by default
    serverTime,
    onExpire,
  } = options;

  const [currentTime, setCurrentTime] = useState<Date>(() => serverTime || new Date());
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  // Update ref when onExpire changes
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Update current time at specified interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  // Calculate countdown values
  const timeRemaining = calculateTimeRemaining(targetDate, currentTime);
  const displayText = formatTimeRemaining(timeRemaining);
  const urgencyLevel = getUrgencyLevel(targetDate, currentTime);
  const isExpired = timeRemaining <= 0;

  // Handle expiration
  useEffect(() => {
    if (isExpired && !hasExpiredRef.current && onExpireRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current();
    }
  }, [isExpired]);

  return {
    timeRemaining,
    displayText,
    urgencyLevel,
    isExpired,
  };
}
