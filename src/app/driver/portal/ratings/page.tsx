'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MessageSquare, ThumbsUp, TrendingUp, User, Calendar, Send } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  tripId: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
}

interface RatingStats {
  overall: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recentTrend: 'up' | 'down' | 'stable';
}

export default function RatingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats>({
    overall: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recentTrend: 'stable'
  });
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setIsLoading(true);
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) {
        router.push('/driver/login');
        return;
      }

      const driverData = JSON.parse(driverId);
      
      const response = await fetch(`/api/drivers/${driverData.id}/reviews`, {
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setReviews(result.data.reviews || []);
        setStats(result.data.stats || stats);
      }
    } catch (err) {
      console.error('Load ratings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;

    try {
      setIsSending(true);
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) {
        router.push('/driver/login');
        return;
      }

      const driverData = JSON.parse(driverId);
      
      const response = await fetch(`/api/drivers/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify({ response: responseText })
      });

      if (response.ok) {
        // Update local state
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, response: responseText, respondedAt: new Date().toISOString() }
            : review
        ));
        setResponseText('');
        setRespondingTo(null);
      }
    } catch (err) {
      console.error('Respond to review error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ratings & Feedback</h1>
        <p className="text-gray-600 mt-1">See what passengers are saying about your service</p>
      </div>

      {/* Rating Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900 mb-2">{stats.overall.toFixed(1)}</div>
            <div className="flex justify-center mb-2">{renderStars(Math.round(stats.overall))}</div>
            <p className="text-gray-600">{stats.totalReviews} total reviews</p>
            <div className="flex items-center justify-center mt-3">
              {stats.recentTrend === 'up' && (
                <span className="flex items-center text-green-600 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Trending up
                </span>
              )}
              {stats.recentTrend === 'down' && (
                <span className="flex items-center text-red-600 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                  Trending down
                </span>
              )}
              {stats.recentTrend === 'stable' && (
                <span className="text-gray-600 text-sm">Stable rating</span>
              )}
            </div>
          </div>

          {/* Rating Breakdown */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.breakdown[rating as keyof typeof stats.breakdown];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center">
                    <span className="text-sm text-gray-700 w-8">{rating}★</span>
                    <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Reviews</h2>
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-3">
                      {review.reviewerPhotoUrl ? (
                        <img src={review.reviewerPhotoUrl} alt={review.reviewerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-semibold">
                          {review.reviewerName[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.reviewerName}</h4>
                      <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex">{renderStars(review.rating)}</div>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-gray-700 mb-3 ml-16">{review.comment}</p>
                )}

                {/* Driver Response */}
                {review.response ? (
                  <div className="ml-16 bg-blue-50 rounded-lg p-4 mt-3">
                    <div className="flex items-start">
                      <MessageSquare className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">Your Response</p>
                        <p className="text-sm text-gray-700">{review.response}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Responded on {new Date(review.respondedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ml-16 mt-3">
                    {respondingTo === review.id ? (
                      <div>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Write a professional response to this review..."
                          maxLength={500}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRespond(review.id)}
                            disabled={isSending || !responseText.trim()}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isSending ? 'Sending...' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(review.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Respond to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No reviews yet</p>
            <p>Reviews from passengers will appear here after completing trips</p>
          </div>
        )}
      </div>
    </div>
  );
}
