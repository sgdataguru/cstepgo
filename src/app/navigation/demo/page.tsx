'use client';

import React, { useState } from 'react';
import { NavigationMap } from '@/components/navigation/NavigationMap';
import { ETADisplay } from '@/components/navigation/ETADisplay';
import { TurnByTurnDirections } from '@/components/navigation/TurnByTurnDirections';
import { Play, Square, RefreshCw } from 'lucide-react';
import type { Coordinates, NavigationRoute, RouteStep } from '@/lib/navigation/types';

// Demo coordinates (Almaty, Kazakhstan)
const demoOrigin: Coordinates = { lat: 43.2381, lng: 76.9451 };
const demoDestination: Coordinates = { lat: 43.2567, lng: 76.9286 };

export default function NavigationDemoPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | undefined>(demoOrigin);
  const [route, setRoute] = useState<NavigationRoute | undefined>();
  const [showTraffic, setShowTraffic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartNavigation = async () => {
    setError(null);
    try {
      const response = await fetch('/api/navigation/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: demoOrigin,
          destination: demoDestination,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      setRoute(data.route);
      setIsNavigating(true);
      setCurrentLocation(demoOrigin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start navigation');
      console.error('Navigation error:', err);
    }
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setRoute(undefined);
    setCurrentLocation(demoOrigin);
  };

  const handleRefresh = () => {
    handleStartNavigation();
  };

  // Mock ETA data
  const mockETA = {
    estimatedArrival: new Date(Date.now() + 15 * 60 * 1000),
    remainingDistance: 5200,
    remainingDuration: 900,
    currentSpeed: 45,
    trafficCondition: 'moderate' as const,
  };

  // Mock steps
  const mockSteps: RouteStep[] = route ? route.steps.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GPS Navigation Demo
          </h1>
          <p className="text-gray-600">
            Test the GPS navigation integration for StepperGO trips
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <NavigationMap
                origin={demoOrigin}
                destination={demoDestination}
                currentLocation={currentLocation}
                route={route}
                showTraffic={showTraffic}
                className="w-full h-96 lg:h-[600px]"
              />
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div className="space-x-2">
                  {!isNavigating ? (
                    <button
                      onClick={handleStartNavigation}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Navigation
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleStopNavigation}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </button>
                      <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Route
                      </button>
                    </>
                  )}
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTraffic}
                    onChange={(e) => setShowTraffic(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Traffic</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Info */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-3">Trip Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Origin:</span>
                  <p className="font-medium">Republic Square, Almaty</p>
                </div>
                <div>
                  <span className="text-gray-500">Destination:</span>
                  <p className="font-medium">Kok Tobe, Almaty</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="font-medium">{isNavigating ? 'In Progress' : 'Not Started'}</p>
                </div>
              </div>
            </div>

            {/* ETA */}
            {isNavigating && route && (
              <ETADisplay eta={mockETA} />
            )}

            {/* Turn-by-Turn */}
            {isNavigating && mockSteps.length > 0 && (
              <TurnByTurnDirections steps={mockSteps} currentStepIndex={0} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
