'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSearch = () => {
    if (!validateForm()) {
      return;
    }

    setIsSearching(true);

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
      (window as any).posthog.capture('landing_search_started', {
        bookingType: formData.bookingType,
        origin: formData.origin.name,
        destination: formData.destination.name,
        passengers: formData.passengers
      });
    }

    // Redirect to trips listing page
    router.push(`/trips?${params.toString()}`);
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[600px] lg:w-[700px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8">
      {/* Tag Line */}
      <h2 className="text-xl md:text-2xl font-display font-semibold mb-6 text-gray-900">
        Low cost travel across Central Asia
      </h2>

      {/* Private/Share Toggle */}
      <div className="flex gap-6 mb-6">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="bookingType"
            value="Private"
            checked={formData.bookingType === 'Private'}
            onChange={(e) => handleBookingTypeChange('Private')}
            className="w-6 h-6 accent-[#40E0D0] cursor-pointer"
          />
          <span className="font-medium text-gray-900 group-hover:text-[#40E0D0] transition-colors">
            Private
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="bookingType"
            value="Share"
            checked={formData.bookingType === 'Share'}
            onChange={(e) => handleBookingTypeChange('Share')}
            className="w-6 h-6 accent-[#40E0D0] cursor-pointer"
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

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="
          w-full h-[60px] text-lg font-semibold 
          bg-[#FFD700] text-gray-900 rounded-xl 
          hover:bg-[#FFD700]/90 hover:shadow-lg hover:-translate-y-0.5 
          active:translate-y-0 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50
        "
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
}
