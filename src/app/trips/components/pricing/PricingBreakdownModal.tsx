'use client';

import React from 'react';
import { X, TrendingDown, Users, MapPin, Clock } from 'lucide-react';
import { formatCurrency, formatSavingsPercentage } from '@/lib/pricing/formatters';
import type { PriceBreakdown } from '@/types/pricing-types';

export interface PricingBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: PriceBreakdown;
  tripDetails: {
    origin: string;
    destination: string;
    distance: number;
    duration: number;
  };
  seatInfo: {
    total: number;
    occupied: number;
  };
  currency?: string;
}

/**
 * PricingBreakdownModal - Detailed pricing information modal
 */
const PricingBreakdownModal: React.FC<PricingBreakdownModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  tripDetails,
  seatInfo,
  currency = 'KZT',
}) => {
  if (!isOpen) return null;

  const { origin, destination, distance, duration } = tripDetails;
  const { total, occupied } = seatInfo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            id="pricing-modal-title"
            className="text-2xl font-bold text-gray-900"
          >
            Pricing Breakdown
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Trip Summary */}
          <div className="bg-gradient-to-br from-primary-modernSg/10 to-primary-peranakan/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                {origin} → {destination}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span>{distance} km</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{duration.toFixed(1)} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>
                  {occupied}/{total} seats
                </span>
              </div>
            </div>
          </div>

          {/* Base Costs */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Base Costs</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Distance ({distance} km)</span>
                <span className="font-medium">
                  {formatCurrency(breakdown.distanceCost, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Time ({duration.toFixed(1)} hrs)
                </span>
                <span className="font-medium">
                  {formatCurrency(breakdown.timeCost, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fixed Fees</span>
                <span className="font-medium">
                  {formatCurrency(breakdown.fixedFees, currency)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-medium text-gray-700">Subtotal</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.subtotal, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Platform Fee */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (15%)</span>
              <span className="font-medium">
                {formatCurrency(breakdown.platformFee, currency)}
              </span>
            </div>
          </div>

          {/* Dynamic Pricing */}
          <div className="space-y-3 bg-emerald-50 rounded-xl p-4">
            <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Dynamic Savings
            </h3>
            <p className="text-sm text-emerald-700">
              Price decreases as more people join the trip!
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Base Price (1 person)</span>
                <span className="font-medium text-emerald-900">
                  {formatCurrency(breakdown.totalBeforeOccupancy, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">
                  Occupancy Discount ({occupied} {occupied === 1 ? 'person' : 'people'})
                </span>
                <span className="font-medium text-emerald-600">
                  -{formatCurrency(breakdown.occupancyDiscount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Final Price */}
          <div className="bg-primary-modernSg/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-semibold text-gray-900">
                Your Price (per person)
              </span>
              <span className="text-3xl font-bold text-primary-modernSg">
                {formatCurrency(breakdown.pricePerPerson, currency)}
              </span>
            </div>

            {breakdown.savings > 0 && (
              <div className="flex items-center justify-between bg-emerald-100 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-emerald-900">
                  You Save
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(breakdown.savings, currency)} (
                  {formatSavingsPercentage(breakdown.savingsPercentage)})
                </span>
              </div>
            )}

            {breakdown.minimumPriceApplied && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                * Minimum price floor applied
              </p>
            )}
          </div>

          {/* Price Projection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">
              How Price Changes with More Passengers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((seats) => {
                const isCurrentOccupancy = seats === occupied;
                return (
                  <div
                    key={seats}
                    className={`p-3 rounded-lg border-2 text-center ${
                      isCurrentOccupancy
                        ? 'border-primary-modernSg bg-primary-modernSg/5'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="text-xs text-gray-600 mb-1">
                      {seats} {seats === 1 ? 'person' : 'people'}
                    </div>
                    <div
                      className={`font-bold ${
                        isCurrentOccupancy
                          ? 'text-primary-modernSg'
                          : 'text-gray-700'
                      }`}
                    >
                      {formatCurrency(
                        Math.round(breakdown.totalBeforeOccupancy / seats),
                        currency
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-primary-modernSg text-white py-3 rounded-lg font-semibold hover:bg-primary-modernSg/90 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

PricingBreakdownModal.displayName = 'PricingBreakdownModal';

export default PricingBreakdownModal;
