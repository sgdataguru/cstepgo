'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface BookingDetails {
  id: string;
  tripId: string;
  status: string;
  seatsBooked: number;
  totalAmount: number;
  currency: string;
  passengers: any;
  notes: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  paymentMethodType: string;
  trip: {
    id: string;
    title: string;
    description: string;
    originName: string;
    originAddress: string;
    destName: string;
    destAddress: string;
    departureTime: string;
    returnTime: string;
    status: string;
    basePrice: number;
    currency: string;
    totalSeats: number;
    availableSeats: number;
    organizerId: string;
    driverId: string | null;
    tripType: string;
    pricePerSeat: number | null;
    driver?: {
      id: string;
      vehicleType: string;
      vehicleModel: string;
      vehicleMake: string;
      vehicleColor: string | null;
      licensePlate: string;
      rating: number;
      reviewCount: number;
      user: {
        id: string;
        name: string;
        phone: string | null;
        avatar: string | null;
      };
    } | null;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string | null;
    createdAt: string;
    succeededAt: string | null;
  } | null;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/passengers/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const data = await response.json();
      setBooking(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId) return;

    try {
      setCancelling(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/passengers/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      // Refresh booking details
      await fetchBookingDetails();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const canCancelBooking = (booking: BookingDetails): boolean => {
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return false;
    }

    const now = new Date();
    const departureTime = new Date(booking.trip.departureTime);
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return departureTime > now && hoursUntilDeparture >= 2;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error || 'Booking not found'}</p>
          <Link
            href="/my-trips"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/my-trips" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to My Trips
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Trip Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{booking.trip.title}</h3>
                  <p className="mt-1 text-gray-600">{booking.trip.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">From</label>
                    <p className="mt-1 text-gray-900">{booking.trip.originName}</p>
                    <p className="text-sm text-gray-500">{booking.trip.originAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">To</label>
                    <p className="mt-1 text-gray-900">{booking.trip.destName}</p>
                    <p className="text-sm text-gray-500">{booking.trip.destAddress}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Departure</label>
                    <p className="mt-1 text-gray-900">
                      {format(new Date(booking.trip.departureTime), 'PPP')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(booking.trip.departureTime), 'p')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Return</label>
                    <p className="mt-1 text-gray-900">
                      {format(new Date(booking.trip.returnTime), 'PPP')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(booking.trip.returnTime), 'p')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Seats Booked</label>
                    <p className="mt-1 text-gray-900">{booking.seatsBooked}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Trip Type</label>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      booking.trip.tripType === 'SHARED' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.trip.tripType === 'SHARED' ? '👥 Shared Ride' : '🚗 Private Cab'}
                    </span>
                  </div>
                </div>

                {booking.trip.tripType === 'SHARED' && booking.trip.pricePerSeat && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Price Per Seat</label>
                      <p className="mt-1 text-gray-900">
                        {booking.currency} {Number(booking.trip.pricePerSeat).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Available Seats</label>
                      <p className="mt-1 text-gray-900">
                        {booking.trip.availableSeats} of {booking.trip.totalSeats}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      booking.paymentMethodType === 'CASH_TO_DRIVER' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {booking.paymentMethodType === 'CASH_TO_DRIVER' ? '💵 Cash to Driver' : '💳 Online Payment'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Trip Status</label>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(booking.trip.status)}`}>
                      {booking.trip.status}
                    </span>
                  </div>
                </div>

                {booking.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Driver Information */}
            {booking.trip.driver && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Driver Information</h2>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {booking.trip.driver.user.avatar ? (
                      <img
                        src={booking.trip.driver.user.avatar}
                        alt={booking.trip.driver.user.name}
                        className="h-16 w-16 rounded-full"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-500">
                          {booking.trip.driver.user.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.trip.driver.user.name}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <svg className="h-5 w-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-gray-700">
                        {booking.trip.driver.rating.toFixed(1)} ({booking.trip.driver.reviewCount} reviews)
                      </span>
                    </div>
                    {booking.trip.driver.user.phone && (
                      <p className="mt-1 text-sm text-gray-600">
                        Phone: {booking.trip.driver.user.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Vehicle Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 text-gray-900">{booking.trip.driver.vehicleType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Make:</span>
                      <span className="ml-2 text-gray-900">{booking.trip.driver.vehicleMake}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Model:</span>
                      <span className="ml-2 text-gray-900">{booking.trip.driver.vehicleModel}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Color:</span>
                      <span className="ml-2 text-gray-900">{booking.trip.driver.vehicleColor || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">License:</span>
                      <span className="ml-2 text-gray-900">{booking.trip.driver.licensePlate}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!booking.trip.driver && booking.status !== 'CANCELLED' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Driver Not Yet Assigned</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      A driver will be assigned to your trip soon. You'll receive a notification when confirmed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Booking ID</label>
                  <p className="mt-1 text-gray-900 font-mono text-sm">{booking.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Booked On</label>
                  <p className="mt-1 text-gray-900">{format(new Date(booking.createdAt), 'PPP')}</p>
                </div>

                {booking.confirmedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Confirmed On</label>
                    <p className="mt-1 text-gray-900">{format(new Date(booking.confirmedAt), 'PPP')}</p>
                  </div>
                )}

                {booking.cancelledAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cancelled On</label>
                    <p className="mt-1 text-gray-900">{format(new Date(booking.cancelledAt), 'PPP')}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {booking.currency} {Number(booking.totalAmount).toLocaleString()}
                  </p>
                  {booking.trip.tripType === 'SHARED' && booking.trip.pricePerSeat && (
                    <p className="mt-1 text-sm text-gray-500">
                      {booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''} × {booking.currency} {Number(booking.trip.pricePerSeat).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                  <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    booking.paymentMethodType === 'CASH_TO_DRIVER' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {booking.paymentMethodType === 'CASH_TO_DRIVER' ? '💵 Cash at Trip End' : '💳 Online Payment'}
                  </span>
                  {booking.paymentMethodType === 'CASH_TO_DRIVER' && (
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      You will pay {booking.currency} {Number(booking.totalAmount).toLocaleString()} to the driver at the end of your trip.
                    </p>
                  )}
                </div>

                {booking.payment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Status</label>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      booking.payment.status === 'SUCCEEDED'
                        ? 'bg-green-100 text-green-800'
                        : booking.payment.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.payment.status}
                    </span>
                    {booking.payment.paymentMethod && (
                      <p className="mt-1 text-sm text-gray-600">
                        Method: {booking.payment.paymentMethod}
                      </p>
                    )}
                  </div>
                )}

                {/* Prominent Cash Payment Notice for Sidebar */}
                {booking.paymentMethodType === 'CASH_TO_DRIVER' && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                  <div className="col-span-2 pt-2">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">💵</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                            Cash Payment Required
                          </h4>
                          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                            You will pay <strong className="text-base">{booking.currency} {Number(booking.totalAmount).toLocaleString()}</strong> to the driver in cash at the end of your trip.
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            💡 Please have the exact amount ready for a smooth experience.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Receipt Button - Show for completed/confirmed bookings with successful payment */}
                {((booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') && 
                  booking.payment?.status === 'SUCCEEDED') && (
                  <Link
                    href={`/my-trips/${booking.id}/receipt`}
                    className="w-full block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-center font-medium"
                  >
                    📄 View Receipt
                  </Link>
                )}

                {/* Track Driver Button */}
                {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                  <Link
                    href={`/my-trips/${booking.id}/track`}
                    className="w-full block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center font-medium"
                  >
                    🚗 Track Driver Live
                  </Link>
                )}

                {canCancelBooking(booking) && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full mt-4 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Let us know why you're cancelling..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
