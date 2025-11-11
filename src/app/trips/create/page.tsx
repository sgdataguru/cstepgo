'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FamousLocationAutocomplete from '@/components/FamousLocationAutocomplete';
import ItineraryBuilder from './components/ItineraryBuilder';
import AttractionSelector from './components/AttractionSelector';
import { Location, TripItinerary } from '@/types/trip-types';
import { VehicleType } from '@/lib/zones';

export default function CreateTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [totalSeats, setTotalSeats] = useState(4);
  const [basePrice, setBasePrice] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [tripType, setTripType] = useState<'PRIVATE' | 'SHARED'>('SHARED'); // NEW: Trip type selector
  const [showItineraryBuilder, setShowItineraryBuilder] = useState(false);
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [selectedAttractionIds, setSelectedAttractionIds] = useState<string[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAttractionsChange = useCallback((attractionIds: string[]) => {
    setSelectedAttractionIds(attractionIds);
  }, []);

  const handlePriceChange = useCallback((price: number) => {
    setCalculatedPrice(price);
    // Update base price if attractions are selected
    if (price > 0) {
      setBasePrice(Math.round(price).toString());
    }
  }, []);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!origin || !destination || !departureDate || !departureTime || !basePrice || !vehicleType) {
        setError('Please fill in all required fields');
        return;
      }

      // Calculate return date/time (default to same day + 12 hours)
      const returnDate = departureDate;
      const depTime = departureTime.split(':');
      const returnHour = (parseInt(depTime[0]) + 12) % 24;
      const returnTime = `${returnHour.toString().padStart(2, '0')}:${depTime[1]}`;

      // Generate title if not provided
      const title = `${origin.name} to ${destination.name}`;

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: `Comfortable ${tripType.toLowerCase()} ride from ${origin.name} to ${destination.name}`,
          origin,
          destination,
          departureDate,
          departureTime,
          returnDate,
          returnTime,
          totalSeats,
          basePrice: Number(basePrice),
          vehicleType,
          tripType, // NEW: Send trip type
          itinerary,
          selectedAttractions: selectedAttractionIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create trip');
      }

      // Success! Redirect to the new trip
      router.push(`/trips/${data.data.id}` as any);
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
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Create a New Trip
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Share your ride and split the costs
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= stepNum
                      ? 'bg-primary-modernSg text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`w-16 h-1 ${
                      step > stepNum ? 'bg-primary-modernSg' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Route</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Details</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Attractions</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Itinerary</span>
          </div>
        </div>

        {/* Form Card */}
        <div className={`mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 ${
          step === 3 ? 'max-w-7xl' : 'max-w-3xl'
        }`}>
          {/* Step 1: Route */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Where are you going?
              </h2>

              <div>
                <FamousLocationAutocomplete
                  value={origin}
                  onChange={setOrigin}
                  label="Starting Location"
                  placeholder="Where will you start?"
                  required
                />
              </div>

              <div>
                <FamousLocationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  label="Destination"
                  placeholder="Where are you headed?"
                  required
                />
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={handleNext}
                  disabled={!origin || !destination}
                  className="bg-primary-modernSg text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-modernSg/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Trip Details
              </h2>

              {/* NEW: Trip Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trip Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tripType"
                      value="SHARED"
                      checked={tripType === 'SHARED'}
                      onChange={(e) => setTripType('SHARED')}
                      className="w-4 h-4 accent-primary-modernSg cursor-pointer"
                    />
                    <span className="text-gray-900 dark:text-white">
                      Shared - Open to other travelers
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tripType"
                      value="PRIVATE"
                      checked={tripType === 'PRIVATE'}
                      onChange={(e) => setTripType('PRIVATE')}
                      className="w-4 h-4 accent-primary-modernSg cursor-pointer"
                    />
                    <span className="text-gray-900 dark:text-white">
                      Private - For specific passengers only
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Seats Available
                </label>
                <input
                  type="number"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(parseInt(e.target.value))}
                  min="1"
                  max="8"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Price per Seat (KZT)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
                  placeholder="e.g., 5000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-modernSg"
                  required
                >
                  <option value="">Select vehicle type</option>
                  <option value="sedan">Sedan</option>
                  <option value="van">Van</option>
                  <option value="minibus">Minibus</option>
                </select>
              </div>

              <div className="flex justify-between gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!departureDate || !departureTime || !basePrice || !vehicleType}
                  className="bg-primary-modernSg text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-modernSg/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Attractions */}
          {step === 3 && (
            <div className="space-y-6">
              <AttractionSelector
                vehicleType={(vehicleType as VehicleType) || VehicleType.SEDAN}
                passengers={totalSeats}
                onAttractionsChange={handleAttractionsChange}
                onPriceChange={handlePriceChange}
              />

              <div className="flex justify-between gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  className="bg-primary-modernSg text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-modernSg/90 transition-colors"
                >
                  {selectedAttractionIds.length > 0 ? 'Next →' : 'Skip →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Itinerary */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Build Your Itinerary (Optional)
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add stops, activities, or a detailed plan for your trip. This helps passengers know what to expect!
              </p>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {!showItineraryBuilder ? (
                <div className="text-center py-12">
                  <button
                    onClick={() => setShowItineraryBuilder(true)}
                    className="bg-primary-modernSg text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-modernSg/90 transition-colors"
                  >
                    Add Itinerary Details
                  </button>
                  <p className="text-sm text-gray-500 mt-4">or skip to create a simple trip</p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <ItineraryBuilder
                    startDate={departureDate ? new Date(departureDate) : new Date()}
                    endDate={departureDate ? new Date(departureDate) : new Date()}
                    onChange={(updatedItinerary) => {
                      setItinerary(updatedItinerary);
                    }}
                  />
                </div>
              )}

              <div className="flex justify-between gap-4 mt-8">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-primary-peranakan text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Trip'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trip Summary Preview */}
        {step > 1 && (
          <div className="max-w-3xl mx-auto mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Trip Summary</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
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
              {step > 1 && departureDate && (
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
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Seats:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {totalSeats}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Price:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {basePrice ? `${basePrice} KZT/seat` : '-'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
