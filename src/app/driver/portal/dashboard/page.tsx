'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home,
  Car, 
  DollarSign, 
  Star, 
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  Users,
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DashboardData {
  driver: {
    id: string;
    fullName?: string;
    availability: string;
    vehicleType: string;
    vehicleMake: string;
    vehicleModel: string;
    licensePlate: string;
    rating: number;
    totalTrips: number;
  };
  activeTrip?: {
    trip: {
      id: string;
      title: string;
      departureTime: string;
      originName: string;
      destName: string;
      bookedSeats: number;
      totalSeats: number;
      estimatedEarnings: number;
    };
    passengers: Array<{
      id: string;
      seatsBooked: number;
      user: {
        name: string;
      };
    }>;
    paymentSummary?: {
      totalCashToCollect: number;
      cashCollectionBookings: number;
      prepaidBookings: number;
      currency: string;
    };
  };
  upcomingTrips: Array<any>;
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
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [availabilityChanging, setAvailabilityChanging] = useState(false);

  useEffect(() => {
    loadDashboard();
    // Refresh dashboard every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) {
        router.push('/driver/login');
        return;
      }

      const driverData = JSON.parse(driverId);
      
      const response = await fetch(`/api/drivers/dashboard`, {
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
      }
    } catch (err) {
      console.error('Load dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!dashboardData) return;

    try {
      setAvailabilityChanging(true);
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) return;

      const driverData = JSON.parse(driverId);
      const newStatus = dashboardData.driver.availability === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
      
      const response = await fetch('/api/drivers/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify({ availability: newStatus })
      });

      if (response.ok) {
        setDashboardData(prev => prev ? {
          ...prev,
          driver: { ...prev.driver, availability: newStatus },
          summary: { ...prev.summary, isOnline: newStatus === 'AVAILABLE' }
        } : null);
      }
    } catch (err) {
      console.error('Toggle availability error:', err);
    } finally {
      setAvailabilityChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load dashboard</p>
        </div>
      </div>
    );
  }

  const { driver, activeTrip, upcomingTrips, earnings, summary } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {driver.fullName || 'Driver'}!
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your account today</p>
      </div>

      {/* Availability Toggle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${summary.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                You are {summary.isOnline ? 'Online' : 'Offline'}
              </h3>
              <p className="text-sm text-gray-600">
                {summary.isOnline ? 'You can receive trip requests' : 'You will not receive trip requests'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={availabilityChanging}
            className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              summary.isOnline
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {availabilityChanging ? 'Updating...' : summary.isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today's Earnings</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">₸{earnings.today.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.completedTripsToday} trips completed</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">This Week</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">₸{earnings.thisWeek.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Weekly earnings</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Your Rating</span>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{driver.rating.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">{driver.totalTrips} total trips</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Upcoming Trips</span>
            <Calendar className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.upcomingTripsCount}</p>
          <p className="text-xs text-gray-500 mt-1">Scheduled trips</p>
        </div>
      </div>

      {/* Active Trip */}
      {activeTrip && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Car className="w-6 h-6 mr-2" />
              Active Trip
            </h2>
            <div className="flex items-center gap-2">
              {activeTrip.paymentSummary && activeTrip.paymentSummary.cashCollectionBookings > 0 && (
                <span className="px-3 py-1.5 bg-amber-500/90 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center gap-1.5">
                  💵 CASH
                </span>
              )}
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                In Progress
              </span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">{activeTrip.trip.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <div>
                  <p className="text-sm opacity-80">Route</p>
                  <p className="font-medium">{activeTrip.trip.originName} → {activeTrip.trip.destName}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <div>
                  <p className="text-sm opacity-80">Departure</p>
                  <p className="font-medium">{new Date(activeTrip.trip.departureTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <div>
                  <p className="text-sm opacity-80">Passengers</p>
                  <p className="font-medium">{activeTrip.trip.bookedSeats} / {activeTrip.trip.totalSeats} seats</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                <div>
                  <p className="text-sm opacity-80">Estimated Earnings</p>
                  <p className="font-medium">₸{activeTrip.trip.estimatedEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {/* Cash Collection Summary */}
            {activeTrip.paymentSummary && activeTrip.paymentSummary.cashCollectionBookings > 0 && (
              <div className="bg-amber-500/20 border-2 border-amber-300/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💵</span>
                    <div>
                      <p className="font-semibold text-lg">Cash to Collect</p>
                      <p className="text-sm opacity-90">Collect from passengers at trip end</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">₸{activeTrip.paymentSummary.totalCashToCollect.toLocaleString()}</p>
                    <p className="text-sm opacity-90">{activeTrip.paymentSummary.cashCollectionBookings} booking(s)</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => router.push(`/driver/trips/${activeTrip.trip.id}`)}
              className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              View Trip Details
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Trips */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-6 h-6 mr-2" />
          Upcoming Trips
        </h2>
        {upcomingTrips && upcomingTrips.length > 0 ? (
          <div className="space-y-4">
            {upcomingTrips.map((trip: any) => (
              <div key={trip.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{trip.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{trip.originName} → {trip.destName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{new Date(trip.departureTime).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">₸{trip.estimatedEarnings.toLocaleString()}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {trip.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No upcoming trips</p>
            <p>New trip requests will appear here</p>
          </div>
        )}
      </div>

      {/* Vehicle Info & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Your Vehicle
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Make & Model:</span>
              <span className="font-medium text-gray-900">{driver.vehicleMake} {driver.vehicleModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900">{driver.vehicleType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">License Plate:</span>
              <span className="font-medium text-gray-900 font-mono">{driver.licensePlate}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/driver/portal/profile')}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left font-medium"
            >
              → Edit Profile
            </button>
            <button
              onClick={() => router.push('/driver/portal/earnings')}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left font-medium"
            >
              → View Earnings
            </button>
            <button
              onClick={() => router.push('/driver/portal/help')}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left font-medium"
            >
              → Get Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
