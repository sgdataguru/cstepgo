/**
 * Wallet Setup Step Component
 * Optional wallet setup and final registration
 */

'use client';

import { useState } from 'react';
import type { ContactMethod } from '@/types/auth-types';

interface WalletSetupStepProps {
  contact: string;
  contactType: ContactMethod;
  name: string;
  preferredLanguage: string;
  onComplete: (skip: boolean) => void;
}

export function WalletSetupStep({
  contact,
  contactType,
  name,
  preferredLanguage,
  onComplete,
}: WalletSetupStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async (setupWallet: boolean) => {
    setError('');
    setLoading(true);

    try {
      // Complete registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          type: contactType === 'email' ? 'email' : 'sms',
          name,
          preferredLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Store session token
      if (data.data?.session?.token) {
        localStorage.setItem('session_token', data.data.session.token);
        localStorage.setItem('user_id', data.data.user.id);
      }

      // Complete registration
      onComplete(!setupWallet);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Setup Your Wallet
      </h2>
      <p className="text-gray-600 mb-6">
        Add payment methods to make bookings easier (optional)
      </p>

      {/* Wallet Feature Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-gray-900">Digital Wallet</h3>
            <p className="text-sm text-gray-600">Quick and secure payments</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Instant booking confirmations
          </li>
          <li className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Support for cards and local payment methods
          </li>
          <li className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Secure encryption and fraud protection
          </li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleComplete(true)}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Setup Wallet Now'}
        </button>

        <button
          onClick={() => handleComplete(false)}
          disabled={loading}
          className="w-full py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Skip for Now
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        You can always add payment methods later in your profile settings
      </p>
    </div>
  );
}
