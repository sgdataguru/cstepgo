'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FamousLocationAutocomplete from '@/components/FamousLocationAutocomplete';
import { Location } from '@/types/trip-types';

export default function CreateTripPage() {
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

  // Initialize current date/time for private rides
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setDepartureDate(dateStr);
    
    // Set current time (rounded to next 5 minutes)
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    now.setMinutes(roundedMinutes);
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

      // Validate required fields
      if (!origin || !destination) {
        setError('Please select both origin and destination');
        return;
      }

      if (!vehicleType) {
        setError('Please select a vehicle type');
        return;
      }

      // Validate departure time
      if (!validateDepartureTime()) {
        return;
      }

      // For private rides, use current server time
      let finalDepartureDate = departureDate;
      let finalDepartureTime = departureTime;
      
      if (rideType === 'PRIVATE') {
        const now = new Date();
        finalDepartureDate = now.toISOString().split('T')[0];
        const minutes = now.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 5) * 5;
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        finalDepartureTime = now.toTimeString().slice(0, 5);
      }

      // Generate title
      const title = `${origin.name} to ${destination.name}`;

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: `${rideType === 'PRIVATE' ? 'Private cab' : 'Shared ride'} from ${origin.name} to ${destination.name}`,
          origin,
          destination,
          departureDate: finalDepartureDate,
          departureTime: finalDepartureTime,
          tripType: rideType,
          vehicleType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create trip');
      }

      // Success! Redirect to the trip details page for fare calculation and confirmation
      router.push(`/trips/${data.data.id}`);
    } catch (err) {
      console.error('Error creating trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Single-Page Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          Private Cab
                          {rideType === 'PRIVATE' && <span className="text-purple-500">✓</span>}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          Shared Ride
                          {rideType === 'SHARED' && <span className="text-primary-modernSg">✓</span>}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    When do you want to depart?
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Shared rides must be scheduled at least 1 hour in advance
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Choose your preferred vehicle type
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !origin || !destination}
                  className="w-full bg-primary-peranakan text-white px-8 py-4 rounded-lg font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Pricing
                      <span className="text-xl">→</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
                  Next step: View pricing and confirm your booking
                </p>
              </div>
            </div>
          </div>

          {/* Trip Summary Preview */}
          {(origin || destination) && (
            <div className="max-w-3xl mx-auto mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Trip Summary</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {rideType === 'PRIVATE' ? '👑 Private Cab' : '👥 Shared Ride'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">From:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {origin?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">To:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {destination?.name || '-'}
                  </span>
                </div>
                {rideType === 'SHARED' && departureDate && (
                  <>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {new Date(departureDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {departureTime || '-'}
                      </span>
                    </div>
                  </>
                )}
                {rideType === 'PRIVATE' && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Departure:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      Immediate (current time)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
