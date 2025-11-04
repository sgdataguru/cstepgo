'use client';

import React, { memo } from 'react';
import { Users } from 'lucide-react';

export interface SeatCounterProps {
  filled: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  showLabel?: boolean;
  className?: string;
}

/**
 * SeatCounter - Visual seat availability indicator
 */
const SeatCounter: React.FC<SeatCounterProps> = ({
  filled,
  total,
  size = 'md',
  showAnimation = true,
  showLabel = true,
  className = '',
}) => {
  const available = total - filled;
  const occupancyPercentage = (filled / total) * 100;

  const sizeClasses = {
    sm: {
      icon: 'w-3 h-3',
      text: 'text-xs',
      height: 'h-1.5',
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      height: 'h-2',
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-base',
      height: 'h-2.5',
    },
  };

  const sizes = sizeClasses[size];

  // Color based on availability
  const getAvailabilityColor = () => {
    if (available === 0) return 'bg-red-500';
    if (available <= total * 0.25) return 'bg-amber-500';
    return 'bg-primary-modernSg';
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Seat Icons and Text */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className={`${sizes.icon} text-gray-500`} aria-hidden="true" />
            <span className={`${sizes.text} text-gray-700 font-medium`}>
              {filled} / {total} seats
            </span>
          </div>
          <span className={`${sizes.text} text-gray-500`}>
            {available} left
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`w-full bg-gray-200 rounded-full ${sizes.height} overflow-hidden`}
        role="progressbar"
        aria-valuenow={occupancyPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${filled} out of ${total} seats booked`}
      >
        <div
          className={`${getAvailabilityColor()} ${sizes.height} rounded-full ${
            showAnimation ? 'transition-all duration-500 ease-out' : ''
          }`}
          style={{ width: `${occupancyPercentage}%` }}
        />
      </div>

      {/* Availability Status */}
      {showLabel && (
        <p className={`${sizes.text} text-gray-500`}>
          {available === 0 ? (
            <span className="text-red-600 font-semibold">Fully Booked</span>
          ) : available === 1 ? (
            <span className="text-amber-600 font-semibold">Last Seat!</span>
          ) : available <= total * 0.25 ? (
            <span className="text-amber-600">Filling Fast</span>
          ) : (
            <span className="text-emerald-600">Available</span>
          )}
        </p>
      )}
    </div>
  );
};

SeatCounter.displayName = 'SeatCounter';

export default memo(SeatCounter);
