'use client';

import React from 'react';
import { ArrowRight, ArrowLeft, ArrowUp, MapPin } from 'lucide-react';
import { formatDistance } from '@/lib/navigation/utils';
import type { RouteStep } from '@/lib/navigation/types';

interface TurnByTurnDirectionsProps {
  steps: RouteStep[];
  currentStepIndex?: number;
  className?: string;
}

function getManeuverIcon(maneuver?: string) {
  if (!maneuver) return <ArrowUp className="w-5 h-5" />;
  
  if (maneuver.includes('left')) return <ArrowLeft className="w-5 h-5" />;
  if (maneuver.includes('right')) return <ArrowRight className="w-5 h-5" />;
  return <ArrowUp className="w-5 h-5" />;
}

export function TurnByTurnDirections({
  steps,
  currentStepIndex = 0,
  className = '',
}: TurnByTurnDirectionsProps) {
  const upcomingSteps = steps.slice(currentStepIndex, currentStepIndex + 3);
  
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Turn-by-Turn Directions
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {upcomingSteps.map((step, index) => (
          <div
            key={index}
            className={`p-4 flex items-start space-x-3 ${
              index === 0 ? 'bg-blue-50' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {getManeuverIcon(step.maneuver)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                index === 0 ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {step.instruction}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistance(step.distance)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {steps.length > upcomingSteps.length && (
        <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
          {steps.length - upcomingSteps.length} more steps
        </div>
      )}
    </div>
  );
}
