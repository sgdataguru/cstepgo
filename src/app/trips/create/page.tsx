'use client';

import Link from 'next/link';
import BookingForm from '@/components/booking/BookingForm';

export default function CreateTripPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="text-primary-modernSg hover:underline mb-4 inline-block"
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

        {/* Booking Form */}
        <BookingForm variant="default" />
      </div>
    </div>
  );
}
