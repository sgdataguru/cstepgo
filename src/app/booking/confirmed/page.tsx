'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/pricing/fareCalculation';

/**
 * Booking Confirmation Page
 * 
 * Shows confirmation details for a successfully created booking
 * with cash payment at trip end messaging.
 */

interface TripDetails {
  id: string;
  title: string;
  originName: string;
  destName: string;
  departureTime: string;
  status: string;
  basePrice: number;
  currency: string;
  driverId: string | null;
  driver?: {
    user: {
      name: string;
      phone: string | null;
    };
    vehicleType: string;
    vehicleModel: string;
    vehicleMake: string;
    vehicleColor: string | null;
    licensePlate: string;
  } | null;
}

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tripId = searchParams.get('tripId');
  const fare = searchParams.get('fare');
  const currency = searchParams.get('currency') || 'KZT';
  
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!tripId) {
        setError('No trip ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/trips/${tripId}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch trip details');
        }
        
        setTrip(data.data);
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripDetails();
  }, [tripId]);
  
  if (!tripId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Invalid Booking
            </h1>
            <p className="text-[#808080] mb-6">
              No booking information found. Please try booking again.
            </p>
            <Link
              href="/"
              className="inline-block bg-[#cc00ff] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(204,0,255,0.5)] transition-all"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
          <p className="text-[#808080]">Loading booking details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Unable to Load Booking
            </h1>
            <p className="text-[#808080] mb-6">
              {error || 'Failed to load booking details'}
            </p>
            <Link
              href="/"
              className="inline-block bg-[#cc00ff] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(204,0,255,0.5)] transition-all"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const estimatedFare = fare ? parseFloat(fare) : Number(trip.basePrice);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-full mb-4 shadow-[0_0_30px_rgba(0,255,136,0.3)]">
              <div className="text-5xl">✓</div>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
              Booking <span className="text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">Confirmed!</span>
            </h1>
            <p className="text-lg text-[#b3b3b3]">
              Your private cab has been booked successfully
            </p>
          </div>
          
          {/* Cash Payment Notice - Prominent */}
          <div className="bg-[#ff6600]/10 border-2 border-[#ff6600]/30 rounded-xl p-6 mb-6 shadow-[0_0_20px_rgba(255,102,0,0.2)]">
            <div className="flex items-start gap-4">
              <div className="text-5xl">💵</div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#ff9500] mb-3">
                  Payment Method: Cash at Trip End
                </h2>
                <div className="space-y-2">
                  <p className="text-[#ff9500]">
                    <strong className="text-2xl">{currency} {estimatedFare.toLocaleString()}</strong>
                  </p>
                  <p className="text-[#ff9500]/80">
                    You will pay the driver in cash at the end of your trip. No online payment is required.
                  </p>
                  <p className="text-sm text-[#ff6600]">
                    💡 Please have the exact amount ready for a smooth experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trip Summary */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Trip Summary
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[#808080] mb-1">Trip</div>
                <div className="font-semibold text-white">
                  {trip.title}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-[#808080] mb-1">From</div>
                  <div className="font-medium text-white">
                    {trip.originName}
                  </div>
                </div>
                <div className="text-2xl text-[#cc00ff]">→</div>
                <div className="flex-1">
                  <div className="text-sm text-[#808080] mb-1">To</div>
                  <div className="font-medium text-white">
                    {trip.destName}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-[#808080] mb-1">Departure Time</div>
                <div className="font-medium text-white">
                  {new Date(trip.departureTime).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-[#808080] mb-1">Estimated Fare</div>
                <div className="text-2xl font-bold text-[#cc00ff] drop-shadow-[0_0_10px_rgba(204,0,255,0.5)]">
                  {currency} {estimatedFare.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Driver Information */}
          {trip.driver ? (
            <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Your Driver
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00f0ff] to-[#cc00ff] rounded-full flex items-center justify-center text-[#0a0a0a] text-xl font-bold">
                    {trip.driver.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {trip.driver.user.name}
                    </div>
                    {trip.driver.user.phone && (
                      <div className="text-sm text-[#b3b3b3]">
                        {trip.driver.user.phone}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-[#252525]">
                  <div className="text-sm text-[#808080] mb-1">Vehicle</div>
                  <div className="font-medium text-white">
                    {trip.driver.vehicleMake} {trip.driver.vehicleModel}
                    {trip.driver.vehicleColor && ` (${trip.driver.vehicleColor})`}
                  </div>
                  <div className="text-sm text-[#b3b3b3]">
                    {trip.driver.licensePlate} • {trip.driver.vehicleType}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0099ff]/10 border border-[#0099ff]/30 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">ℹ️</div>
                <div>
                  <h3 className="font-semibold text-[#0099ff] mb-2">
                    Driver Assignment Pending
                  </h3>
                  <p className="text-[#0099ff]/80 text-sm">
                    A driver will be assigned to your trip shortly. You'll receive a notification with their details.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* What's Next */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              What's Next?
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#cc00ff]/20 border border-[#cc00ff]/30 rounded-full flex items-center justify-center text-[#cc00ff] font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">
                    Wait for Driver Confirmation
                  </div>
                  <div className="text-sm text-[#808080]">
                    You'll receive a notification once a driver accepts your trip
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#cc00ff]/20 border border-[#cc00ff]/30 rounded-full flex items-center justify-center text-[#cc00ff] font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">
                    Track Your Driver
                  </div>
                  <div className="text-sm text-[#808080]">
                    View real-time location and estimated arrival time
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#cc00ff]/20 border border-[#cc00ff]/30 rounded-full flex items-center justify-center text-[#cc00ff] font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">
                    Pay Cash at Trip End
                  </div>
                  <div className="text-sm text-[#808080]">
                    Simply pay {currency} {estimatedFare.toLocaleString()} to the driver when you arrive
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/trips/${tripId}`}
              className="flex-1 bg-[#cc00ff] text-white px-6 py-4 rounded-xl font-semibold text-center hover:shadow-[0_0_20px_rgba(204,0,255,0.5)] transition-all duration-200"
            >
              View Trip Details
            </Link>
            <Link
              href="/"
              className="flex-1 px-6 py-4 rounded-xl font-semibold text-center border-2 border-[#00f0ff]/30 text-[#00f0ff] hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
          <p className="text-[#808080]">Loading...</p>
        </div>
      </div>
    }>
      <BookingConfirmedContent />
    </Suspense>
  );
}
