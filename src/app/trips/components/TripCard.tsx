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
import { calculateDistance, estimateTravelTime } from '@/lib/utils/distance';

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
  
  const durationInfo = estimateTravelTime(distance);
  const durationInHours = durationInfo.totalMinutes / 60;
  
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
      className={`bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl p-6 hover:border-[#00f0ff]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Trip Image */}
      <div className="relative h-48 w-full mb-4 -mx-6 -mt-6 bg-gradient-to-br from-[#00f0ff]/20 to-[#cc00ff]/20">
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
          {/* Trip Type Badge */}
          {trip.tripType && (
            <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
              trip.tripType === 'PRIVATE' 
                ? 'bg-[#cc00ff] text-white shadow-[0_0_10px_rgba(204,0,255,0.5)]' 
                : 'bg-[#00f0ff] text-[#0a0a0a] shadow-[0_0_10px_rgba(0,240,255,0.5)]'
            }`}>
              {trip.tripType === 'PRIVATE' ? '👑 Private' : '👥 Shared'}
            </div>
          )}
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
          <h3 className="text-xl font-display font-bold text-white mb-2">
            {trip.title}
          </h3>
          
          {/* Rating and Reviews */}
          {trip.metadata?.rating && (
            <div className="flex items-center gap-2 text-sm mb-2">
              <div className="flex items-center gap-1 text-[#FFD700]">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold text-white">
                  {trip.metadata.rating}/5
                </span>
              </div>
              {trip.metadata?.reviewCount && (
                <span className="text-[#808080]">
                  | {trip.metadata.reviewCount}+ reviews
                </span>
              )}
            </div>
          )}
          
          <p className="text-[#b3b3b3] text-sm line-clamp-2">
            {trip.description}
          </p>
        </div>

        {/* Location with Distance */}
        <div className="flex items-start gap-2 text-sm text-[#b3b3b3]">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#00f0ff]" />
          <div>
            <div className="font-medium text-white">{trip.location.destination.name}</div>
            <div className="text-[#808080]">
              Distance: {distance} km from {trip.location.origin.name}
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
          <Calendar className="w-4 h-4 text-[#cc00ff]" />
          <span>{format(trip.departureTime, 'PPp')}</span>
        </div>

        {/* Dynamic Pricing Display with Discount Badge */}
        <div className="pt-4 border-t border-[#252525]">
          {/* Discount Badge */}
          {trip.metadata?.discount && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#cc00ff]/10 rounded-lg border border-[#cc00ff]/30">
                <span className="text-sm">🎟️</span>
                <span className="text-sm font-medium text-[#cc00ff]">
                  SteppeGo discount
                </span>
              </div>
              <div className="px-3 py-1 bg-[#cc00ff] text-white rounded-lg font-bold text-sm shadow-[0_0_10px_rgba(204,0,255,0.5)]">
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
              <button className="text-sm text-[#808080] hover:text-[#00f0ff] underline transition-colors">
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
              className="flex-1 bg-[#00ff88] text-[#0a0a0a] font-semibold px-6 py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all duration-300"
            >
              Book Now
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-[#252525] text-[#666666] font-semibold px-6 py-3 rounded-lg cursor-not-allowed"
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
          duration: durationInHours,
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
