'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Car, 
  FileText,
  Camera,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  MapPin,
  Globe
} from 'lucide-react';

interface DriverProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bio?: string;
  avatar?: string;
  coverPhotoUrl?: string;
  yearsExperience: number;
  languages?: Array<{
    code: string;
    name: string;
    proficiency: string;
  }>;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  vehicleColor?: string;
  passengerCapacity: number;
  luggageCapacity: number;
  licenseNumber: string;
  licenseExpiry: string;
  isVerified: boolean;
  verificationLevel: string;
  rating: number;
  completedTrips: number;
  availability: string;
  currentLocation?: string;
}

export default function DriverProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedProfile, setEditedProfile] = useState<Partial<DriverProfile>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) {
        router.push('/driver/login');
        return;
      }

      const driverData = JSON.parse(driverId);
      
      const response = await fetch('/api/drivers/profile', {
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setEditedProfile(result.data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Load profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) {
        router.push('/driver/login');
        return;
      }

      const driverData = JSON.parse(driverId);

      const response = await fetch('/api/drivers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify({
          bio: editedProfile.bio,
          yearsExperience: editedProfile.yearsExperience,
          languages: editedProfile.languages,
          vehicleColor: editedProfile.vehicleColor,
          luggageCapacity: editedProfile.luggageCapacity,
          currentLocation: editedProfile.currentLocation
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(prev => prev ? { ...prev, ...result.data } : null);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setIsEditing(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Driver Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and vehicle details</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          {profile.coverPhotoUrl && (
            <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile Header */}
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-16 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-4xl font-bold">
                    {profile.fullName[0].toUpperCase()}
                  </div>
                )}
              </div>
              {profile.isVerified && (
                <div className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-1">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="ml-6 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
              <p className="text-gray-600">{profile.vehicleMake} {profile.vehicleModel}</p>
              <div className="flex items-center mt-2 space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {profile.verificationLevel}
                </span>
                <span className="text-sm text-gray-600">
                  ⭐ {profile.rating.toFixed(1)} ({profile.completedTrips} trips)
                </span>
              </div>
            </div>
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:bg-gray-200 flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
                {(isEditing ? editedProfile.currentLocation : profile.currentLocation) && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.currentLocation || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, currentLocation: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Current location"
                      />
                    ) : (
                      <span>{profile.currentLocation}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Experience & Languages
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <span className="text-gray-600 mr-2">Experience:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedProfile.yearsExperience || 0}
                      onChange={(e) => setEditedProfile({ ...editedProfile, yearsExperience: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="50"
                    />
                  ) : (
                    <span className="font-medium">{profile.yearsExperience} years</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-600">Languages:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(profile.languages as any[] || []).map((lang: any, index: number) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {lang.name} ({lang.proficiency})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About Me</h3>
            {isEditing ? (
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Tell passengers about yourself, your driving style, and what makes you a great driver..."
                maxLength={500}
              />
            ) : (
              <p className="text-gray-700">
                {profile.bio || 'No bio added yet. Click "Edit Profile" to add one.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Car className="w-6 h-6 mr-2" />
          Vehicle Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make & Model</label>
            <p className="text-gray-900">{profile.vehicleMake} {profile.vehicleModel}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <p className="text-gray-900">{profile.vehicleYear}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <p className="text-gray-900">{profile.vehicleType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
            <p className="text-gray-900 font-mono">{profile.licensePlate}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.vehicleColor || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, vehicleColor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vehicle color"
              />
            ) : (
              <p className="text-gray-900">{profile.vehicleColor || 'Not specified'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <p className="text-gray-900">{profile.passengerCapacity} passengers</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Luggage Capacity</label>
            {isEditing ? (
              <input
                type="number"
                value={editedProfile.luggageCapacity || 0}
                onChange={(e) => setEditedProfile({ ...editedProfile, luggageCapacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="20"
              />
            ) : (
              <p className="text-gray-900">{profile.luggageCapacity} pieces</p>
            )}
          </div>
        </div>
      </div>

      {/* License & Documents */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          License & Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <p className="text-gray-900 font-mono">{profile.licenseNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
            <p className="text-gray-900">{new Date(profile.licenseExpiry).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To update your license or vehicle documents, please contact support or visit the Documents section.
          </p>
        </div>
      </div>
    </div>
  );
}
