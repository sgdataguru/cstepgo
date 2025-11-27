'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TripAcceptanceModal, useTripAcceptance, type TripOffer } from './TripAcceptanceModal';
import { 
  Bell, 
  Car, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Settings,
  UserCircle,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface DriverDashboardProps {
  driverId: string;
  driverName: string;
}

interface Trip {
  id: string;
  title: string;
  departureTime: string;
  returnTime?: string;
  originName: string;
  destName: string;
  totalSeats: number;
  bookedSeats?: number;
  basePrice: number;
  platformFee: number;
  status: string;
  estimatedEarnings?: number;
  actualEarnings?: number;
}

interface Passenger {
  id: string;
  seatsBooked: number;
  user: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
}

interface ActiveTripDetails {
  trip: {
    id: string;
    title: string;
    description: string;
    status: string;
    departureTime: string;
    returnTime: string;
    originName: string;
    originAddress: string;
    destName: string;
    destAddress: string;
    totalSeats: number;
    bookedSeats: number;
    estimatedEarnings: number;
    organizer: {
      id: string;
      name: string;
      phone: string;
      avatar?: string;
    };
    minutesUntilDeparture: number | null;
  };
  passengers: Passenger[];
}

interface Notification {
  id: string;
  type: 'system' | 'passenger' | 'ride_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface DashboardData {
  driver: {
    id: string;
    availability: string;
    vehicleType: string;
    vehicleMake: string;
    vehicleModel: string;
    licensePlate: string;
    rating: number;
    totalTrips: number;
  };
  activeTrip: ActiveTripDetails | null;
  upcomingTrips: Trip[];
  recentTrips: Trip[];
  earnings: {
    today: number;
    thisWeek: number;
    currency: string;
  };
  summary: {
    isOnline: boolean;
    hasActiveTrip: boolean;
    upcomingTripsCount: number;
    completedTripsToday: number;
    completedTripsThisWeek: number;
  };
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driverId,
  driverName
}) => {
  const router = useRouter();
  const {
    activeOffer,
    isModalOpen,
    isProcessing,
    checkActiveOffers,
    acceptTrip,
    declineTrip,
    handleTimeout
  } = useTripAcceptance();

  // Constants
  const PLATFORM_FEE_RATE = 0.15;
  const DRIVER_EARNINGS_RATE = 0.85;
  const REFRESH_INTERVAL_MS = 30000; // 30 seconds
  const POLL_INTERVAL_MS = 5000; // 5 seconds
  
  // Text constants
  const TEXT = {
    TODAY_EARNINGS: "Today's Earnings",
    NO_TRIPS: "We'll notify you when new trips become available",
    ALL_CAUGHT_UP: "You're all caught up!",
  };

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rides' | 'earnings' | 'notifications'>('overview');

  // Poll for active trip offers
  useEffect(() => {
    const pollInterval = setInterval(() => {
      checkActiveOffers(driverId);
    }, POLL_INTERVAL_MS);

    // Initial check
    checkActiveOffers(driverId);

    return () => clearInterval(pollInterval);
  }, [driverId, checkActiveOffers]);

  const loadNotifications = useCallback(() => {
    // Demo notifications for development
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'passenger',
        title: 'New Booking Request',
        message: 'John Doe has requested to book 2 seats for Almaty to Shymkent trip',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'ride_update',
        title: 'Trip Starting Soon',
        message: 'Your trip to Astana departs in 2 hours. Make sure you\'re ready!',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'system',
        title: 'Weekly Earnings Summary',
        message: 'You earned ₸45,000 this week. Great job!',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: true
      }
    ];
    setNotifications(demoNotifications);
  }, []);

  const loadDemoData = useCallback(() => {
    // Demo data for development when backend is not ready
    const demoData: DashboardData = {
      driver: {
        id: driverId,
        availability: 'AVAILABLE',
        vehicleType: 'Minibus',
        vehicleMake: 'Mercedes-Benz',
        vehicleModel: 'Sprinter',
        licensePlate: 'A123BC',
        rating: 4.8,
        totalTrips: 156
      },
      activeTrip: null,
      upcomingTrips: [
        {
          id: 'demo-1',
          title: 'Almaty to Shymkent',
          departureTime: new Date(Date.now() + 7200000).toISOString(),
          originName: 'Almaty',
          destName: 'Shymkent',
          totalSeats: 12,
          bookedSeats: 8,
          basePrice: 15000,
          platformFee: 2250,
          status: 'CONFIRMED',
          estimatedEarnings: 14663
        }
      ],
      recentTrips: [
        {
          id: 'demo-2',
          title: 'Astana to Karaganda',
          departureTime: new Date(Date.now() - 86400000).toISOString(),
          returnTime: new Date(Date.now() - 79200000).toISOString(),
          originName: 'Astana',
          destName: 'Karaganda',
          totalSeats: 12,
          basePrice: 12000,
          platformFee: 1800,
          status: 'COMPLETED',
          actualEarnings: 11730
        }
      ],
      earnings: {
        today: 11730,
        thisWeek: 45000,
        currency: 'KZT'
      },
      summary: {
        isOnline: true,
        hasActiveTrip: false,
        upcomingTripsCount: 1,
        completedTripsToday: 1,
        completedTripsThisWeek: 4
      }
    };
    setDashboardData(demoData);
    loadNotifications();
  }, [driverId, loadNotifications]);

  // Load comprehensive dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/drivers/dashboard`, {
          headers: {
            'x-driver-id': driverId
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setDashboardData(result.data);
            
            // Load demo notifications if none exist
            loadNotifications();
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Load demo data on error for development
        loadDemoData();
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // Refresh data periodically
    const refreshInterval = setInterval(loadDashboardData, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshInterval);
  }, [driverId, loadDemoData, loadNotifications]);

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatCurrency = (amount: number, currency: string = 'KZT') => {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // For KZT, use the ₸ symbol
    if (currency === 'KZT') {
      return `₸${amount.toLocaleString()}`;
    }
    
    return formatter.format(amount);
  };

  const getNextMonday = () => {
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {driverName}!
              </h1>
              <p className="text-gray-600">Ready to make your day productive?</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button 
                onClick={() => setActiveTab('notifications')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Bell className={`w-6 h-6 ${unreadNotifications > 0 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadNotifications}</span>
                  </div>
                )}
              </button>

              {/* Profile & Settings */}
              <button 
                onClick={() => router.push('/driver/profile')}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <UserCircle className="w-6 h-6 text-gray-500" />
              </button>

              <button 
                onClick={() => router.push('/driver/settings')}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Settings className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 border-t -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('rides')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'rides'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Rides
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'earnings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Earnings
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition relative ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption">Completed Today</p>
                    <p className="text-display-md font-bold text-gray-900">{dashboardData.summary.completedTripsToday}</p>
                  </div>
                  <Car className="w-8 h-8 text-info" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption">{TEXT.TODAY_EARNINGS}</p>
                    <p className="text-display-md font-bold text-success">{formatCurrency(dashboardData.earnings.today)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption">Upcoming Trips</p>
                    <p className="text-display-md font-bold text-warning">{dashboardData.summary.upcomingTripsCount}</p>
                  </div>
                  <Clock className="w-8 h-8 text-warning" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption">Your Rating</p>
                    <p className="text-display-md font-bold text-purple-600">{dashboardData.driver.rating}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Active Trip Alert */}
            {dashboardData.activeTrip && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mt-1"></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Active Trip in Progress</h3>
                    <p className="text-blue-800 mb-4">{dashboardData.activeTrip.trip.title}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600 font-medium">Passengers</p>
                        <p className="text-blue-900">{dashboardData.activeTrip.passengers.length} booked</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Departure</p>
                        <p className="text-blue-900">{formatDateTime(dashboardData.activeTrip.trip.departureTime)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Estimated Earnings</p>
                        <p className="text-blue-900">{formatCurrency(dashboardData.activeTrip.trip.estimatedEarnings)}</p>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    View Details
                  </button>
                </div>
              </div>
            )}

            {/* Trip Offers Status */}
            <div className="card">
              <div className="px-6 py-4 border-b -mx-6 -mt-6">
                <h2 className="text-heading-4 text-gray-900">Trip Offers</h2>
              </div>
              <div className="pt-6">
                {activeOffer ? (
                  <div className="card !bg-warning-light !border-warning p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-warning-dark">Active Trip Offer</p>
                        <p className="text-body-small text-warning-dark">
                          You have {activeOffer.timeRemainingSeconds} seconds to respond to a trip request
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-heading-4 mb-2">No active trip offers</p>
                    <p className="text-body-small">{TEXT.NO_TRIPS}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Trips Preview */}
            {dashboardData.upcomingTrips.length > 0 && (
              <div className="card">
                <div className="px-6 py-4 border-b -mx-6 -mt-6 flex justify-between items-center">
                  <h2 className="text-heading-4 text-gray-900">Upcoming Trips</h2>
                  <button 
                    onClick={() => setActiveTab('rides')}
                    className="text-primary hover:text-primary-dark text-body-small font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y">
                  {dashboardData.upcomingTrips.slice(0, 3).map((trip) => (
                    <div key={trip.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{trip.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDateTime(trip.departureTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {trip.originName} → {trip.destName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {trip.bookedSeats || 0}/{trip.totalSeats} seats
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(trip.estimatedEarnings || 0)}
                          </p>
                          <p className="text-xs text-gray-500">estimated</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rides Tab */}
        {activeTab === 'rides' && (
          <div className="space-y-6">
            {/* Upcoming Rides */}
            {dashboardData.upcomingTrips.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Rides</h2>
                </div>
                <div className="divide-y">
                  {dashboardData.upcomingTrips.map((trip) => (
                    <div key={trip.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              {trip.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <div>
                                <p className="font-medium">Departure</p>
                                <p>{formatDateTime(trip.departureTime)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <div>
                                <p className="font-medium">Route</p>
                                <p>{trip.originName} → {trip.destName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <div>
                                <p className="font-medium">Passengers</p>
                                <p>{trip.bookedSeats || 0}/{trip.totalSeats} seats booked</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <div>
                                <p className="font-medium">Estimated Earnings</p>
                                <p className="text-green-600 font-semibold">
                                  {formatCurrency(trip.estimatedEarnings || 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Rides */}
            {dashboardData.recentTrips.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Completed Rides</h2>
                </div>
                <div className="divide-y">
                  {dashboardData.recentTrips.map((trip) => (
                    <div key={trip.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <p className="font-medium">Date</p>
                              <p>{formatDateTime(trip.departureTime)}</p>
                            </div>
                            <div>
                              <p className="font-medium">Route</p>
                              <p>{trip.originName} → {trip.destName}</p>
                            </div>
                            <div>
                              <p className="font-medium">Earnings</p>
                              <p className="text-green-600 font-semibold">
                                {formatCurrency(trip.actualEarnings || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardData.upcomingTrips.length === 0 && dashboardData.recentTrips.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Rides Yet</h3>
                <p className="text-gray-600">Your trips will appear here once you accept bookings</p>
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">{TEXT.TODAY_EARNINGS}</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(dashboardData.earnings.today)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-green-700">
                  {dashboardData.summary.completedTripsToday} trips completed
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">This Week</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(dashboardData.earnings.thisWeek)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-blue-700">
                  {dashboardData.summary.completedTripsThisWeek} trips completed
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Total Trips</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {dashboardData.driver.totalTrips}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-purple-700">All time</p>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Earnings Breakdown</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-900">Gross Earnings (Week)</p>
                      <p className="text-sm text-gray-600">Total revenue from trips</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(Math.round(dashboardData.earnings.thisWeek / DRIVER_EARNINGS_RATE))}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-900">Platform Fee ({Math.round(PLATFORM_FEE_RATE * 100)}%)</p>
                      <p className="text-sm text-gray-600">StepperGO service fee</p>
                    </div>
                    <p className="text-lg font-semibold text-red-600">
                      -{formatCurrency(Math.round(dashboardData.earnings.thisWeek * PLATFORM_FEE_RATE / DRIVER_EARNINGS_RATE))}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-medium text-green-900">Net Earnings ({Math.round(DRIVER_EARNINGS_RATE * 100)}%)</p>
                      <p className="text-sm text-gray-600">Your take-home pay</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(dashboardData.earnings.thisWeek)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Payout Information</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    Earnings are automatically transferred to your registered bank account every Monday.
                  </p>
                  <p className="text-sm text-blue-800">
                    Next payout date: <span className="font-semibold">Monday, {getNextMonday().toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {unreadNotifications > 0 && (
                  <button 
                    onClick={markAllNotificationsAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 transition cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          notification.type === 'system' ? 'bg-gray-200' :
                          notification.type === 'passenger' ? 'bg-blue-200' :
                          'bg-green-200'
                        }`}>
                          {notification.type === 'system' && <Bell className="w-5 h-5 text-gray-700" />}
                          {notification.type === 'passenger' && <Users className="w-5 h-5 text-blue-700" />}
                          {notification.type === 'ride_update' && <Car className="w-5 h-5 text-green-700" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No Notifications</p>
                    <p>{TEXT.ALL_CAUGHT_UP}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
