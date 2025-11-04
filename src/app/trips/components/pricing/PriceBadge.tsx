'use client';

import React, { memo } from 'react';
import { formatCurrency } from '@/lib/pricing/formatters';

export interface PriceBadgeProps {
  amount: number;
  currency?: string;
  showPerPerson?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * PriceBadge - Displays price with currency formatting
 */
const PriceBadge: React.FC<PriceBadgeProps> = ({
  amount,
  currency = 'KZT',
  showPerPerson = false,
  size = 'md',
  className = '',
}) => {
  const formattedPrice = formatCurrency(amount, currency);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className={`font-bold text-primary-modernSg ${sizeClasses[size]}`}
        aria-label={`Price: ${formattedPrice}`}
      >
        {formattedPrice}
      </span>
      {showPerPerson && (
        <span className="text-xs text-gray-500 font-medium">per person</span>
      )}
    </div>
  );
};

PriceBadge.displayName = 'PriceBadge';

export default memo(PriceBadge);
