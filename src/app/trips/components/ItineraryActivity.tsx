'use client';

import React from 'react';
import { X, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Activity, ActivityType } from '@/types/trip-types';

export interface ItineraryActivityProps {
  activity: Activity;
  showDetails?: boolean;
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
  transport: <MapPin className="w-4 h-4" />,
  activity: <Clock className="w-4 h-4" />,
  meal: <Clock className="w-4 h-4" />,
  accommodation: <MapPin className="w-4 h-4" />,
  other: <Clock className="w-4 h-4" />,
};

const activityColors: Record<ActivityType, string> = {
  transport: 'bg-blue-100 text-blue-700 border-blue-200',
  activity: 'bg-green-100 text-green-700 border-green-200',
  meal: 'bg-amber-100 text-amber-700 border-amber-200',
  accommodation: 'bg-purple-100 text-purple-700 border-purple-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

/**
 * ItineraryActivity - Individual activity display in itinerary
 */
const ItineraryActivity: React.FC<ItineraryActivityProps> = ({
  activity,
  showDetails = true,
}) => {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Time Badge */}
      <div className="flex-shrink-0">
        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200">
          {activity.startTime}
        </div>
      </div>

      {/* Activity Content */}
      <div className="flex-1 space-y-2">
        {/* Activity Type Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${activityColors[activity.type]}`}
          >
            {activityIcons[activity.type]}
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">{activity.location.name}</p>
            {activity.location.address && (
              <p className="text-sm text-gray-500">{activity.location.address}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {showDetails && activity.description && (
          <p className="text-sm text-gray-700">{activity.description}</p>
        )}

        {/* Notes */}
        {showDetails && activity.notes && (
          <p className="text-xs text-gray-500 italic">{activity.notes}</p>
        )}
      </div>

      {/* Duration */}
      {activity.endTime && (
        <div className="flex-shrink-0 text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          {activity.endTime}
        </div>
      )}
    </div>
  );
};

ItineraryActivity.displayName = 'ItineraryActivity';

export default ItineraryActivity;
