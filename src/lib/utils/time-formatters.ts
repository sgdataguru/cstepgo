import { differenceInMilliseconds, differenceInHours, differenceInDays, differenceInMinutes } from 'date-fns';

export type UrgencyLevel = 'high' | 'medium' | 'low' | 'departed';

export interface UrgencyStyles {
  bg: string;
  text: string;
  border: string;
}

/**
 * Calculate time remaining in milliseconds
 */
export function calculateTimeRemaining(targetDate: Date, currentDate: Date = new Date()): number {
  return differenceInMilliseconds(targetDate, currentDate);
}

/**
 * Format time remaining into human-readable string
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Departed';
  }

  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    const hours = totalHours % 24;
    return hours > 0 ? `${totalDays}d ${hours}h` : `${totalDays}d`;
  }

  if (totalHours > 0) {
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${totalHours}h ${minutes}m` : `${totalHours}h`;
  }

  return `${totalMinutes}m`;
}

/**
 * Calculate urgency level based on hours remaining
 */
export function calculateUrgencyLevel(hoursRemaining: number): UrgencyLevel {
  if (hoursRemaining <= 0) {
    return 'departed';
  }
  if (hoursRemaining < 24) {
    return 'high';
  }
  if (hoursRemaining < 72) {
    return 'medium';
  }
  return 'low';
}

/**
 * Get urgency level from target date
 */
export function getUrgencyLevel(targetDate: Date, currentDate: Date = new Date()): UrgencyLevel {
  const hours = differenceInHours(targetDate, currentDate);
  return calculateUrgencyLevel(hours);
}

/**
 * Get styling for urgency level
 */
export function getUrgencyStyles(level: UrgencyLevel): UrgencyStyles {
  const styles: Record<UrgencyLevel, UrgencyStyles> = {
    low: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
    },
    medium: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    high: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    departed: {
      bg: 'bg-gray-50',
      text: 'text-gray-500',
      border: 'border-gray-200',
    },
  };

  return styles[level];
}

/**
 * Get urgency color (for dynamic styling)
 */
export function getUrgencyColor(level: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    low: '#14b8a6',
    medium: '#f59e0b',
    high: '#ef4444',
    departed: '#6b7280',
  };

  return colors[level];
}

/**
 * Format countdown for display with icon
 */
export function formatCountdownDisplay(
  targetDate: Date,
  currentDate: Date = new Date()
): {
  text: string;
  urgencyLevel: UrgencyLevel;
  styles: UrgencyStyles;
  color: string;
} {
  const milliseconds = calculateTimeRemaining(targetDate, currentDate);
  const text = formatTimeRemaining(milliseconds);
  const urgencyLevel = getUrgencyLevel(targetDate, currentDate);
  const styles = getUrgencyStyles(urgencyLevel);
  const color = getUrgencyColor(urgencyLevel);

  return { text, urgencyLevel, styles, color };
}
