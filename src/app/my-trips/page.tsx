'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Booking {
  id: string;
  tripId: string;
  status: string;
  seatsBooked: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  paymentMethodType: string;
  trip: {
    title: string;
    originName: string;
    destName: string;
    departureTime: string;
    status: string;
    driverId: string | null;
    tripType: string;
    pricePerSeat: number | null;
  };
  paymentStatus?: string;
}

interface BookingStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export default function MyTripsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (filter === 'upcoming') params.set('upcoming', 'true');
      if (filter === 'past') params.set('past', 'true');

      const response = await fetch(`/api/passengers/bookings?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/passengers/bookings?stats=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30';
      case 'PENDING':
        return 'bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30';
      case 'CANCELLED':
        return 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/30';
      case 'COMPLETED':
        return 'bg-[#0099ff]/20 text-[#0099ff] border border-[#0099ff]/30';
      default:
        return 'bg-[#666666]/20 text-[#808080] border border-[#666666]/30';
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const color = status === 'SUCCEEDED' 
      ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30'
      : status === 'PENDING'
      ? 'bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30'
      : 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/30';

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {status}
      </span>
    );
  };

  const getTripTypeBadge = (tripType: string) => {
    const isShared = tripType === 'SHARED';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isShared ? 'bg-[#cc00ff]/20 text-[#cc00ff] border border-[#cc00ff]/30' : 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30'
      }`}>
        {isShared ? '👥 Shared' : '🚗 Private'}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const isCash = method === 'CASH_TO_DRIVER';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isCash ? 'bg-[#ff9500]/20 text-[#ff9500] border border-[#ff9500]/30' : 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30'
      }`}>
        {isCash ? '💵 Cash' : '💳 Online'}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${Number(amount).toLocaleString()}`;
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] mx-auto"></div>
          <p className="mt-4 text-[#808080]">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#00f0ff]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">My <span className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Trips</span></h1>
          <p className="mt-2 text-[#b3b3b3]">View and manage your upcoming and past bookings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl p-6">
              <div className="text-[#808080] text-sm">Total Bookings</div>
              <div className="mt-2 text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl p-6">
              <div className="text-[#808080] text-sm">Upcoming</div>
              <div className="mt-2 text-3xl font-bold text-[#00f0ff]">{stats.upcoming}</div>
            </div>
            <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00ff88]/20 rounded-xl p-6">
              <div className="text-[#808080] text-sm">Completed</div>
              <div className="mt-2 text-3xl font-bold text-[#00ff88]">{stats.completed}</div>
            </div>
            <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ff0055]/20 rounded-xl p-6">
              <div className="text-[#808080] text-sm">Cancelled</div>
              <div className="mt-2 text-3xl font-bold text-[#ff0055]">{stats.cancelled}</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl mb-6">
          <div className="border-b border-[#252525]">
            <nav className="flex" aria-label="Tabs">
              <button
                onClick={() => setFilter('upcoming')}
                className={`${
                  filter === 'upcoming'
                    ? 'border-[#00f0ff] text-[#00f0ff]'
                    : 'border-transparent text-[#808080] hover:text-white hover:border-[#252525]'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`${
                  filter === 'past'
                    ? 'border-[#00f0ff] text-[#00f0ff]'
                    : 'border-transparent text-[#808080] hover:text-white hover:border-[#252525]'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all`}
              >
                Past
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`${
                  filter === 'all'
                    ? 'border-[#00f0ff] text-[#00f0ff]'
                    : 'border-transparent text-[#808080] hover:text-white hover:border-[#252525]'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all`}
              >
                All
              </button>
            </nav>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-[#ff0055]/10 border border-[#ff0055]/30 rounded-xl p-4 mb-6">
            <p className="text-[#ff0055]">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-[#666666]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-lg font-semibold text-white">No bookings found</h3>
            <p className="mt-1 text-sm text-[#808080]">
              {filter === 'upcoming'
                ? "You don't have any upcoming trips."
                : filter === 'past'
                ? "You don't have any past trips."
                : "You haven't made any bookings yet."}
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center bg-[#00f0ff] text-[#0a0a0a] px-6 py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all"
              >
                Browse Trips
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/my-trips/${booking.id}`}
                className="block bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 rounded-xl hover:border-[#00f0ff]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {booking.trip.title}
                      </h3>
                      <div className="mt-2 flex items-center text-sm text-[#b3b3b3]">
                        <svg
                          className="h-5 w-5 mr-2 text-[#00f0ff]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>
                          {booking.trip.originName} → {booking.trip.destName}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-[#b3b3b3]">
                        <svg
                          className="h-5 w-5 mr-2 text-[#cc00ff]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {format(new Date(booking.trip.departureTime), 'PPP p')}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                        {getTripTypeBadge(booking.trip.tripType)}
                        {getPaymentMethodBadge(booking.paymentMethodType)}
                        {getPaymentStatusBadge(booking.paymentStatus)}
                        {booking.trip.driverId && (
                          <span className="text-xs text-[#00ff88] flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Driver Assigned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(booking.totalAmount, booking.currency)}
                      </div>
                      <div className="text-sm text-[#808080]">
                        {booking.seatsBooked} {booking.seatsBooked === 1 ? 'seat' : 'seats'}
                      </div>
                      {booking.trip.tripType === 'SHARED' && booking.trip.pricePerSeat && (
                        <div className="text-xs text-[#666666] mt-1">
                          {formatCurrency(booking.trip.pricePerSeat, booking.currency)} per seat
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
