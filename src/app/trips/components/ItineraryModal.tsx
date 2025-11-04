'use client';

import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import ItineraryActivity from './ItineraryActivity';
import type { Trip } from '@/types/trip-types';

export interface ItineraryModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onBook?: () => void;
}

/**
 * ItineraryModal - Full-screen modal displaying trip itinerary
 */
const ItineraryModal: React.FC<ItineraryModalProps> = ({
  trip,
  isOpen,
  onClose,
  onBook,
}) => {
  if (!isOpen) return null;

  // Parse itinerary if it's a string
  let itinerary = trip.itinerary;
  if (typeof trip.itinerary === 'string') {
    try {
      itinerary = JSON.parse(trip.itinerary);
    } catch (error) {
      console.error('Failed to parse itinerary:', error);
      itinerary = { version: '1.0', days: [] };
    }
  }

  const handleBookClick = () => {
    if (onBook) {
      onBook();
    } else {
      // Default behavior if no callback provided
      alert('Booking feature coming in Gate 2! This will integrate with authentication and Stripe payments.');
    }
  };

  const availableSeats = trip.capacity.available;
  const isFullyBooked = availableSeats === 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itinerary-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2
                id="itinerary-title"
                className="text-2xl font-display font-bold text-gray-900"
              >
                {trip.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {format(trip.departureTime, 'PPP')} - {format(trip.returnTime, 'PPP')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close itinerary"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {!itinerary.days || itinerary.days.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No itinerary available for this trip.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {itinerary.days.map((day) => (
                  <div key={day.dayNumber} className="space-y-4">
                    {/* Day Header */}
                    <div className="sticky top-0 bg-white py-2 z-10">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-modernSg text-white text-sm font-bold">
                          {day.dayNumber}
                        </span>
                        <span>{day.title || `Day ${day.dayNumber}`}</span>
                        <span className="text-sm font-normal text-gray-500">
                          {format(new Date(day.date), 'EEE, MMM d')}
                        </span>
                      </h3>
                    </div>

                    {/* Activities */}
                    <div className="space-y-3 pl-11">
                      {day.activities.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">
                          No activities planned for this day
                        </p>
                      ) : (
                        day.activities.map((activity) => (
                          <ItineraryActivity
                            key={activity.id}
                            activity={activity}
                            showDetails={true}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            {/* Price & Availability Info */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">Price per person</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trip.pricing.currency} {trip.pricing.pricePerPerson.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-px bg-gray-300" />
              <div>
                <p className="text-sm text-gray-500">Available seats</p>
                <p className="text-lg font-semibold text-gray-900">
                  {availableSeats} / {trip.capacity.total}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {isFullyBooked ? (
                <button
                  disabled
                  className="px-8 py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                >
                  Fully Booked
                </button>
              ) : (
                <button
                  onClick={handleBookClick}
                  className="px-8 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg"
                >
                  Book This Trip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ItineraryModal.displayName = 'ItineraryModal';

export default ItineraryModal;
