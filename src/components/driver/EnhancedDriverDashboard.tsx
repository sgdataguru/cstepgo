/**
 * Enhanced Driver Dashboard with Real-Time WebSocket Integration
 * Displays live trip offers, active trips, and earnings
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverWebSocket } from '@/hooks/useDriverWebSocket';
import { TripOffersList } from './TripOffersList';
import {
  TripStatusUpdateEvent,
  NotificationEvent,
} from '@/types/realtime-events';
import {
  Bell,
  Car,
  TrendingUp,
  Activity,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface EnhancedDriverDashboardProps {
  driverId: string;
  driverName: string;
  token: string; // Session token for WebSocket authentication
}

interface DashboardStats {
  todayEarnings: number;
  weekEarnings: number;
  completedTripsToday: number;
  rating: number;
  totalTrips: number;
}

export function EnhancedDriverDashboard({
  driverId,
  driverName,
  token,
}: EnhancedDriverDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 0,
    weekEarnings: 0,
    completedTripsToday: 0,
    rating: 0,
    totalTrips: 0,
  });
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'offers' | 'active' | 'history'>('offers');
  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);

  // Initialize WebSocket connection with filters
  const {
    isConnected,
    isSubscribed,
    tripOffers,
    acceptOffer,
    declineOffer,
    updateLocation,
    clearOffer,
    error,
  } = useDriverWebSocket({
    token,
    enabled: true,
    filters: {
      maxDistance: 50, // 50 km radius
      minEarnings: 5000, // Minimum ₸5000
    },
    onTripOffer: (offer) => {
      console.log('New trip offer received:', offer.tripId);
      // Could show a toast notification here
    },
    onTripStatusUpdate: (update: TripStatusUpdateEvent) => {
      console.log('Trip status updated:', update.tripId, update.newStatus);
      // Refresh stats when trip completes
      if (update.newStatus === 'COMPLETED') {
        fetchStats();
      }
    },
    onNotification: (notification: NotificationEvent) => {
      console.log('Notification received:', notification.title);
      setNotifications((prev) => [notification, ...prev].slice(0, 10)); // Keep last 10
    },
  });

  // Fetch driver stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/drivers/dashboard', {
        headers: {
          'x-driver-id': driverId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          todayEarnings: data.earnings?.today || 0,
          weekEarnings: data.earnings?.thisWeek || 0,
          completedTripsToday: data.summary?.completedTripsToday || 0,
          rating: data.driver?.rating || 0,
          totalTrips: data.driver?.totalTrips || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  // Handle accepting a trip offer
  const handleAcceptOffer = async (tripId: string) => {
    setIsAcceptingOffer(true);
    
    try {
      // Call the API to accept the trip
      const response = await fetch(`/api/drivers/trips/accept/${tripId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Trip accepted:', data);
        
        // Emit WebSocket acceptance event
        acceptOffer(tripId);
        
        // Navigate to active trip page
        router.push(`/driver/trips/${tripId}`);
      } else {
        const error = await response.json();
        alert(`Failed to accept trip: ${error.error || 'Unknown error'}`);
        clearOffer(tripId);
      }
    } catch (error) {
      console.error('Error accepting trip:', error);
      alert('Failed to accept trip. Please try again.');
      clearOffer(tripId);
    } finally {
      setIsAcceptingOffer(false);
    }
  };

  // Handle declining a trip offer
  const handleDeclineOffer = (tripId: string, reason?: string) => {
    declineOffer(tripId, reason);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {driverName}!</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      {isSubscribed ? 'Live' : 'Connected'}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">Offline</span>
                  </>
                )}
              </div>

              {/* Notifications Badge */}
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs 
                                 font-bold rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₸{stats.todayEarnings.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Week Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₸{stats.weekEarnings.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trips Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.completedTripsToday}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.rating.toFixed(1)} ⭐
                </p>
                <p className="text-xs text-gray-500">{stats.totalTrips} trips</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('offers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'offers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Available Offers
              {tripOffers.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                  {tripOffers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Active Trips
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'offers' && (
          <TripOffersList
            offers={tripOffers}
            onAccept={handleAcceptOffer}
            onDecline={handleDeclineOffer}
            isLoading={isAcceptingOffer}
          />
        )}

        {activeTab === 'active' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No active trips</p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Trip history coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
