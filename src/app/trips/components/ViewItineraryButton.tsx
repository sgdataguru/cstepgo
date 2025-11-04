'use client';

import React from 'react';
import { FileText } from 'lucide-react';

interface ViewItineraryButtonProps {
  tripId: string;
  onClick?: () => void;
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ViewItineraryButton - Trigger button for opening trip itinerary modal
 */
export default function ViewItineraryButton({
  tripId,
  onClick,
  variant = 'solid',
  size = 'md',
  className = '',
}: ViewItineraryButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    outline: 'bg-white border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
    solid: 'bg-blue-500 text-white hover:bg-blue-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2
        font-semibold rounded-lg
        transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={`View itinerary for trip ${tripId}`}
    >
      <FileText className="w-5 h-5" />
      <span>View Itinerary</span>
    </button>
  );
}
