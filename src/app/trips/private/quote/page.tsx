'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateFare, formatCurrency, estimateDuration, FareCalculationResult } from '@/lib/pricing/fareCalculation';

/**
 * Private Trip Quote Page
 * 
 * Shows fare estimate and driver search UI for private cab bookings.
 * Receives trip data via URL search params from the booking form.
 */

function PrivateQuoteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract trip data from URL params
  const originName = searchParams.get('originName') || '';
  const originAddress = searchParams.get('originAddress') || '';
  const originLat = parseFloat(searchParams.get('originLat') || '0');
  const originLng = parseFloat(searchParams.get('originLng') || '0');
  const destName = searchParams.get('destName') || '';
  const destAddress = searchParams.get('destAddress') || '';
  const destLat = parseFloat(searchParams.get('destLat') || '0');
  const destLng = parseFloat(searchParams.get('destLng') || '0');
  const vehicleType = searchParams.get('vehicleType') || 'sedan';
  
  // State
  const [driverSearchStatus, setDriverSearchStatus] = useState<'searching' | 'found' | 'not_found'>('searching');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  
  // Calculate fare
  const fareEstimate = useMemo((): FareCalculationResult | null => {
    if (!originLat || !destLat) return null;
    
    return calculateFare({
      originLat,
      originLng,
      destLat,
      destLng,
      tripType: 'PRIVATE',
      vehicleType: vehicleType as 'sedan' | 'suv' | 'van' | 'bus',
    });
  }, [originLat, originLng, destLat, destLng, vehicleType]);
  
  const durationEstimate = useMemo(() => {
    if (!fareEstimate) return null;
    return estimateDuration(fareEstimate.distanceKm);
  }, [fareEstimate]);
  
  // Simulate driver search (in production, this would be a real API call)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate finding a driver after 3 seconds
      setDriverSearchStatus('found');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Validate we have required data
  if (!originName || !destName || !originLat || !destLat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Missing Trip Information
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please start your booking from the home page.
            </p>
            <Link
              href="/"
              className="inline-block bg-primary-peranakan text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const handleConfirmBooking = async () => {
    try {
      setConfirming(true);
      setError(null);
      
      // TODO: Re-enable online payments in future - for MVP, use cash only
      // Create the private trip with cash payment
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${originName} to ${destName}`,
          description: `Private cab from ${originName} to ${destName}`,
          origin: {
            name: originName,
            address: originAddress,
            coordinates: { lat: originLat, lng: originLng },
          },
          destination: {
            name: destName,
            address: destAddress,
            coordinates: { lat: destLat, lng: destLng },
          },
          departureDate: new Date().toISOString().split('T')[0],
          departureTime: new Date().toTimeString().slice(0, 5),
          tripType: 'PRIVATE',
          vehicleType,
          basePrice: fareEstimate?.totalFare,
          paymentMethodType: 'CASH_TO_DRIVER', // Cash payment for MVP
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create booking');
      }
      
      setTripId(data.data.id);
      
      // Redirect to confirmation page
      router.push(`/booking/confirmed?tripId=${data.data.id}&fare=${fareEstimate?.totalFare}&currency=KZT`);
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
    } finally {
      setConfirming(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-modernSg hover:underline mb-4 inline-flex items-center gap-1 min-h-[44px] py-2"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
            👑 Private Cab Quote
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Review your fare estimate and confirm your booking
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Route Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Route
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">From</div>
                <div className="font-semibold text-gray-900 dark:text-white text-lg">
                  {originName}
                </div>
                {originAddress && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {originAddress}
                  </div>
                )}
              </div>
              <div className="text-3xl text-purple-500">→</div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">To</div>
                <div className="font-semibold text-gray-900 dark:text-white text-lg">
                  {destName}
                </div>
                {destAddress && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {destAddress}
                  </div>
                )}
              </div>
            </div>
            
            {fareEstimate && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Distance:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {fareEstimate.distanceKm} km
                  </span>
                </div>
                {durationEstimate && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Est. Duration:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {durationEstimate.displayText}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Vehicle:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                    {vehicleType}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Fare Breakdown Card */}
          {fareEstimate && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Fare Estimate
              </h2>
              
              <div className="space-y-3">
                {fareEstimate.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Total Fare
                    </span>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(fareEstimate.totalFare)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  💡 This is an estimate. Final fare may vary based on actual route and traffic conditions.
                </p>
              </div>
            </div>
          )}
          
          {/* Driver Search Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Driver Status
            </h2>
            
            {driverSearchStatus === 'searching' && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                  <div className="absolute inset-0 animate-ping rounded-full bg-purple-400/20"></div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Searching for drivers...
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Looking for available drivers near your pickup location
                  </div>
                </div>
              </div>
            )}
            
            {driverSearchStatus === 'found' && (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-3xl">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    Drivers Available!
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Multiple drivers are ready to accept your ride
                  </div>
                </div>
              </div>
            )}
            
            {driverSearchStatus === 'not_found' && (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-3xl">
                  ⚠️
                </div>
                <div>
                  <div className="font-semibold text-yellow-700 dark:text-yellow-400">
                    No Drivers Available
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Try again in a few minutes or consider a shared ride
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-[#1a1a1a] border border-[#ff0055]/30 rounded-lg p-4 shadow-[0_0_15px_rgba(255,0,85,0.2)]">
              <p className="text-[#ff3366]">{error}</p>
            </div>
          )}
          
          {/* Cash Payment Notice */}
          {driverSearchStatus === 'found' && fareEstimate && (
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 shadow-[0_0_15px_rgba(255,102,0,0.2)]">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💵</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#ff9500] mb-2">
                    Cash Payment at Trip End
                  </h3>
                  <p className="text-[#ffb347] mb-2">
                    You will pay <strong>{formatCurrency(fareEstimate.totalFare)}</strong> to the driver in cash at the end of your trip.
                  </p>
                  <p className="text-sm text-[#cc8800]">
                    No online payment required. Simply have cash ready when you reach your destination.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 px-6 py-4 rounded-xl font-semibold text-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </Link>
            <button
              onClick={handleConfirmBooking}
              disabled={confirming || driverSearchStatus === 'searching'}
              className="flex-1 bg-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Confirming...
                </>
              ) : (
                <>
                  Confirm Private Booking
                  <span className="text-xl">→</span>
                </>
              )}
            </button>
          </div>
          
          {/* Features */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">
              Private Cab Benefits
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <div className="font-medium text-purple-900 dark:text-purple-100">
                    Exclusive Ride
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    No sharing with strangers
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-medium text-purple-900 dark:text-purple-100">
                    Immediate Departure
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    No waiting for others
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <div className="font-medium text-purple-900 dark:text-purple-100">
                    Direct Route
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    Fastest path to destination
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrivateQuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quote...</p>
        </div>
      </div>
    }>
      <PrivateQuoteContent />
    </Suspense>
  );
}
