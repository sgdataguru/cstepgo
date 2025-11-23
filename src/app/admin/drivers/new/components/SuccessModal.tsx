'use client';

import { DriverRegistrationResponse } from '@/types/driver';

interface SuccessModalProps {
  response: DriverRegistrationResponse;
  onClose: () => void;
  onRegisterAnother: () => void;
}

export function SuccessModal({ response, onClose, onRegisterAnother }: SuccessModalProps) {
  const { driver, credentials, delivery } = response;
  
  const getDeliveryIcon = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
      case 'READ':
        return (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'FAILED':
        return (
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-full p-3">
              <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center">Driver Registered Successfully!</h2>
          <p className="text-center text-green-100 mt-2">
            {driver.fullName} has been added to the system
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Driver Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Driver Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">Driver ID</p>
                <p className="text-sm font-medium text-gray-900">{driver.driverId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-sm font-medium text-gray-900">{driver.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {driver.status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Login Credentials */}
          <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="h-5 w-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Login Credentials
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Driver ID</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white border border-teal-300 rounded px-3 py-2 text-sm font-mono text-gray-900">
                    {credentials.driverId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credentials.driverId)}
                    className="p-2 text-teal-600 hover:bg-teal-100 rounded transition-colors"
                    title="Copy"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Temporary Password</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white border border-teal-300 rounded px-3 py-2 text-sm font-mono text-gray-900">
                    {credentials.tempPassword}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credentials.tempPassword)}
                    className="p-2 text-teal-600 hover:bg-teal-100 rounded transition-colors"
                    title="Copy"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Login URL</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white border border-teal-300 rounded px-3 py-2 text-sm font-mono text-gray-900 truncate">
                    {credentials.loginUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credentials.loginUrl)}
                    className="p-2 text-teal-600 hover:bg-teal-100 rounded transition-colors"
                    title="Copy"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-teal-700 mt-3 flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Driver will be required to change password on first login
            </p>
          </div>
          
          {/* Delivery Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Credential Delivery Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {getDeliveryIcon(delivery.whatsapp)}
                  <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  delivery.whatsapp === 'SENT' || delivery.whatsapp === 'DELIVERED' || delivery.whatsapp === 'READ'
                    ? 'bg-green-100 text-green-800'
                    : delivery.whatsapp === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {delivery.whatsapp}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {getDeliveryIcon(delivery.sms)}
                  <span className="text-sm font-medium text-gray-700">SMS</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  delivery.sms === 'SENT' || delivery.sms === 'DELIVERED' || delivery.sms === 'READ'
                    ? 'bg-green-100 text-green-800'
                    : delivery.sms === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {delivery.sms}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  {getDeliveryIcon(delivery.email)}
                  <span className="text-sm font-medium text-gray-700">Email</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  delivery.email === 'SENT' || delivery.email === 'DELIVERED' || delivery.email === 'READ'
                    ? 'bg-green-100 text-green-800'
                    : delivery.email === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {delivery.email}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-colors"
          >
            View Driver List
          </button>
          <button
            onClick={onRegisterAnother}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
          >
            Register Another Driver
          </button>
        </div>
      </div>
    </div>
  );
}
