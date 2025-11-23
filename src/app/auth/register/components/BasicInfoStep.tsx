'use client';

import { useState } from 'react';

interface BasicInfoStepProps {
  onSubmit: (data: { name: string; preferredLanguage: string }) => Promise<void>;
  onBack: () => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
];

export function BasicInfoStep({ onSubmit, onBack }: BasicInfoStepProps) {
  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({ name: name.trim(), preferredLanguage });
    } catch (err) {
      setError('Failed to complete registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back
      </button>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Complete Your Profile
        </h3>
        <p className="text-sm text-gray-600">
          Almost there! Just a few quick details...
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-modernSg focus:border-transparent"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          ℹ️ Use your real name for bookings
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Language
        </label>
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setPreferredLanguage(lang.code)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                preferredLanguage === lang.code
                  ? 'border-primary-modernSg bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-gray-900">{lang.name}</span>
              </div>
              {preferredLanguage === lang.code && (
                <span className="text-primary-modernSg">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 text-primary-modernSg border-gray-300 rounded focus:ring-primary-modernSg"
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" className="text-primary-modernSg font-semibold hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary-modernSg font-semibold hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !agreedToTerms}
        className="w-full bg-primary-modernSg hover:bg-primary-modernSg/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Completing Registration...
          </>
        ) : (
          <>
            Complete Registration
            <span>→</span>
          </>
        )}
      </button>
    </form>
  );
}
