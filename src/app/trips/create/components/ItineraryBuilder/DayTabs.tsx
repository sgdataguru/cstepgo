'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import type { ItineraryDay } from '@/types/trip-types';

export interface DayTabsProps {
  days: ItineraryDay[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
}

/**
 * DayTabs - Navigation between days in itinerary builder
 */
const DayTabs: React.FC<DayTabsProps> = ({ days, selectedDay, onSelectDay }) => {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex overflow-x-auto scrollbar-hide">
        {days.map((day) => {
          const isSelected = day.dayNumber === selectedDay;
          const hasActivities = day.activities.length > 0;

          return (
            <button
              key={day.dayNumber}
              onClick={() => onSelectDay(day.dayNumber)}
              className={`
                flex-shrink-0 px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap
                ${
                  isSelected
                    ? 'border-primary-modernSg text-primary-modernSg bg-teal-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              aria-selected={isSelected}
              role="tab"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-semibold">
                    {day.title || `Day ${day.dayNumber}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(day.date), 'MMM d')}
                  </div>
                </div>
                {hasActivities && (
                  <span className="ml-2 bg-primary-modernSg text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {day.activities.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

DayTabs.displayName = 'DayTabs';

export default DayTabs;
