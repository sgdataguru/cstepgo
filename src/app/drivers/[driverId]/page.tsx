import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  Calendar, 
  Users, 
  Briefcase, 
  CheckCircle, 
  Clock,
  MessageCircle,
  Shield,
  Award
} from 'lucide-react';

interface DriverProfilePageProps {
  params: {
    id: string;
  };
}

async function getDriverProfile(driverId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/drivers/${driverId}`, {
      cache: 'no-store', // Always fetch fresh data for profiles
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    return null;
  }
}

export async function generateMetadata({ params }: DriverProfilePageProps): Promise<Metadata> {
  const data = await getDriverProfile(params.id);
  
  if (!data?.driver) {
    return {
      title: 'Driver Not Found - StepperGO',
    };
  }

  const { driver } = data;
  
  return {
    title: `${driver.personalInfo.name} - Professional Driver | StepperGO`,
    description: driver.personalInfo.bio || `Book trips with ${driver.personalInfo.name}, a professional driver on StepperGO`,
  };
}

export default async function DriverProfilePage({ params }: DriverProfilePageProps) {
  const data = await getDriverProfile(params.id);

  if (!data?.driver) {
    notFound();
  }

  const { driver } = data;
  const primaryVehicle = driver.vehicles[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section - Matching Design Mockup */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar with Verification Badge */}
            <div className="relative flex-shrink-0">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src={driver.personalInfo.photoUrl || '/default-avatar.png'}
                  alt={driver.personalInfo.name}
                  fill
                  className="rounded-full object-cover"
                  priority
                />
                {/* Verification Badge - Green Checkmark */}
                {driver.verification.isVerified && (
                  <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 border-4 border-white dark:border-gray-800">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Driver Info */}
            <div className="flex-1">
              {/* Name and Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {driver.personalInfo.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                Professional driver
              </p>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {driver.rating.average.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  · {driver.rating.count} reviews
                </span>
              </div>

              {/* Availability Status */}
              <div className="mt-4 space-y-2">
                {driver.availability.currentLocation && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <MapPin className="w-4 h-4" />
                    <span>{driver.availability.currentLocation}</span>
                  </div>
                )}
                <div className="text-gray-600 dark:text-gray-400">
                  {driver.availability.status === 'AVAILABLE' ? 'Available today' : 'Busy'}
                </div>
              </div>

              {/* Vehicle Info - Compact */}
              {primaryVehicle && (
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{primaryVehicle.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{primaryVehicle.passengerCapacity} seats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Luggage: {primaryVehicle.luggageCapacity}</span>
                  </div>
                </div>
              )}

              {/* Languages */}
              {driver.professionalInfo.languages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {driver.professionalInfo.languages.map((lang: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                    >
                      {lang.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons - Matching Design */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`#reviews`}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-center transition-colors"
                >
                  View profile
                </Link>
                <Link
                  href={`/trips?driver=${params.id}`}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-center transition-colors"
                >
                  Book now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="md:col-span-1 space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {driver.stats.totalTrips}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completed Trips
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {driver.professionalInfo.yearsOfExperience}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Years Experience
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {driver.stats.onTimePercentage}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    On-Time Rate
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{driver.professionalInfo.responseTime}</span>
                </div>
              </div>
            </div>

            {/* Verification Badges */}
            {driver.verification.badges.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Verification
                </h2>
                <div className="space-y-3">
                  {driver.verification.badges.map((badge: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {badge.type.replace('_', ' ')}
                        </div>
                        {badge.verifiedDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Verified {new Date(badge.verifiedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* About Section */}
            {driver.personalInfo.bio && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  About
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {driver.personalInfo.bio}
                </p>
              </div>
            )}

            {/* Vehicle Information */}
            {primaryVehicle && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Vehicle
                </h2>
                <div className="space-y-3">
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Color:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{primaryVehicle.color}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{primaryVehicle.type}</span>
                    </div>
                  </div>
                  {/* Amenities */}
                  {primaryVehicle.amenities && primaryVehicle.amenities.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amenities
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {primaryVehicle.amenities.map((amenity: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div id="reviews" className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Reviews ({driver.rating.count})
                </h2>
              </div>

              {/* Rating Distribution */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {driver.rating.average.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(driver.rating.average)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Based on {driver.rating.count} reviews
                    </div>
                  </div>
                </div>

                {/* Rating Bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = driver.rating.distribution[rating] || 0;
                    const percentage = driver.rating.count > 0 ? (count / driver.rating.count) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                          {rating}★
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="space-y-4">
                {driver.recentReviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={review.reviewerPhotoUrl || '/default-avatar.png'}
                          alt={review.reviewerName}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {review.reviewerName}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">
                            {review.comment}
                          </p>
                        )}
                        {review.response && (
                          <div className="mt-3 ml-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                              Response from {driver.personalInfo.name}
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {review.response.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Reviews Link */}
              {driver.rating.count > 5 && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/drivers/${params.id}/reviews`}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    View all {driver.rating.count} reviews →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
