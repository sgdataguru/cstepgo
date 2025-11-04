'use client';

import React from 'react';
import { Star, TrendingUp } from 'lucide-react';

interface TripBadgeProps {
  type: 'bestselling' | 'tour' | 'popular' | 'new';
  className?: string;
}

/**
 * TripBadge - Display badges on trip cards (Best Selling, Tour, etc.)
 */
export default function TripBadge({ type, className = '' }: TripBadgeProps) {
  const badges = {
    bestselling: {
      text: 'Best Selling',
      icon: <TrendingUp className="w-4 h-4" />,
      bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      textColor: 'text-white',
    },
    tour: {
      text: 'Tour',
      icon: null,
      bg: 'bg-gradient-to-r from-pink-500 to-rose-500',
      textColor: 'text-white',
    },
    popular: {
      text: 'Popular',
      icon: <Star className="w-4 h-4" />,
      bg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      textColor: 'text-white',
    },
    new: {
      text: 'New',
      icon: null,
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      textColor: 'text-white',
    },
  };

  const badge = badges[type];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        px-4 py-1.5
        rounded-lg
        font-semibold text-sm
        shadow-lg
        ${badge.bg}
        ${badge.textColor}
        ${className}
      `}
    >
      {badge.icon}
      <span>{badge.text}</span>
    </div>
  );
}
