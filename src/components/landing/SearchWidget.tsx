'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { LocationInput } from './LocationInput';
import { SwapButton } from './SwapButton';
import { DatePicker } from './DatePicker';
import { PassengerSelector } from './PassengerSelector';

interface LocationData {
  name: string;
  latitude?: number;
  longitude?: number;
}

interface SearchFormData {
  bookingType: 'Private' | 'Share';
  origin: LocationData;
  destination: LocationData;
  departureDate: Date;
  passengers: number;
}

interface FormErrors {
  origin?: string;
  destination?: string;
  passengers?: string;
}

export function SearchWidget() {
  const router = useRouter();
  const [formData, setFormData] = useState<SearchFormData>({
    bookingType: 'Private',
    origin: { name: '' },
    destination: { name: '' },
    departureDate: new Date(),
    passengers: 1
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Update max passengers when booking type changes
  const maxPassengers = formData.bookingType === 'Private' ? 13 : 4;

  // Adjust passengers if it exceeds new max
  const handleBookingTypeChange = (type: 'Private' | 'Share') => {
    setFormData(prev => ({
      ...prev,
      bookingType: type,
      passengers: type === 'Share' && prev.passengers > 4 ? 4 : prev.passengers
    }));
  };

  const handleSwapLocations = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.origin.name || formData.origin.name.length < 2) {
      newErrors.origin = 'Please select a departure city';
    }

    if (!formData.destination.name || formData.destination.name.length < 2) {
      newErrors.destination = 'Please select a destination city';
    }

    if (formData.origin.name && formData.destination.name && 
        formData.origin.name === formData.destination.name) {
      newErrors.destination = 'Destination must be different from origin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTrip = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreatingTrip(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        origin_city: formData.origin.name,
        destination_city: formData.destination.name,
        departure_date: formData.departureDate.toISOString().split('T')[0],
        is_private: (formData.bookingType === 'Private').toString(),
        passengers: formData.passengers.toString()
      });

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('trip_creation_started', {
          bookingType: formData.bookingType,
          origin: formData.origin.name,
          destination: formData.destination.name,
          passengers: formData.passengers
        });
      }

      if (formData.bookingType === 'Private') {
        // For Private: redirect to trip creation page with pre-filled data
        router.push(`/trips/create?${params.toString()}`);
      } else {
        // For Share: save trip intent and show success message
        
        // TODO: Save trip intent to database
        // await fetch('/api/trips/intent', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     origin: formData.origin,
        //     destination: formData.destination,
        //     departureDate: formData.departureDate,
        //     passengers: formData.passengers
        //   })
        // });

        // Show success message
        setShowSuccessMessage(true);

        // Track shared trip creation
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('shared_trip_created', {
            origin: formData.origin.name,
            destination: formData.destination.name,
            passengers: formData.passengers
          });
        }

        // After 3 seconds, redirect to browse shared trips
        setTimeout(() => {
          router.push(`/trips?${params.toString()}&show_all=true`);
        }, 3000);
      }
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleBrowseAllTrips = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('browse_all_trips_clicked');
    }

    // Navigate to all shared trips
    router.push('/trips?show_all=true');
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[600px] lg:w-[700px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8">
      {/* Tag Line */}
      <h2 className="text-xl md:text-2xl font-display font-semibold mb-6 text-gray-900">
        Low cost travel across Central Asia
      </h2>

      {/* Private/Share Toggle */}
      <div className="flex gap-6 mb-6">
        <label className="flex items-center gap-2 cursor-pointer group min-h-[44px] py-2">
          <input
            type="radio"
            name="bookingType"
            value="Private"
            checked={formData.bookingType === 'Private'}
            onChange={(e) => handleBookingTypeChange('Private')}
            className="w-6 h-6 min-w-[24px] min-h-[24px] accent-[#40E0D0] cursor-pointer"
          />
          <span className="font-medium text-gray-900 group-hover:text-[#40E0D0] transition-colors">
            Private
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group min-h-[44px] py-2">
          <input
            type="radio"
            name="bookingType"
            value="Share"
            checked={formData.bookingType === 'Share'}
            onChange={(e) => handleBookingTypeChange('Share')}
            className="w-6 h-6 min-w-[24px] min-h-[24px] accent-[#40E0D0] cursor-pointer"
          />
          <span className="font-medium text-gray-900 group-hover:text-[#40E0D0] transition-colors">
            Share
          </span>
        </label>
      </div>

      {/* Location Inputs */}
      <div className="relative mb-6">
        {/* From Input */}
        <div className="mb-4">
          <LocationInput
            label="From"
            placeholder="Almaty Airport"
            value={formData.origin.name}
            onChange={(value, location) => {
              setFormData(prev => ({
                ...prev,
                origin: location || { name: value }
              }));
              setErrors(prev => ({ ...prev, origin: undefined }));
            }}
            error={errors.origin}
          />
        </div>

        {/* Swap Button */}
        <SwapButton onClick={handleSwapLocations} />

        {/* To Input */}
        <div>
          <LocationInput
            label="To"
            placeholder="Charyn Canyon"
            value={formData.destination.name}
            onChange={(value, location) => {
              setFormData(prev => ({
                ...prev,
                destination: location || { name: value }
              }));
              setErrors(prev => ({ ...prev, destination: undefined }));
            }}
            error={errors.destination}
          />
        </div>
      </div>

      {/* Departure Date */}
      <div className="mb-4">
        <DatePicker
          value={formData.departureDate}
          onChange={(date) => setFormData(prev => ({ ...prev, departureDate: date }))}
        />
      </div>

      {/* Passengers */}
      <div className="mb-6">
        <PassengerSelector
          value={formData.passengers}
          onChange={(count) => setFormData(prev => ({ ...prev, passengers: count }))}
          maxPassengers={maxPassengers}
        />
      </div>

      {/* Success Message for Shared Trip */}
      {showSuccessMessage && formData.bookingType === 'Share' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-[#40E0D0]/10 to-[#FFD700]/10 border border-[#40E0D0]/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Your shared trip request is live!
              </h3>
              <p className="text-sm text-gray-600">
                Other travelers can now find and join your trip. You'll be redirected to browse all shared trips...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Create Trip - Context-aware primary action */}
        <button
          onClick={handleCreateTrip}
          disabled={isCreatingTrip}
          className="
            flex-1 h-[56px] min-h-[48px] text-lg font-semibold 
            bg-[#FFD700] text-gray-900 rounded-xl 
            hover:bg-[#FFD700]/90 hover:shadow-lg hover:-translate-y-0.5 
            active:translate-y-0 
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50
            flex items-center justify-center
          "
        >
          {isCreatingTrip ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </span>
          ) : (
            `Create Trip ${formData.bookingType === 'Private' ? '(Search Private)' : '(Request Share)'}`
          )}
        </button>

        {/* Browse All Shared Trips - Always visible */}
        <button
          onClick={handleBrowseAllTrips}
          disabled={isCreatingTrip}
          className="
            flex-1 h-[56px] min-h-[48px] text-lg font-semibold 
            flex items-center justify-center gap-2
            bg-white border-2 border-[#40E0D0] text-[#40E0D0]
            rounded-xl 
            hover:bg-[#40E0D0] hover:text-white hover:shadow-lg hover:-translate-y-0.5 
            active:translate-y-0 
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/50
          "
        >
          <Search className="w-5 h-5" />
          Browse All Shared Trips
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {formData.bookingType === 'Private' ? (
          <p>
            🚗 <span className="font-medium">Private:</span> Find available transport options instantly
          </p>
        ) : (
          <p>
            👥 <span className="font-medium">Share:</span> Post your trip and connect with other travelers
          </p>
        )}
      </div>
    </div>
  );
}
