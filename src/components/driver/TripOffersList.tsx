/**
 * Trip Offers List Component
 * Displays real-time trip offers to drivers with accept/decline actions
 */

'use client';

import React, { useState } from 'react';
import { TripOfferEvent } from '@/types/realtime-events';
import { formatDistance, format } from 'date-fns';
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Navigation,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface TripOffersListProps {
  offers: TripOfferEvent[];
  onAccept: (tripId: string) => void;
  onDecline: (tripId: string, reason?: string) => void;
  isLoading?: boolean;
}

const URGENCY_COLORS = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  normal: 'bg-blue-100 text-blue-700 border-blue-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  urgent: 'bg-red-100 text-red-700 border-red-300',
};

const URGENCY_ICONS = {
  low: Clock,
  normal: Clock,
  high: AlertCircle,
  urgent: Zap,
};

const DIFFICULTY_BADGES = {
  easy: { color: 'bg-green-100 text-green-700', label: 'Easy' },
  normal: { color: 'bg-blue-100 text-blue-700', label: 'Standard' },
  challenging: { color: 'bg-orange-100 text-orange-700', label: 'Challenging' },
  difficult: { color: 'bg-red-100 text-red-700', label: 'Difficult' },
};

export function TripOffersList({
  offers,
  onAccept,
  onDecline,
  isLoading = false,
}: TripOffersListProps) {
  const [acceptingTripId, setAcceptingTripId] = useState<string | null>(null);
  const [decliningTripId, setDecliningTripId] = useState<string | null>(null);

  const handleAccept = (tripId: string) => {
    setAcceptingTripId(tripId);
    onAccept(tripId);
  };

  const handleDecline = (tripId: string) => {
    setDecliningTripId(tripId);
    onDecline(tripId, 'Driver declined');
  };

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Trip Offers Available
        </h3>
        <p className="text-gray-600">
          You&apos;ll be notified when new trip offers become available in your area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Available Trip Offers ({offers.length})
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live Updates
        </div>
      </div>

      {offers.map((offer) => {
        const UrgencyIcon = URGENCY_ICONS[offer.urgency];
        const difficultyBadge = DIFFICULTY_BADGES[offer.difficulty];
        const isAccepting = acceptingTripId === offer.tripId;
        const isDeclining = decliningTripId === offer.tripId;

        return (
          <div
            key={offer.tripId}
            className={`bg-white rounded-lg shadow-md border-2 ${URGENCY_COLORS[offer.urgency]} 
                       transition-all duration-200 hover:shadow-lg`}
          >
            {/* Header with urgency badge */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full ${URGENCY_COLORS[offer.urgency]} 
                               flex items-center gap-2 text-sm font-medium`}>
                  <UrgencyIcon className="w-4 h-4" />
                  {offer.urgency.toUpperCase()}
                </div>
                <div className={`px-3 py-1 rounded-full ${difficultyBadge.color} text-sm font-medium`}>
                  {difficultyBadge.label}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ₸{offer.estimatedEarnings.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Est. Earnings</div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>

              {/* Route */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{offer.originName}</div>
                    <div className="text-xs text-gray-500">{offer.originAddress}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {offer.distance.toFixed(1)} km away
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{offer.destName}</div>
                    <div className="text-xs text-gray-500">{offer.destAddress}</div>
                  </div>
                </div>
              </div>

              {/* Trip Info Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Departure</div>
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(offer.departureTime), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Passengers</div>
                    <div className="text-sm font-medium text-gray-900">
                      {offer.availableSeats} / {offer.totalSeats} seats
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Base Fare</div>
                    <div className="text-sm font-medium text-gray-900">
                      ₸{offer.basePrice.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Your Share (85%)</div>
                    <div className="text-sm font-medium text-green-600">
                      ₸{offer.estimatedEarnings.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span>💵</span>
                  <span className="text-amber-900">
                    <span className="font-medium">Payment:</span> May include cash collection from passengers
                  </span>
                </div>
              </div>

              {/* Deadline */}
              {offer.acceptanceDeadline && (
                <div className="flex items-center justify-between px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <Clock className="w-4 h-4" />
                    <span>
                      Expires {formatDistance(new Date(offer.acceptanceDeadline), new Date(), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => handleAccept(offer.tripId)}
                  disabled={isAccepting || isDeclining || isLoading}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium
                           hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isAccepting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Accept Trip
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDecline(offer.tripId)}
                  disabled={isAccepting || isDeclining || isLoading}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium
                           hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isDeclining ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                      Declining...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Decline
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
