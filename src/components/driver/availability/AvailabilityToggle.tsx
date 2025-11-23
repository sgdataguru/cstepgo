'use client';

import React, { useState, useEffect } from 'react';
import { Power, MapPin, Settings, Clock } from 'lucide-react';

interface AvailabilityStatus {
  availability: string;
  currentLocation: string | null;
  lastActivityAt: string | null;
}

interface AvailabilityPreferences {
  serviceRadiusKm: number;
  acceptsPrivateTrips: boolean;
  acceptsSharedTrips: boolean;
  acceptsLongDistance: boolean;
  autoOfflineMinutes: number;
}

interface AvailabilityToggleProps {
  driverId: string;
  onStatusChange?: (status: string) => void;
}

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  driverId,
  onStatusChange
}) => {
  const [status, setStatus] = useState<AvailabilityStatus>({
    availability: 'OFFLINE',
    currentLocation: null,
    lastActivityAt: null
  });
  
  const [preferences, setPreferences] = useState<AvailabilityPreferences>({
    serviceRadiusKm: 50,
    acceptsPrivateTrips: true,
    acceptsSharedTrips: true,
    acceptsLongDistance: true,
    autoOfflineMinutes: 30
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current availability status
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const response = await fetch('/api/drivers/availability', {
          headers: {
            'x-driver-id': driverId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus(data.data.currentStatus);
          setPreferences(data.data.preferences);
        }
      } catch (err) {
        console.error('Error loading availability:', err);
      }
    };

    loadAvailability();
  }, [driverId]);

  const updateAvailability = async (newStatus: string) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/drivers/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverId
        },
        body: JSON.stringify({
          availability: newStatus,
          ...preferences
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus({
          availability: data.data.availability,
          currentLocation: data.data.currentLocation,
          lastActivityAt: data.data.lastActivityAt
        });
        onStatusChange?.(data.data.availability);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update availability');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error updating availability:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<AvailabilityPreferences>) => {
    setIsUpdating(true);
    setError(null);
    
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    try {
      const response = await fetch('/api/drivers/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverId
        },
        body: JSON.stringify({
          availability: status.availability,
          ...updatedPreferences
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          serviceRadiusKm: data.data.serviceRadiusKm,
          acceptsPrivateTrips: data.data.acceptsPrivateTrips,
          acceptsSharedTrips: data.data.acceptsSharedTrips,
          acceptsLongDistance: data.data.acceptsLongDistance,
          autoOfflineMinutes: preferences.autoOfflineMinutes
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error updating preferences:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (availability: string) => {
    switch (availability) {
      case 'AVAILABLE':
        return 'bg-green-500';
      case 'BUSY':
        return 'bg-yellow-500';
      case 'OFFLINE':
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (availability: string) => {
    switch (availability) {
      case 'AVAILABLE':
        return 'Online';
      case 'BUSY':
        return 'Busy';
      case 'OFFLINE':
      default:
        return 'Offline';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Main Status Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full ${getStatusColor(status.availability)} flex items-center justify-center`}>
            <Power className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Status: {getStatusLabel(status.availability)}
            </h3>
            {status.lastActivityAt && (
              <p className="text-sm text-gray-500">
                Last updated: {new Date(status.lastActivityAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isUpdating}
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Status Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => updateAvailability('AVAILABLE')}
          disabled={isUpdating || status.availability === 'AVAILABLE'}
          className={`py-3 px-4 rounded-lg font-medium transition-all ${
            status.availability === 'AVAILABLE'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-green-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Go Online
        </button>
        
        <button
          onClick={() => updateAvailability('BUSY')}
          disabled={isUpdating || status.availability === 'BUSY'}
          className={`py-3 px-4 rounded-lg font-medium transition-all ${
            status.availability === 'BUSY'
              ? 'bg-yellow-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-yellow-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Busy
        </button>
        
        <button
          onClick={() => updateAvailability('OFFLINE')}
          disabled={isUpdating || status.availability === 'OFFLINE'}
          className={`py-3 px-4 rounded-lg font-medium transition-all ${
            status.availability === 'OFFLINE'
              ? 'bg-gray-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Go Offline
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t pt-6 space-y-6">
          <h4 className="font-semibold text-gray-900 mb-4">Availability Preferences</h4>
          
          {/* Service Radius */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-2" />
              Service Radius: {preferences.serviceRadiusKm} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={preferences.serviceRadiusKm}
              onChange={(e) => updatePreferences({ serviceRadiusKm: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isUpdating}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Trip Type Preferences */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Accept Trip Types:
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm text-gray-700">Private Trips</span>
              <input
                type="checkbox"
                checked={preferences.acceptsPrivateTrips}
                onChange={(e) => updatePreferences({ acceptsPrivateTrips: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                disabled={isUpdating}
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm text-gray-700">Shared Trips</span>
              <input
                type="checkbox"
                checked={preferences.acceptsSharedTrips}
                onChange={(e) => updatePreferences({ acceptsSharedTrips: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                disabled={isUpdating}
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm text-gray-700">Long Distance Trips</span>
              <input
                type="checkbox"
                checked={preferences.acceptsLongDistance}
                onChange={(e) => updatePreferences({ acceptsLongDistance: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                disabled={isUpdating}
              />
            </label>
          </div>

          {/* Auto Offline Setting */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Auto Offline</p>
                <p className="text-xs text-blue-700 mt-1">
                  You&apos;ll be automatically set to offline after {preferences.autoOfflineMinutes} minutes of inactivity
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
