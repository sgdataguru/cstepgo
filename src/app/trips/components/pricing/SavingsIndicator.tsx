'use client';

import React, { memo } from 'react';
import { formatCurrency, formatSavingsPercentage } from '@/lib/pricing/formatters';
import { TrendingDown } from 'lucide-react';

export interface SavingsIndicatorProps {
  originalPrice: number;
  currentPrice: number;
  currency?: string;
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * SavingsIndicator - Shows price savings with strikethrough
 */
const SavingsIndicator: React.FC<SavingsIndicatorProps> = ({
  originalPrice,
  currentPrice,
  currency = 'KZT',
  showIcon = true,
  animate = true,
  className = '',
}) => {
  const savings = originalPrice - currentPrice;
  const savingsPercentage = Math.round((savings / originalPrice) * 100);

  if (savings <= 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${
        animate ? 'animate-pulse' : ''
      } ${className}`}
    >
      {showIcon && (
        <TrendingDown className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      )}
      <div className="flex flex-col">
        <span
          className="text-sm text-gray-400 line-through"
          aria-label={`Original price: ${formatCurrency(originalPrice, currency)}`}
        >
          {formatCurrency(originalPrice, currency)}
        </span>
        <span className="text-xs font-semibold text-emerald-600">
          {formatSavingsPercentage(savingsPercentage)} OFF
        </span>
      </div>
    </div>
  );
};

SavingsIndicator.displayName = 'SavingsIndicator';

export default memo(SavingsIndicator);
