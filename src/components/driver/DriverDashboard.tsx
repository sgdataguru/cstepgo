'use client';

import React, { useEffect, useState } from 'react';
import { TripAcceptanceModal, useTripAcceptance, type TripOffer } from './TripAcceptanceModal';
import { Bell, Car, Clock, MapPin, TrendingUp, Users } from 'lucide-react';

interface DriverDashboardProps {
  driverId: string;
  driverName: string;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driverId,
  driverName
}) => {
  const {
    activeOffer,
    isModalOpen,
    isProcessing,
    checkActiveOffers,
    acceptTrip,
    declineTrip,
    handleTimeout
  } = useTripAcceptance();

  const [dashboardStats, setDashboardStats] = useState({
    todayTrips: 0,
    todayEarnings: 0,
    activeTrips: 0,
    rating: 4.8
  });

  // Poll for active trip offers
  useEffect(() => {
    const pollInterval = setInterval(() => {
      checkActiveOffers(driverId);
    }, 5000); // Check every 5 seconds

    // Initial check
    checkActiveOffers(driverId);

    return () => clearInterval(pollInterval);
  }, [driverId, checkActiveOffers]);

  // Load dashboard stats
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const response = await fetch(`/api/drivers/${driverId}/dashboard`, {
          headers: {
            'x-driver-id': driverId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data.data);
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    };

    loadDashboardStats();
  }, [driverId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {driverName}!
              </h1>
              <p className="text-gray-600">Ready to make your day productive?</p>
            </div>
            
            {/* Notification Bell with Active Offer Indicator */}
            <div className="relative">
              <Bell className={`w-6 h-6 ${activeOffer ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
              {activeOffer && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Trips</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardStats.todayTrips}</p>
              </div>
              <Car className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-3xl font-bold text-green-600">₸{dashboardStats.todayEarnings.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trips</p>
                <p className="text-3xl font-bold text-orange-600">{dashboardStats.activeTrips}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Rating</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardStats.rating}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Trip Offers Status */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Trip Offers</h2>
          </div>
          <div className="p-6">
            {activeOffer ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-yellow-800">Active Trip Offer</p>
                    <p className="text-sm text-yellow-700">
                      You have {activeOffer.timeRemainingSeconds} seconds to respond to a trip request
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No active trip offers</p>
                <p>We'll notify you when new trips become available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Trips */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Trips</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No recent trips</p>
              <p>Your completed trips will appear here</p>
            </div>
          </div>
        </div>
      </main>

      {/* Trip Acceptance Modal */}
      <TripAcceptanceModal
        isOpen={isModalOpen}
        tripOffer={activeOffer?.trip || null}
        timeRemainingSeconds={activeOffer?.timeRemainingSeconds || 0}
        urgency={activeOffer?.urgency || 'normal'}
        onAccept={acceptTrip}
        onDecline={declineTrip}
        onTimeout={handleTimeout}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default DriverDashboard;
