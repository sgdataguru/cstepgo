'use client';

import { useState } from 'react';

interface ContactMethodStepProps {
  onSubmit: (method: 'phone' | 'email', value: string) => Promise<void>;
  initialMethod?: 'phone' | 'email';
}

export function ContactMethodStep({ onSubmit, initialMethod }: ContactMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<'phone' | 'email'>(initialMethod || 'phone');
  const [countryCode, setCountryCode] = useState('+996');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const value = selectedMethod === 'phone' 
        ? `${countryCode}${phoneNumber}` 
        : email;
      
      if (!value) {
        setError('Please enter your contact information');
        return;
      }

      await onSubmit(selectedMethod, value);
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose verification method:
        </h3>

        {/* Method Selection */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedMethod('phone')}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === 'phone'
                ? 'border-primary-modernSg bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <div className="font-semibold text-gray-900">Phone Number</div>
                <div className="text-sm text-gray-600">Fast WhatsApp/SMS verification</div>
                <div className="text-xs text-primary-modernSg mt-1">Recommended</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('email')}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === 'email'
                ? 'border-primary-modernSg bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <div className="font-semibold text-gray-900">Email Address</div>
                <div className="text-sm text-gray-600">Verification via email</div>
                <div className="text-xs text-gray-500 mt-1">Takes 1-2 minutes</div>
              </div>
            </div>
          </button>
        </div>

        {/* Phone Input */}
        {selectedMethod === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country Code
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-modernSg focus:border-transparent"
              >
                <option value="+996">🇰🇬 +996 (Kyrgyzstan)</option>
                <option value="+7">🇰🇿 +7 (Kazakhstan)</option>
                <option value="+998">🇺🇿 +998 (Uzbekistan)</option>
                <option value="+992">🇹🇯 +992 (Tajikistan)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="555 123 456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-modernSg focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                ℹ️ We'll send a verification code
              </p>
            </div>
          </div>
        )}

        {/* Email Input */}
        {selectedMethod === 'email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-modernSg focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              ℹ️ Check your inbox for the verification code
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-modernSg hover:bg-primary-modernSg/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending...' : 'Continue'}
      </button>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/auth/login" className="text-primary-modernSg font-semibold hover:underline">
          Sign In
        </a>
      </div>

      <div className="text-center text-xs text-gray-500">
        <a href="/privacy" className="hover:underline">Privacy Policy</a>
        {' • '}
        <a href="/terms" className="hover:underline">Terms of Service</a>
      </div>
    </form>
  );
}
