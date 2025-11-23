'use client';

import { useState } from 'react';
import { DriverRegistrationData, DriverRegistrationResponse } from '@/types/driver';
import { DocumentUploader } from './DocumentUploader';

interface DriverRegistrationFormProps {
  onSuccess: (response: DriverRegistrationResponse) => void;
  onError: (error: string) => void;
}

export function DriverRegistrationForm({ onSuccess, onError }: DriverRegistrationFormProps) {
  const [formData, setFormData] = useState<DriverRegistrationData>({
    // Personal Information
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    
    // Vehicle Information
    vehicleType: 'SEDAN',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    licensePlate: '',
    vehicleColor: 'White',
    seatCapacity: 4,
    
    // Service Area
    homeCity: 'Almaty',
    serviceRadiusKm: 50,
    willingToTravel: [],
    
    // Documents
    documents: {},
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const vehicleTypes = [
    { value: 'SEDAN', label: 'Sedan' },
    { value: 'SUV', label: 'SUV' },
    { value: 'MINIBUS', label: 'Minibus' },
    { value: 'VAN', label: 'Van' },
    { value: 'BUS', label: 'Bus' },
  ];
  
  const travelOptions = [
    { value: 'domestic', label: 'Domestic Travel (Within Kazakhstan)' },
    { value: 'cross_border_kz', label: 'Cross-Border (To Kyrgyzstan)' },
  ];
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Personal Information
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.nationalId.trim()) newErrors.nationalId = 'National ID is required';
    
    // Vehicle Information
    if (!formData.vehicleMake.trim()) newErrors.vehicleMake = 'Vehicle make is required';
    if (!formData.vehicleModel.trim()) newErrors.vehicleModel = 'Vehicle model is required';
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'License plate is required';
    if (formData.seatCapacity < 1 || formData.seatCapacity > 60) {
      newErrors.seatCapacity = 'Seat capacity must be between 1 and 60';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onError('Please fix the form errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register driver');
      }
      
      onSuccess(data);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof DriverRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const handleTravelToggle = (value: string) => {
    const current = formData.willingToTravel || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    handleInputChange('willingToTravel', newValue);
  };
  
  const handleDocumentUpload = (documentType: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: url,
      },
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600 text-sm font-bold mr-3">
            1
          </span>
          Personal Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Damir Amangeldy"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+7 701 234 5678"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="driver@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Optional - for credential delivery</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              National ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nationalId}
              onChange={(e) => handleInputChange('nationalId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                errors.nationalId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123456789012"
            />
            {errors.nationalId && (
              <p className="mt-1 text-sm text-red-500">{errors.nationalId}</p>
            )}
          </div>
        </div>
      </section>
      
      {/* Vehicle Information */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600 text-sm font-bold mr-3">
            2
          </span>
          Vehicle Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vehicleType}
              onChange={(e) => handleInputChange('vehicleType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Make <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.vehicleMake}
              onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                errors.vehicleMake ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Toyota"
            />
            {errors.vehicleMake && (
              <p className="mt-1 text-sm text-red-500">{errors.vehicleMake}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.vehicleModel}
              onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                errors.vehicleModel ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Camry"
            />
            {errors.vehicleModel && (
              <p className="mt-1 text-sm text-red-500">{errors.vehicleModel}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.vehicleYear}
              onChange={(e) => handleInputChange('vehicleYear', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              min="1990"
              max={new Date().getFullYear() + 1}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Plate <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.licensePlate}
              onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all uppercase ${
                errors.licensePlate ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ABC 123"
            />
            {errors.licensePlate && (
              <p className="mt-1 text-sm text-red-500">{errors.licensePlate}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Color
            </label>
            <input
              type="text"
              value={formData.vehicleColor}
              onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="e.g., White"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seat Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.seatCapacity}
              onChange={(e) => handleInputChange('seatCapacity', parseInt(e.target.value))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                errors.seatCapacity ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
              max="60"
            />
            {errors.seatCapacity && (
              <p className="mt-1 text-sm text-red-500">{errors.seatCapacity}</p>
            )}
          </div>
        </div>
      </section>
      
      {/* Service Area */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600 text-sm font-bold mr-3">
            3
          </span>
          Service Area
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Home City
            </label>
            <input
              type="text"
              value={formData.homeCity}
              onChange={(e) => handleInputChange('homeCity', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="e.g., Almaty"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Radius (km)
            </label>
            <input
              type="number"
              value={formData.serviceRadiusKm}
              onChange={(e) => handleInputChange('serviceRadiusKm', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              min="1"
              max="1000"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum distance willing to travel from home city</p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Willing to Travel
            </label>
            <div className="space-y-3">
              {travelOptions.map(option => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.willingToTravel?.includes(option.value)}
                    onChange={() => handleTravelToggle(option.value)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Documents */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600 text-sm font-bold mr-3">
            4
          </span>
          Documents
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DocumentUploader
            label="Driver's License"
            documentType="license"
            onUpload={handleDocumentUpload}
          />
          
          <DocumentUploader
            label="Vehicle Registration"
            documentType="registration"
            onUpload={handleDocumentUpload}
          />
          
          <DocumentUploader
            label="Insurance Certificate"
            documentType="insurance"
            onUpload={handleDocumentUpload}
          />
          
          <DocumentUploader
            label="Profile Photo"
            documentType="profilePhoto"
            accept="image/*"
            onUpload={handleDocumentUpload}
          />
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          All documents are optional at this stage and can be uploaded later.
        </p>
      </section>
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </>
          ) : (
            'Register Driver'
          )}
        </button>
      </div>
    </form>
  );
}
