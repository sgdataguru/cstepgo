'use client';

import React, { memo } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { getUrgencyStyles } from '@/lib/utils/time-formatters';
import { Clock } from 'lucide-react';

export interface CountdownBadgeProps {
  departureTime: Date;
  serverTime?: Date;
  timezone?: string;
  className?: string;
  showIcon?: boolean;
  onExpire?: () => void;
}

/**
 * CountdownBadge - Displays trip urgency with color-coded countdown
 */
const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  departureTime,
  serverTime,
  className = '',
  showIcon = true,
  onExpire,
}) => {
  const { displayText, urgencyLevel, isExpired } = useCountdown(departureTime, {
    serverTime,
    onExpire,
  });

  const styles = getUrgencyStyles(urgencyLevel);

  if (isExpired) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} text-sm font-semibold ${className}`}
        role="status"
        aria-label="Trip has departed"
      >
        <span>Departed</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} text-sm font-semibold transition-all duration-300 ${className}`}
      role="timer"
      aria-label={`Time remaining: ${displayText}`}
      aria-live="polite"
    >
      {showIcon && <Clock className="w-4 h-4" aria-hidden="true" />}
      <span>{displayText}</span>
    </div>
  );
};

CountdownBadge.displayName = 'CountdownBadge';

export default memo(CountdownBadge);
