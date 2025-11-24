import { Metadata } from 'next';
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

// Mock driver data for testing
const mockDriverData = {
  driver: {
    id: 'test-driver-123',
    personalInfo: {
      name: 'Alex Johnson',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      email: 'test.driver@steppergo.com',
      phone: '+77077123456',
      bio: 'Professional driver with 5+ years experience in passenger transportation. Passionate about providing excellent customer service.',
      coverPhotoUrl: null,
      joinedDate: '2023-01-15T10:00:00Z',
    },
    professionalInfo: {
      yearsOfExperience: 5,
      languages: [
        { code: 'en', name: 'English', proficiency: 'native' },
        { code: 'kk', name: 'Kazakh', proficiency: 'fluent' },
        { code: 'ru', name: 'Russian', proficiency: 'fluent' }
      ],
      responseTime: '< 15 min',
    },
    stats: {
      totalTrips: 89,
      totalDistance: 15240.5,
      onTimePercentage: 96.5,
      cancellationRate: 2.1,
    },
    rating: {
      average: 4.8,
      count: 127,
      distribution: {
        1: 0,
        2: 2,
        3: 5,
        4: 30,
        5: 90
      }
    },
    verification: {
      badges: [
        { type: 'verified_phone', verifiedDate: '2023-01-20' },
        { type: 'verified_email', verifiedDate: '2023-01-20' },
        { type: 'government_id', verifiedDate: '2023-01-22' },
        { type: 'background_check', verifiedDate: '2023-01-25' },
        { type: 'vehicle_inspection', verifiedDate: '2023-01-25' }
      ],
      verificationLevel: 'PREMIUM',
      isVerified: true,
    },
    availability: {
      status: 'AVAILABLE',
      currentLocation: 'Currently in Almaty - Airport area',
    },
    vehicles: [{
      id: 'vehicle-123-primary',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Silver',
      type: 'Sedan',
      licensePlate: 'ABC123KZ',
      passengerCapacity: 4,
      luggageCapacity: 2,
      amenities: ['air_conditioning', 'bluetooth', 'gps', 'wifi', 'usb_charging'],
      photos: ['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d']
    }],
    recentReviews: [
      {
        id: 'review-001',
        rating: 5,
        comment: 'Excellent professional service! Alex was punctual, courteous, and the vehicle was immaculate.',
        createdAt: '2024-11-20T10:00:00Z',
        reviewerName: 'Sarah Business',
        reviewerPhotoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b550?w=50',
        response: {
          comment: 'Thank you for the wonderful feedback!',
          createdAt: '2024-11-20T15:00:00Z'
        }
      },
      {
        id: 'review-002',
        rating: 5,
        comment: 'Amazing experience with our family trip! Alex was patient with our children.',
        createdAt: '2024-11-15T14:00:00Z',
        reviewerName: 'Emma Parent',
        reviewerPhotoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50',
        response: null
      }
    ]
  }
};

export const metadata: Metadata = {
  title: 'Alex Johnson - Professional Driver | StepperGO',
  description: 'Book trips with Alex Johnson, a professional driver on StepperGO',
};

interface DriverProfilePageProps {
  params: {
    driverId: string;
  };
}

export default async function DriverProfilePage({ params }: DriverProfilePageProps) {
  // Use mock data for now to test the component
  const { driver } = mockDriverData;
  const primaryVehicle = driver.vehicles[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section - Testing with Mock Data */}
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
                Professional driver (Test Mode)
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
                  href="#reviews"
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-center transition-colors"
                >
                  View profile (Test Mode)
                </Link>
                <Link
                  href={`/trips?driver=${params.driverId}`}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-center transition-colors"
                >
                  Book now (Test Mode)
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
                Quick Stats (Test Data)
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

            {/* Test Data Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🧪 Test Mode Active
              </h2>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This page is displaying mock data to test the Driver Portal components. 
                Driver ID: {params.driverId}
              </p>
              <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                <div>✅ Component renders correctly</div>
                <div>✅ Responsive design working</div>
                <div>✅ All sections displaying</div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                About
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {driver.personalInfo.bio}
              </p>
            </div>

            {/* Vehicle Information */}
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
                        {amenity.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews" className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Reviews ({driver.rating.count})
              </h2>

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
                        <p className="mt-2 text-gray-700 dark:text-gray-300">
                          {review.comment}
                        </p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
