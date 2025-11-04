'use client';

import { useState } from 'react';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import type { Location } from '@/hooks/useGooglePlaces';

/**
 * Example usage of LocationAutocomplete component
 */
export default function LocationAutocompleteExample() {
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Start Location:', startLocation);
    console.log('End Location:', endLocation);
    // Handle form submission
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Trip Location Selection</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Start Location */}
        <LocationAutocomplete
          value={startLocation}
          onChange={setStartLocation}
          label="Starting Point"
          placeholder="Where are you starting from?"
          required
          countryRestrictions={['sg', 'my']}
        />

        {/* End Location */}
        <LocationAutocomplete
          value={endLocation}
          onChange={setEndLocation}
          label="Destination"
          placeholder="Where are you going?"
          required
          countryRestrictions={['sg', 'my']}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!startLocation || !endLocation}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Continue
        </button>
      </form>

      {/* Debug Info */}
      {(startLocation || endLocation) && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Selected Locations:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ startLocation, endLocation }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
