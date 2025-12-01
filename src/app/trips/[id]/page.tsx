'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Trip } from '@/types/trip-types';
import CountdownBadge from '../components/CountdownBadge';
import ItineraryModal from '../components/ItineraryModal';
import ViewItineraryButton from '../components/ViewItineraryButton';
import PricingDisplay from '../components/pricing/PricingDisplay';
import TripBadge from '../components/TripBadge';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trips/${params.id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch trip');
        }

        setTrip(data.data);
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTrip();
    }
  }, [params.id]);

  const handleBookTrip = () => {
    // TODO: Implement booking flow in Gate 2
    alert('Booking feature coming in Gate 2! This will integrate with Stripe payments.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-modernSg mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/trips"
            className="text-primary-modernSg hover:underline mb-4 inline-block"
          >
            ← Back to Trips
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Trip Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "The trip you're looking for doesn't exist or has been removed."}
            </p>
            <Link
              href="/trips"
              className="inline-block bg-primary-modernSg text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-modernSg/90 transition-colors"
            >
              Browse All Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/trips"
          className="text-primary-modernSg hover:underline mb-6 inline-block"
        >
          ← Back to Trips
        </Link>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {/* Hero Image */}
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600">
                <Image
                  src={trip.metadata?.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200'}
                  alt={trip.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  unoptimized={!trip.metadata?.imageUrl}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              
              <div className="p-6">
                {/* Title and Badges */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                      {trip.title}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <TripBadge type={trip.status === 'published' ? 'popular' : 'new'} />
                      <CountdownBadge departureTime={trip.departureTime} />
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-4 text-lg mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">From</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {trip.location.origin.name}
                    </div>
                  </div>
                  <div className="text-2xl text-primary-modernSg">→</div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">To</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {trip.location.destination.name}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    About This Trip
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {trip.description}
                  </p>
                </div>

                {/* Trip Details Grid */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Departure
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {new Date(trip.departureTime).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Return
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {new Date(trip.returnTime).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Available Seats
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {trip.capacity.available} of {trip.capacity.total}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Vehicle Type
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white capitalize">
                      {trip.metadata?.vehicleType || 'Sedan'}
                    </div>
                  </div>
                </div>

                {/* Itinerary Button */}
                {trip.itinerary && (
                  <ViewItineraryButton 
                    tripId={trip.id}
                    onClick={() => setShowItinerary(true)} 
                  />
                )}
              </div>
            </div>

            {/* Driver/Organizer Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Driver
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-modernSg to-primary-peranakan rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {trip.organizer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {trip.organizer.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {trip.organizer.role}
                  </div>
                  {trip.organizer.rating && trip.organizer.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium">
                        {trip.organizer.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card (Hidden on Mobile, shown via fixed CTA) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-6">
              <PricingDisplay
                currentPrice={trip.pricing.pricePerPerson}
                originalPrice={trip.pricing.basePrice}
                currency={trip.pricing.currency}
                totalSeats={trip.capacity.total}
                occupiedSeats={trip.capacity.booked}
                showSavings={true}
                showSeats={true}
              />

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleBookTrip}
                  disabled={trip.capacity.available === 0 || trip.status !== 'published'}
                  className="w-full bg-primary-peranakan text-white px-6 py-4 min-h-[48px] rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {trip.capacity.available === 0 ? 'Fully Booked' : 'Book Now'}
                </button>
                
                {trip.status !== 'published' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    This trip is not yet published
                  </p>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                  You won&apos;t be charged yet
                </p>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xl">✓</span>
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xl">✓</span>
                  <span>Free cancellation up to 24h before</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xl">✓</span>
                  <span>Verified driver</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Pricing Card (Visible only on mobile, above the fixed CTA) */}
          <div className="lg:hidden col-span-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-24">
              <PricingDisplay
                currentPrice={trip.pricing.pricePerPerson}
                originalPrice={trip.pricing.basePrice}
                currency={trip.pricing.currency}
                totalSeats={trip.capacity.total}
                occupiedSeats={trip.capacity.booked}
                showSavings={true}
                showSeats={true}
              />

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xl">✓</span>
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xl">✓</span>
                  <span>Free cancellation up to 24h before</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xl">✓</span>
                  <span>Verified driver</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA for Mobile */}
      <div className="fixed-bottom-cta lg:hidden px-4 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">Price per person</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {trip.pricing.currency} {trip.pricing.pricePerPerson.toLocaleString()}
            </div>
          </div>
          <button
            onClick={handleBookTrip}
            disabled={trip.capacity.available === 0 || trip.status !== 'published'}
            className="flex-1 bg-primary-peranakan text-white px-6 py-4 min-h-[48px] rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {trip.capacity.available === 0 ? 'Fully Booked' : 'Book Now'}
          </button>
        </div>
      </div>

      {/* Itinerary Modal */}
      {showItinerary && trip.itinerary && (
        <ItineraryModal
          trip={trip}
          isOpen={showItinerary}
          onClose={() => setShowItinerary(false)}
          onBook={handleBookTrip}
        />
      )}
    </div>
  );
}
