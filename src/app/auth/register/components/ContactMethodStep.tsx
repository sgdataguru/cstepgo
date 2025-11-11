/**
 * Contact Method Step Component
 * Select email or phone for registration
 */

'use client';

import { useState } from 'react';
import type { ContactMethod } from '@/types/auth-types';

interface ContactMethodStepProps {
  onSubmit: (contact: string, type: ContactMethod) => void;
}

export function ContactMethodStep({ onSubmit }: ContactMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<ContactMethod>('email');
  const [contactValue, setContactValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!contactValue.trim()) {
      setError('Please enter your contact information');
      return;
    }

    if (selectedMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactValue)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    if (selectedMethod === 'phone') {
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      if (!phoneRegex.test(contactValue)) {
        setError('Please enter a valid phone number');
        return;
      }
    }

    setLoading(true);

    try {
      // Send OTP request
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: contactValue,
          type: selectedMethod === 'email' ? 'email' : 'sms',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }

      // Success - move to next step
      onSubmit(contactValue, selectedMethod);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Get Started
      </h2>
      <p className="text-gray-600 mb-6">
        Choose how you&apos;d like to register
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Method Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedMethod('email')}
            className={`
              p-4 rounded-xl border-2 transition-all
              ${
                selectedMethod === 'email'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex flex-col items-center">
              <svg
                className={`w-8 h-8 mb-2 ${
                  selectedMethod === 'email' ? 'text-blue-600' : 'text-gray-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span
                className={`font-medium ${
                  selectedMethod === 'email' ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                Email
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('phone')}
            className={`
              p-4 rounded-xl border-2 transition-all
              ${
                selectedMethod === 'phone'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex flex-col items-center">
              <svg
                className={`w-8 h-8 mb-2 ${
                  selectedMethod === 'phone' ? 'text-blue-600' : 'text-gray-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span
                className={`font-medium ${
                  selectedMethod === 'phone' ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                Phone
              </span>
            </div>
          </button>
        </div>

        {/* Input Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {selectedMethod === 'email' ? 'Email Address' : 'Phone Number'}
          </label>
          <input
            type={selectedMethod === 'email' ? 'email' : 'tel'}
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder={
              selectedMethod === 'email'
                ? 'your.email@example.com'
                : '+7 (700) 123-45-67'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending code...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
