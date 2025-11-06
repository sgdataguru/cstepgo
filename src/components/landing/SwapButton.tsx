'use client';

import { ArrowUpDown } from 'lucide-react';

interface SwapButtonProps {
  onClick: () => void;
}

export function SwapButton({ onClick }: SwapButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 
        w-10 h-10 rounded-full 
        bg-white border-2 border-gray-300 
        flex items-center justify-center 
        hover:bg-[#40E0D0] hover:border-[#40E0D0] hover:rotate-180 
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/50
        z-10
        shadow-md hover:shadow-lg
      "
      aria-label="Swap origin and destination cities"
    >
      <ArrowUpDown size={18} className="text-gray-600 hover:text-white transition-colors" />
    </button>
  );
}
