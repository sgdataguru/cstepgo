'use client';

import React from 'react';
import PriceBadge from './PriceBadge';
import SavingsIndicator from './SavingsIndicator';
import SeatCounter from './SeatCounter';
import { Info } from 'lucide-react';

export interface PricingDisplayProps {
  currentPrice: number;
  originalPrice?: number;
  currency?: string;
  totalSeats: number;
  occupiedSeats: number;
  onShowBreakdown?: () => void;
  className?: string;
  showSavings?: boolean;
  showSeats?: boolean;
  compact?: boolean;
}

/**
 * PricingDisplay - Main pricing container for trip cards
 */
const PricingDisplay: React.FC<PricingDisplayProps> = ({
  currentPrice,
  originalPrice,
  currency = 'KZT',
  totalSeats,
  occupiedSeats,
  onShowBreakdown,
  className = '',
  showSavings = true,
  showSeats = true,
  compact = false,
}) => {
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const savingsAmount = hasDiscount ? originalPrice - currentPrice : 0;
  const savingsPercentage = hasDiscount 
    ? Math.round((savingsAmount / originalPrice) * 100) 
    : 0;

  if (compact) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <PriceBadge amount={currentPrice} currency={currency} size="sm" />
        {showSeats && (
          <SeatCounter
            filled={occupiedSeats}
            total={totalSeats}
            size="sm"
            showLabel={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Price and Savings */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <PriceBadge amount={currentPrice} currency={currency} showPerPerson />
          {showSavings && hasDiscount && (
            <SavingsIndicator
              originalPrice={originalPrice}
              currentPrice={currentPrice}
              currency={currency}
            />
          )}
        </div>
        
        {onShowBreakdown && (
          <button
            onClick={onShowBreakdown}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-modernSg transition-colors"
            aria-label="View pricing breakdown"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
          </button>
        )}
      </div>

      {/* Seat Counter */}
      {showSeats && (
        <SeatCounter filled={occupiedSeats} total={totalSeats} />
      )}

      {/* Savings Message */}
      {showSavings && hasDiscount && savingsPercentage > 0 && (
        <p className="text-xs text-emerald-600 font-medium">
          Save {savingsPercentage}% with {occupiedSeats} {occupiedSeats === 1 ? 'passenger' : 'passengers'}!
        </p>
      )}
    </div>
  );
};

PricingDisplay.displayName = 'PricingDisplay';

export default PricingDisplay;
