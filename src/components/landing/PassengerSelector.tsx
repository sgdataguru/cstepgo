'use client';

import { ChevronDown } from 'lucide-react';

interface PassengerSelectorProps {
  value: number;
  onChange: (count: number) => void;
  maxPassengers: number; // 13 for private, 4 for shared
}

export function PassengerSelector({ value, onChange, maxPassengers }: PassengerSelectorProps) {
  const options = Array.from({ length: maxPassengers }, (_, i) => i + 1);

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Passengers
      </label>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="
            w-full h-14 px-4 pr-12 text-base 
            border-2 border-gray-300 rounded-xl bg-gray-50 
            appearance-none cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/10 focus:border-[#40E0D0]
          "
        >
          {options.map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'Adult' : 'Adults'}
            </option>
          ))}
        </select>
        
        <ChevronDown 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" 
          size={20} 
        />
      </div>
    </div>
  );
}
