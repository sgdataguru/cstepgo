'use client';

import { PriceCalculation, formatPrice } from '@/lib/zones';

interface PriceCalculatorProps {
  priceCalculation: PriceCalculation | null;
  loading?: boolean;
}

export default function PriceCalculator({ priceCalculation, loading = false }: PriceCalculatorProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!priceCalculation) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Calculator</h3>
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Select attractions to see pricing
          </p>
        </div>
      </div>
    );
  }

  const { breakdown, totalPrice, pricePerPerson } = priceCalculation;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
      
      {/* Price Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Base Vehicle Price</span>
          <span className="font-medium">{formatPrice(breakdown.basePrice)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{breakdown.zoneName} Multiplier</span>
          <span className="font-medium">×{breakdown.zoneMultiplier}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {breakdown.attractionCount} {breakdown.attractionCount === 1 ? 'Attraction' : 'Attractions'}
          </span>
          <span className="font-medium">{formatPrice(breakdown.attractionFees)}</span>
        </div>

        {breakdown.crossZonePenalty !== undefined && breakdown.crossZonePenalty > 0 && (
          <div className="flex justify-between text-sm text-amber-600">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Cross-Zone Penalty (30%)
            </span>
            <span className="font-medium">+{formatPrice(priceCalculation.crossZonePenalty)}</span>
          </div>
        )}

        {breakdown.overnightRequired && (
          <div className="flex justify-between text-sm text-purple-600">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
              Overnight Surcharge
            </span>
            <span className="font-medium">{formatPrice(breakdown.overnightSurcharge)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg font-semibold text-gray-900">Total Trip Cost</span>
          <span className="text-2xl font-bold text-primary-modernSg">
            {formatPrice(totalPrice)}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Per Person (est.)</span>
          <span className="font-medium">{formatPrice(pricePerPerson)}</span>
        </div>
      </div>

      {/* Trip Stats */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Distance</span>
          <span className="font-medium">{breakdown.totalDistance} km</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Estimated Duration</span>
          <span className="font-medium">{breakdown.estimatedDuration} hours</span>
        </div>
      </div>

      {/* Info Box */}
      {(breakdown.crossZonePenalty !== undefined && breakdown.crossZonePenalty > 0) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            💡 Tip: Group attractions from the same zone to avoid cross-zone penalties.
          </p>
        </div>
      )}
    </div>
  );
}
