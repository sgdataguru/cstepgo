'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface LocationSuggestion {
  id: string;
  name: string;
  type: 'CITY' | 'LANDMARK';
  country: string;
  latitude: number;
  longitude: number;
  isFamous: boolean;
}

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string, location?: LocationSuggestion) => void;
  error?: string;
}

export function LocationInput({ 
  label, 
  placeholder, 
  value, 
  onChange,
  error 
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Debounced autocomplete search
    if (value.length >= 2) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/locations/autocomplete?q=${encodeURIComponent(value)}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    onChange(suggestion.name, suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        {label}
      </label>
      
      <div className="relative">
        <MapPin 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" 
          size={20} 
        />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full h-14 pl-12 pr-4 text-base 
            border-2 rounded-xl bg-gray-50
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/10
            ${error ? 'border-red-500' : 'border-gray-300 focus:border-[#40E0D0]'}
          `}
          autoComplete="off"
        />

        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-[#40E0D0] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-b-0"
            >
              <MapPin size={18} className="text-[#40E0D0] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {suggestion.name}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>{suggestion.type}</span>
                  <span>•</span>
                  <span>{suggestion.country}</span>
                  {suggestion.isFamous && (
                    <>
                      <span>•</span>
                      <span className="text-[#FFD700]">★ Popular</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
