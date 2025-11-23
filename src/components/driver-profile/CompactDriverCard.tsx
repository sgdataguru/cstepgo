'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, CheckCircle, Briefcase, Users } from 'lucide-react';

export interface CompactDriverCardProps {
  driver: {
    id: string;
    name: string;
    photoUrl?: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    currentLocation?: string;
    availability: string;
    vehicleType?: string;
    vehicleCapacity?: number;
    luggageCapacity?: number;
    languages: string[];
  };
  showBookButton?: boolean;
  onBookClick?: () => void;
}

/**
 * Compact Driver Card - For trip listings and search results
 * Matches the design mockup provided
 */
export default function CompactDriverCard({
  driver,
  showBookButton = true,
  onBookClick,
}: CompactDriverCardProps) {
  const isAvailable = driver.availability === 'AVAILABLE';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Header - Driver Info */}
      <div className="flex gap-4">
        {/* Avatar with Verification */}
        <div className="relative flex-shrink-0">
          <div className="relative w-16 h-16 md:w-20 md:h-20">
            <Image
              src={driver.photoUrl || '/default-avatar.png'}
              alt={driver.name}
              fill
              className="rounded-full object-cover"
            />
            {driver.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white dark:border-gray-800">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Driver Details */}
        <div className="flex-1 min-w-0">
          {/* Name and Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {driver.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Professional driver
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {driver.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              · {driver.reviewCount} reviews
            </span>
          </div>

          {/* Availability Status */}
          {driver.currentLocation && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-700 dark:text-gray-300">
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <MapPin className="w-3 h-3" />
              <span className="truncate">{driver.currentLocation}</span>
            </div>
          )}
          
          {isAvailable && (
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              Available today
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Info */}
      {(driver.vehicleType || driver.vehicleCapacity) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          {driver.vehicleType && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{driver.vehicleType}</span>
            </div>
          )}
          {driver.vehicleCapacity && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{driver.vehicleCapacity} seats</span>
            </div>
          )}
          {driver.luggageCapacity !== undefined && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>Luggage: {driver.luggageCapacity}</span>
            </div>
          )}
        </div>
      )}

      {/* Languages */}
      {driver.languages.length > 0 && (
        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          {driver.languages.join(', ')}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/drivers/${driver.id}`}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-center text-sm transition-colors"
        >
          View profile
        </Link>
        {showBookButton && (
          <button
            onClick={onBookClick}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Book now
          </button>
        )}
      </div>
    </div>
  );
}
