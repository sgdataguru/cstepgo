'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Star } from 'lucide-react';
import CountdownBadge from './CountdownBadge';
import TripBadge from './TripBadge';
import PricingDisplay from './pricing/PricingDisplay';
import PricingBreakdownModal from './pricing/PricingBreakdownModal';
import ViewItineraryButton from './ViewItineraryButton';
import ItineraryModal from './ItineraryModal';
import type { Trip } from '@/types/trip-types';
import { format } from 'date-fns';
import { calculatePriceBreakdown, estimatePricingFromDistance } from '@/lib/pricing/calculations';
import { calculateDistance, estimateTravelTime } from '@/lib/locations/famous-locations';

export interface TripCardProps {
  trip: Trip;
  onBookClick?: (tripId: string) => void;
  onViewDetails?: (tripId: string) => void;
  showCountdown?: boolean;
  className?: string;
}

/**
 * TripCard - Displays trip information with countdown and booking options
 */
const TripCard: React.FC<TripCardProps> = ({
  trip,
  onBookClick,
  onViewDetails,
  showCountdown = true,
  className = '',
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  
  const availableSeats = trip.capacity.total - trip.capacity.booked;
  
  // Calculate distance and duration from coordinates
  const distance = trip.location.origin.coordinates && trip.location.destination.coordinates
    ? calculateDistance(
        trip.location.origin.coordinates,
        trip.location.destination.coordinates
      )
    : 300; // Default estimate
  
  const duration = estimateTravelTime(distance);
  
  // Calculate dynamic pricing
  const pricingParams = estimatePricingFromDistance(
    distance,
    trip.capacity.total,
    trip.capacity.booked
  );
  
  const breakdown = calculatePriceBreakdown(pricingParams);
  
  // Use calculated price or fallback to trip pricing
  const currentPrice = breakdown.pricePerPerson || trip.pricing.pricePerPerson;
  const originalPrice = breakdown.totalBeforeOccupancy || trip.pricing.basePrice;

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onBookClick?.(trip.id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    onViewDetails?.(trip.id);
  };

  return (
    <div
      className={`card hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Trip Image */}
      <div className="relative h-48 w-full mb-4 -mx-6 -mt-6 bg-gradient-to-br from-teal-500 to-emerald-600">
        <Image
          src={trip.metadata?.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
          alt={trip.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={!trip.metadata?.imageUrl}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        
        {/* Top-left badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {trip.metadata?.isBestSelling && <TripBadge type="bestselling" />}
          {trip.metadata?.isTour && <TripBadge type="tour" />}
        </div>
        
        {/* Top-right countdown */}
        {showCountdown && (
          <div className="absolute top-4 right-4">
            <CountdownBadge departureTime={trip.departureTime} />
          </div>
        )}
      </div>

      {/* Trip Info */}
      <div className="space-y-4">
        {/* Title and Rating */}
        <div>
          <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
            {trip.title}
          </h3>
          
          {/* Rating and Reviews */}
          {trip.metadata?.rating && (
            <div className="flex items-center gap-2 text-sm mb-2">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {trip.metadata.rating}/5
                </span>
              </div>
              {trip.metadata?.reviewCount && (
                <span className="text-gray-500 dark:text-gray-400">
                  | {trip.metadata.reviewCount}+ reviews
                </span>
              )}
            </div>
          )}
          
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
            {trip.description}
          </p>
        </div>

        {/* Location with Distance */}
        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <div>
            <div className="font-medium">{trip.location.destination.name}</div>
            <div className="text-gray-500 dark:text-gray-400">
              Distance: {distance} km from {trip.location.origin.name}
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>{format(trip.departureTime, 'PPp')}</span>
        </div>

        {/* Dynamic Pricing Display with Discount Badge */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Discount Badge */}
          {trip.metadata?.discount && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <span className="text-sm">🎟️</span>
                <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                  SteppeGo discount
                </span>
              </div>
              <div className="px-3 py-1 bg-pink-500 text-white rounded-lg font-bold text-sm">
                {trip.metadata.discount}% off
              </div>
            </div>
          )}
          
          <PricingDisplay
            currentPrice={currentPrice}
            originalPrice={originalPrice}
            currency={trip.pricing.currency}
            totalSeats={trip.capacity.total}
            occupiedSeats={trip.capacity.booked}
            onShowBreakdown={() => setShowBreakdown(true)}
          />
          
          {/* View All Products Link */}
          {trip.metadata?.hasMultipleOptions && (
            <div className="mt-3">
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 underline transition-colors">
                View all {trip.metadata.optionCount}+ products →
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <ViewItineraryButton
            tripId={trip.id}
            onClick={() => setShowItinerary(true)}
            variant="solid"
            size="md"
            className="flex-1"
          />
          {availableSeats > 0 ? (
            <button
              onClick={handleBookClick}
              className="flex-1 btn-primary bg-emerald-500 hover:bg-emerald-600"
            >
              Book Now
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-300 text-gray-500 font-semibold px-6 py-3 rounded-lg cursor-not-allowed"
            >
              Fully Booked
            </button>
          )}
        </div>
      </div>
      
      {/* Pricing Breakdown Modal */}
      <PricingBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        breakdown={breakdown}
        tripDetails={{
          origin: trip.location.origin.name,
          destination: trip.location.destination.name,
          distance,
          duration,
        }}
        seatInfo={{
          total: trip.capacity.total,
          occupied: trip.capacity.booked,
        }}
        currency={trip.pricing.currency}
      />
      
      {/* Itinerary Modal */}
      <ItineraryModal
        trip={trip}
        isOpen={showItinerary}
        onClose={() => setShowItinerary(false)}
        onBook={onBookClick ? () => onBookClick(trip.id) : undefined}
      />
    </div>
  );
};

TripCard.displayName = 'TripCard';

export default TripCard;
