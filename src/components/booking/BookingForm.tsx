'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FamousLocationAutocomplete from '@/components/FamousLocationAutocomplete';
import { Location } from '@/types/trip-types';
import { calculateFare, formatCurrency, estimateDuration } from '@/lib/pricing/fareCalculation';

export interface BookingFormProps {
  /** When true, applies styles for hero section (transparent backgrounds, light text) */
  variant?: 'default' | 'hero';
  /** Optional callback when form submission starts */
  onSubmitStart?: () => void;
  /** Optional callback when form submission completes */
  onSubmitComplete?: (success: boolean, tripId?: string) => void;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Reusable BookingForm component for trip creation
 * Used on both home page (hero variant) and /trips/create page (default variant)
 * 
 * Flow branching:
 * - Private trip: Redirects to /trips/private/quote for fare estimate + driver search
 * - Shared trip: Creates trip immediately via API and redirects to /trips
 */
export default function BookingForm({
  variant = 'default',
  onSubmitStart,
  onSubmitComplete,
  className = '',
}: BookingFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [rideType, setRideType] = useState<'PRIVATE' | 'SHARED'>('PRIVATE');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isHero = variant === 'hero';
  
  // Calculate fare estimate in real-time
  const fareEstimate = useMemo(() => {
    if (!origin?.coordinates || !destination?.coordinates) return null;
    
    return calculateFare({
      originLat: origin.coordinates.lat,
      originLng: origin.coordinates.lng,
      destLat: destination.coordinates.lat,
      destLng: destination.coordinates.lng,
      tripType: rideType,
      vehicleType: vehicleType as 'sedan' | 'suv' | 'van' | 'bus',
    });
  }, [origin, destination, rideType, vehicleType]);
  
  // Calculate estimated duration
  const durationEstimate = useMemo(() => {
    if (!fareEstimate) return null;
    return estimateDuration(fareEstimate.distanceKm);
  }, [fareEstimate]);

  // Initialize current date/time for private rides
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setDepartureDate(dateStr);
    
    // Set current time (rounded to next 5 minutes)
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    
    if (roundedMinutes >= 60) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    } else {
      now.setMinutes(roundedMinutes);
    }
    now.setSeconds(0);
    const timeStr = now.toTimeString().slice(0, 5);
    setDepartureTime(timeStr);
  }, []);

  // Validate departure time for shared rides
  const validateDepartureTime = (): boolean => {
    if (rideType === 'PRIVATE') {
      return true; // No validation needed for private rides
    }

    if (!departureDate || !departureTime) {
      setValidationError('Please select both date and time for shared ride');
      return false;
    }

    const selectedDateTime = new Date(`${departureDate}T${departureTime}`);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (selectedDateTime < oneHourFromNow) {
      setValidationError('Shared rides must be scheduled at least 1 hour in advance');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setValidationError(null);
      onSubmitStart?.();

      // Validate required fields
      if (!origin || !destination) {
        setError('Please select both origin and destination');
        setLoading(false);
        onSubmitComplete?.(false);
        return;
      }

      if (!vehicleType) {
        setError('Please select a vehicle type');
        setLoading(false);
        onSubmitComplete?.(false);
        return;
      }

      // Validate departure time
      if (!validateDepartureTime()) {
        setLoading(false);
        onSubmitComplete?.(false);
        return;
      }

      // ========== BRANCH LOGIC BASED ON TRIP TYPE ==========
      
      if (rideType === 'PRIVATE') {
        // PRIVATE TRIP FLOW:
        // Redirect to fare estimate + driver search page with form data as query params
        const params = new URLSearchParams({
          originName: origin.name,
          originAddress: origin.address || '',
          originLat: String(origin.coordinates?.lat || 0),
          originLng: String(origin.coordinates?.lng || 0),
          destName: destination.name,
          destAddress: destination.address || '',
          destLat: String(destination.coordinates?.lat || 0),
          destLng: String(destination.coordinates?.lng || 0),
          vehicleType,
        });
        
        onSubmitComplete?.(true);
        router.push(`/trips/private/quote?${params.toString()}`);
        return;
      }
      
      // SHARED TRIP FLOW:
      // Create trip immediately and redirect to /trips listing
      
      // For shared rides, validate and use the selected departure time
      const finalDepartureDate = departureDate;
      const finalDepartureTime = departureTime;

      // Generate title
      const title = `${origin.name} to ${destination.name}`;

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: `Shared ride from ${origin.name} to ${destination.name}`,
          origin,
          destination,
          departureDate: finalDepartureDate,
          departureTime: finalDepartureTime,
          tripType: 'SHARED',
          vehicleType,
          // Request immediate publishing for shared rides
          publishImmediately: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create shared trip');
      }

      // Success! For shared trips, redirect to /trips listing with success message
      onSubmitComplete?.(true, data.data.id);
      
      // Show success toast-like behavior via URL param
      router.push(`/trips?created=${data.data.id}&type=shared`);
    } catch (err) {
      console.error('Error creating trip:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trip';
      setError(errorMessage);
      onSubmitComplete?.(false);
    } finally {
      setLoading(false);
    }
  };

  // Style classes based on variant
  const containerClasses = isHero
    ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md'
    : 'bg-white dark:bg-gray-800';
  
  const headingClasses = 'text-gray-900 dark:text-white';

  const textMutedClasses = isHero
    ? 'text-gray-600 dark:text-gray-300'
    : 'text-gray-600 dark:text-gray-400';

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={`max-w-3xl mx-auto ${containerClasses} rounded-2xl shadow-2xl p-6 md:p-8`}>
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Validation Error Display */}
          {validationError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">{validationError}</p>
            </div>
          )}

          {/* Route Section */}
          <div className="space-y-4">
            <h2 className={`text-xl font-semibold ${headingClasses}`}>
              Where are you going?
            </h2>
            
            <div>
              <FamousLocationAutocomplete
                value={origin}
                onChange={setOrigin}
                label="From"
                placeholder="Pick-up location"
                required
              />
            </div>

            <div>
              <FamousLocationAutocomplete
                value={destination}
                onChange={setDestination}
                label="To"
                placeholder="Drop-off location"
                required
              />
            </div>
          </div>

          {/* Ride Type Section */}
          <div className="space-y-3">
            <h2 className={`text-xl font-semibold ${headingClasses}`}>
              Choose Ride Type
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRideType('PRIVATE')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  rideType === 'PRIVATE'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👑</span>
                  <div className="flex-1">
                    <div className={`font-semibold ${headingClasses} flex items-center gap-2`}>
                      Private Cab
                      {rideType === 'PRIVATE' && <span className="text-purple-500">✓</span>}
                    </div>
                    <div className={`text-sm ${textMutedClasses} mt-1`}>
                      Exclusive ride for you and your group
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                      Departs immediately • No sharing
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRideType('SHARED')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  rideType === 'SHARED'
                    ? 'border-primary-modernSg bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👥</span>
                  <div className="flex-1">
                    <div className={`font-semibold ${headingClasses} flex items-center gap-2`}>
                      Shared Ride
                      {rideType === 'SHARED' && <span className="text-primary-modernSg">✓</span>}
                    </div>
                    <div className={`text-sm ${textMutedClasses} mt-1`}>
                      Share with other passengers
                    </div>
                    <div className="text-xs text-primary-modernSg mt-1 font-medium">
                      Schedule ahead • Lower cost
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Departure Time Section - Only for Shared Rides */}
          {rideType === 'SHARED' && (
            <div className="space-y-4">
              <h2 className={`text-xl font-semibold ${headingClasses}`}>
                When do you want to depart?
              </h2>
              <p className={`text-sm ${textMutedClasses}`}>
                Shared rides must be scheduled at least 1 hour in advance
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textMutedClasses} mb-2`}>
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMutedClasses} mb-2`}>
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Type Section */}
          <div className="space-y-3">
            <h2 className={`text-xl font-semibold ${headingClasses}`}>
              Vehicle Type
            </h2>
            
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
              required
            >
              <option value="sedan">Sedan (Default)</option>
              <option value="suv">SUV</option>
              <option value="van">Van/Minibus</option>
              <option value="bus">Bus</option>
            </select>
            <p className={`text-xs ${textMutedClasses}`}>
              Choose your preferred vehicle type
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !origin || !destination}
              className="w-full bg-primary-peranakan text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {rideType === 'SHARED' ? 'Creating Shared Ride...' : 'Processing...'}
                </>
              ) : rideType === 'PRIVATE' ? (
                <>
                  Get Fare Estimate
                  <span className="text-xl">→</span>
                </>
              ) : (
                <>
                  Create Shared Ride
                  <span className="text-xl">→</span>
                </>
              )}
            </button>
            <p className={`text-sm ${textMutedClasses} text-center mt-3`}>
              {rideType === 'PRIVATE' 
                ? 'Next: View fare estimate and search for drivers'
                : 'Your shared ride will be visible in the trips listing'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Trip Summary Preview with Fare Estimate */}
      {(origin || destination) && (
        <div className={`max-w-3xl mx-auto mt-6 ${containerClasses} rounded-lg p-6 shadow-sm border-2 ${rideType === 'PRIVATE' ? 'border-purple-200 dark:border-purple-800' : 'border-primary-modernSg/30 dark:border-primary-modernSg/50'}`}>
          <h3 className={`font-semibold ${headingClasses} mb-4`}>Trip Summary</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className={textMutedClasses}>Type:</span>
              <span className={`ml-2 ${headingClasses} font-medium`}>
                {rideType === 'PRIVATE' ? '👑 Private Cab' : '👥 Shared Ride'}
              </span>
            </div>
            <div>
              <span className={textMutedClasses}>Vehicle:</span>
              <span className={`ml-2 ${headingClasses} font-medium`}>
                {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
              </span>
            </div>
            <div>
              <span className={textMutedClasses}>From:</span>
              <span className={`ml-2 ${headingClasses} font-medium`}>
                {origin?.name || '-'}
              </span>
            </div>
            <div>
              <span className={textMutedClasses}>To:</span>
              <span className={`ml-2 ${headingClasses} font-medium`}>
                {destination?.name || '-'}
              </span>
            </div>
            {rideType === 'SHARED' && departureDate && (
              <>
                <div>
                  <span className={textMutedClasses}>Date:</span>
                  <span className={`ml-2 ${headingClasses} font-medium`}>
                    {new Date(departureDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className={textMutedClasses}>Time:</span>
                  <span className={`ml-2 ${headingClasses} font-medium`}>
                    {departureTime || '-'}
                  </span>
                </div>
              </>
            )}
            {rideType === 'PRIVATE' && (
              <div className="md:col-span-2">
                <span className={textMutedClasses}>Departure:</span>
                <span className={`ml-2 ${headingClasses} font-medium`}>
                  Immediate (current time)
                </span>
              </div>
            )}
          </div>
          
          {/* Fare Estimate Section */}
          {fareEstimate && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-sm ${textMutedClasses}`}>Estimated Distance:</span>
                  <span className={`ml-2 ${headingClasses} font-medium`}>
                    {fareEstimate.distanceKm} km
                  </span>
                  {durationEstimate && (
                    <span className={`ml-2 ${textMutedClasses}`}>
                      ({durationEstimate.displayText})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-sm ${textMutedClasses}`}>
                    {rideType === 'PRIVATE' ? 'Estimated Fare' : 'Per Seat'}
                  </div>
                  <div className={`text-2xl font-bold ${rideType === 'PRIVATE' ? 'text-purple-600 dark:text-purple-400' : 'text-primary-modernSg'}`}>
                    {rideType === 'PRIVATE' 
                      ? formatCurrency(fareEstimate.totalFare)
                      : formatCurrency(fareEstimate.pricePerSeat || 0)
                    }
                  </div>
                  {rideType === 'SHARED' && (
                    <div className={`text-xs ${textMutedClasses}`}>
                      Total: {formatCurrency(fareEstimate.totalFare)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
