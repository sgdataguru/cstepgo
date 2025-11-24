'use client';

import React, { useState } from 'react';
import { TripStatus } from '@prisma/client';
import { 
  Check, 
  Clock, 
  MapPin, 
  Navigation, 
  Users, 
  AlertCircle,
  Flag,
  XCircle
} from 'lucide-react';

export interface Trip {
  id: string;
  title: string;
  status: TripStatus;
  departureTime: string;
  originName: string;
  destName: string;
}

interface TripStatusUpdateCardProps {
  trip: Trip;
  driverId: string;
  onStatusUpdated?: (newStatus: TripStatus) => void;
}

const STATUS_CONFIG: Record<
  TripStatus,
  { 
    label: string; 
    icon: React.ReactNode; 
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  DRAFT: { 
    label: 'Draft', 
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  PUBLISHED: { 
    label: 'Published', 
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  OFFERED: { 
    label: 'Offered', 
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  FULL: { 
    label: 'Full', 
    icon: <Users className="w-4 h-4" />, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  IN_PROGRESS: { 
    label: 'In Progress', 
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  DEPARTED: { 
    label: 'Departed', 
    icon: <Navigation className="w-4 h-4" />, 
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200'
  },
  EN_ROUTE: { 
    label: 'En Route', 
    icon: <Navigation className="w-4 h-4" />, 
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  },
  DRIVER_ARRIVED: { 
    label: 'Driver Arrived', 
    icon: <MapPin className="w-4 h-4" />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  PASSENGERS_BOARDED: { 
    label: 'Passengers Boarded', 
    icon: <Users className="w-4 h-4" />, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  IN_TRANSIT: { 
    label: 'In Transit', 
    icon: <Navigation className="w-4 h-4" />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  DELAYED: { 
    label: 'Delayed', 
    icon: <AlertCircle className="w-4 h-4" />, 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  ARRIVED: { 
    label: 'Arrived', 
    icon: <Flag className="w-4 h-4" />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  COMPLETED: { 
    label: 'Completed', 
    icon: <Check className="w-4 h-4" />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    icon: <XCircle className="w-4 h-4" />, 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
};

const NEXT_STATUS_OPTIONS: Record<TripStatus, TripStatus[]> = {
  DRAFT: [],
  PUBLISHED: [],
  OFFERED: [],
  FULL: [],
  IN_PROGRESS: ['DEPARTED', 'EN_ROUTE', 'DRIVER_ARRIVED', 'DELAYED', 'CANCELLED'],
  DEPARTED: ['EN_ROUTE', 'DRIVER_ARRIVED', 'DELAYED', 'CANCELLED'],
  EN_ROUTE: ['DRIVER_ARRIVED', 'DELAYED', 'CANCELLED'],
  DRIVER_ARRIVED: ['PASSENGERS_BOARDED', 'DELAYED', 'CANCELLED'],
  PASSENGERS_BOARDED: ['IN_TRANSIT', 'DELAYED', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['DEPARTED', 'EN_ROUTE', 'DRIVER_ARRIVED', 'PASSENGERS_BOARDED', 'IN_TRANSIT', 'CANCELLED'],
  ARRIVED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const TripStatusUpdateCard: React.FC<TripStatusUpdateCardProps> = ({
  trip,
  driverId,
  onStatusUpdated
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentConfig = STATUS_CONFIG[trip.status];
  const availableActions = NEXT_STATUS_OPTIONS[trip.status] || [];

  const handleStatusUpdate = async (newStatus: TripStatus) => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60000
            });
          });
          
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
          };
        } catch (geoError) {
          console.warn('Could not get location:', geoError);
        }
      }

      const response = await fetch(`/api/drivers/trips/${trip.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverId,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
          location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update trip status');
      }

      setSuccess(data.message || 'Trip status updated successfully');
      setNotes('');
      setShowNotesInput(false);
      
      // Notify parent component
      if (onStatusUpdated) {
        onStatusUpdated(newStatus);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Current Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
          <p className="text-sm text-gray-600">
            {trip.originName} → {trip.destName}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentConfig.bgColor} ${currentConfig.borderColor} border`}
        >
          <span className={currentConfig.color}>{currentConfig.icon}</span>
          <span className={`text-sm font-medium ${currentConfig.color}`}>
            {currentConfig.label}
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      {availableActions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Update Status:</p>
          
          <div className="grid grid-cols-2 gap-2">
            {availableActions.map((status) => {
              const config = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={isUpdating}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${config.borderColor} ${config.bgColor} hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className={config.color}>{config.icon}</span>
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notes Input (Optional) */}
          {showNotesInput ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Add Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information for passengers..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <button
                onClick={() => setShowNotesInput(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Hide notes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNotesInput(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add notes for passengers
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">
            {trip.status === 'COMPLETED' 
              ? 'This trip is completed.' 
              : trip.status === 'CANCELLED'
              ? 'This trip is cancelled.'
              : 'No status updates available.'}
          </p>
        </div>
      )}

      {/* Loading Indicator */}
      {isUpdating && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Updating status...</span>
        </div>
      )}
    </div>
  );
};
