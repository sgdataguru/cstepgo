'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { ItineraryDay } from '@/types/trip-types';
import ItineraryActivity from './ItineraryActivity';

interface ItineraryDaySectionProps {
  day: ItineraryDay;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * ItineraryDaySection - Groups and displays activities for a single day
 */
export default function ItineraryDaySection({
  day,
  isExpanded: controlledExpanded,
  onToggle,
}: ItineraryDaySectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const dayDate = typeof day.date === 'string' ? new Date(day.date) : day.date;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      {/* Day Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Day {day.dayNumber}: {day.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(dayDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Activities List */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
          {day.activities.map((activity) => (
            <ItineraryActivity
              key={activity.id}
              activity={activity}
              showDetails={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
