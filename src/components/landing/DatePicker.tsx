'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isToday, isTomorrow } from 'date-fns';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplayDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, 'd MMM')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'd MMM')}`;
    }
    return format(date, 'EEE, d MMM');
  };

  const handlePrevDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = subDays(value, 1);
    // Don't allow past dates
    if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
      onChange(newDate);
    }
  };

  const handleNextDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = addDays(value, 1);
    // Don't allow more than 6 months in future
    const sixMonthsFromNow = addDays(new Date(), 180);
    if (newDate <= sixMonthsFromNow) {
      onChange(newDate);
    }
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Departure
      </label>
      
      <div className="relative">
        <Calendar 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" 
          size={20} 
        />
        
        <input
          type="text"
          value={formatDisplayDate(value)}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-full h-14 pl-12 pr-20 text-base 
            border-2 border-gray-300 rounded-xl bg-gray-50 
            cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/10 focus:border-[#40E0D0]
          "
        />
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Next day"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Simple date selector - can be expanded with a full calendar later */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-2">
              Use arrow buttons to change date
            </p>
            <p className="text-xs text-gray-500">
              Full calendar coming soon
            </p>
          </div>
        </>
      )}
    </div>
  );
}
