'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DriverRegistrationForm } from './components/DriverRegistrationForm';
import { SuccessModal } from './components/SuccessModal';
import { DriverRegistrationResponse } from '@/types/driver';

export default function NewDriverPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationResponse, setRegistrationResponse] = useState<DriverRegistrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Removed authentication check - allow public access for driver registration
  
  const handleSuccess = (response: DriverRegistrationResponse) => {
    setRegistrationResponse(response);
    setShowSuccess(true);
    setError(null);
  };
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCloseModal = () => {
    setShowSuccess(false);
    router.push('/admin/drivers');
  };
  
  const handleRegisterAnother = () => {
    setShowSuccess(false);
    setRegistrationResponse(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Register New Driver</h1>
                <p className="text-sm text-gray-500 mt-1">Manually onboard a new driver to the platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Admin Portal</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Registration Failed</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">Before you start</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Ensure you have the driver's valid phone number for credential delivery</li>
                <li>Login credentials will be automatically generated and sent via WhatsApp/SMS/Email</li>
                <li>The driver will be required to change their password on first login</li>
                <li>All documents can be uploaded now or added later by the driver</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Registration Form */}
        <DriverRegistrationForm
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
      
      {/* Success Modal */}
      {showSuccess && registrationResponse && (
        <SuccessModal
          response={registrationResponse}
          onClose={handleCloseModal}
          onRegisterAnother={handleRegisterAnother}
        />
      )}
    </div>
  );
}
