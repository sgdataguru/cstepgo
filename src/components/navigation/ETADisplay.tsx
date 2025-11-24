'use client';

import React from 'react';
import { Clock, Navigation, TrendingUp } from 'lucide-react';
import { formatDistance, formatDuration, formatETA } from '@/lib/navigation/utils';
import type { ETAInfo } from '@/lib/navigation/types';

interface ETADisplayProps {
  eta: ETAInfo;
  className?: string;
}

export function ETADisplay({ eta, className = '' }: ETADisplayProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Arrival Time</p>
            <p className="text-lg font-semibold">{formatETA(eta.estimatedArrival)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Distance</p>
            <p className="text-lg font-semibold">{formatDistance(eta.remainingDistance)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-lg font-semibold">{formatDuration(eta.remainingDuration)}</p>
          </div>
        </div>
      </div>
      
      {eta.trafficCondition && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Traffic: <span className={`font-medium ${
              eta.trafficCondition === 'light' ? 'text-green-600' :
              eta.trafficCondition === 'moderate' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {eta.trafficCondition.charAt(0).toUpperCase() + eta.trafficCondition.slice(1)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
