'use client';

import Link from 'next/link';
import BookingForm from '@/components/booking/BookingForm';

/**
 * Trip Creation Page
 * 
 * Single-page entry for booking rides. Uses the BookingForm component which:
 * - Collects origin, destination, ride type (PRIVATE/SHARED), and vehicle type
 * - For Private cabs: BookingForm uses current time as departure (immediate booking)
 * - For Shared rides: BookingForm shows date/time picker with 1 hour minimum advance validation
 * - Does NOT display fare - redirects to trip details for pricing and confirmation
 * 
 * The API gracefully handles missing drivers by creating pending trips.
 */
export default function CreateTripPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-safe-lg">
      <div className="container mx-auto px-4 py-8 pb-32 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="text-primary-modernSg hover:underline mb-4 inline-flex items-center gap-1 min-h-[44px] py-2"
          >
            ← Back to Trips
          </Link>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white">
              Book a Ride
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enter your trip details to see available options and pricing
          </p>
        </div>

        {/* Single-Page Booking Form */}
        <BookingForm variant="default" />
      </div>
    </div>
  );
}
