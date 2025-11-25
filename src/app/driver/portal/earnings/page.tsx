'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Users
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Trip {
  id: string;
  title: string;
  departureTime: string;
  returnTime: string;
  originName: string;
  destName: string;
  basePrice: number;
  platformFee: number;
  earnings: number;
  status: string;
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  tripsCount: number;
  bookingsCount?: number;
  payoutMethod?: string;
  processedAt?: string;
  createdAt: string;
}

export default function EarningsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [earningsSummary, setEarningsSummary] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    allTime: 0,
    pendingPayout: 0,
    currency: 'KZT'
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) {
        router.push('/driver/login');
        return;
      }

      const driverData = JSON.parse(driverId);
      
      // Load earnings data
      const earningsResponse = await fetch(`/api/drivers/${driverData.id}/earnings`, {
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      // Load payouts data
      const payoutsResponse = await fetch(`/api/drivers/payouts`, {
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      if (earningsResponse.ok) {
        const result = await earningsResponse.json();
        setTrips(result.data.trips || []);
        setChartData(result.data.chartData || []);
        
        // Update earnings summary with trip-based data
        setEarningsSummary(prev => ({
          ...prev,
          ...result.data.summary,
        }));
      }

      if (payoutsResponse.ok) {
        const payoutResult = await payoutsResponse.json();
        setPayouts(payoutResult.data.payouts || []);
        
        // Update earnings summary with payout data
        setEarningsSummary(prev => ({
          ...prev,
          pendingPayout: payoutResult.data.summary.pendingPayout || 0,
        }));
      }
    } catch (err) {
      console.error('Load earnings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Export earnings data as CSV
    const csvContent = [
      ['Date', 'Trip', 'Origin', 'Destination', 'Earnings'].join(','),
      ...trips.map(trip => [
        new Date(trip.departureTime).toLocaleDateString(),
        trip.title,
        trip.originName,
        trip.destName,
        trip.earnings.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings & Trip History</h1>
          <p className="text-gray-600 mt-1">Track your earnings and completed trips</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Data
        </button>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₸{earningsSummary.today.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Daily earnings</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">This Week</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₸{earningsSummary.thisWeek.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Weekly earnings</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">This Month</span>
            <Calendar className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₸{earningsSummary.thisMonth.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Monthly earnings</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Pending Payout</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            ₸{earningsSummary.pendingPayout.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Awaiting settlement</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">All Time</span>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₸{earningsSummary.allTime.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total earnings</p>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Earnings Overview</h2>
          <div className="flex space-x-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Payout History</h2>
          <div className="text-sm text-gray-600">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full mr-2">
              💳 Online-Paid = Auto Payout
            </span>
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
              💵 Cash = Direct Collection
            </span>
          </div>
        </div>
        {payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Period</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bookings</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Processed</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{payout.bookingsCount || payout.tripsCount}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      ₸{Number(payout.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {payout.payoutMethod || 'MOCK'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payout.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        payout.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No payment history yet</p>
            <p>Your payment history will appear here once payouts are processed</p>
            <p className="text-sm mt-2">Online-paid bookings are automatically included in weekly payouts</p>
          </div>
        )}
      </div>

      {/* Trip History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Trips</h2>
        {trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((trip) => (
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
                    <p className="text-2xl font-bold text-green-600">₸{trip.earnings.toLocaleString()}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                      trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
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
            <p className="text-lg font-medium mb-2">No trips yet</p>
            <p>Your completed trips will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
