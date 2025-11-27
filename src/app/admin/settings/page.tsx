'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PlatformFeeSettings {
  key: string;
  value: number;
  label: string;
  description: string;
  displayValue: string;
  minValue: number;
  maxValue: number;
  minDisplayValue: string;
  maxDisplayValue: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformFeeSettings | null>(null);
  const [feePercentage, setFeePercentage] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(data.settings.platformFeeRate);
        setFeePercentage(Math.round(data.settings.platformFeeRate.value * 100));
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (err) {
      setError('Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: settings.key,
          value: feePercentage, // Send as percentage, API converts to decimal
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Settings updated successfully');
        // Refresh settings to get the updated values
        await fetchSettings();
      } else {
        setError(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const isValidFee = feePercentage >= 0 && feePercentage <= 50;
  const hasChanges = settings && Math.round(settings.value * 100) !== feePercentage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure platform-wide business settings
              </p>
            </div>
            <Link
              href="/admin/drivers"
              className="text-teal-600 hover:text-teal-700 flex items-center"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Platform Fee Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="h-5 w-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Platform Fee Configuration
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="p-6">
              {/* Description */}
              <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Platform Fee</strong> is the percentage retained by StepperGO from each completed ride before paying the driver.
                  <br />
                  <span className="text-blue-600">
                    Driver receives: {100 - feePercentage}% of the fare
                  </span>
                </p>
              </div>

              {/* Current Value Display */}
              {settings && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Current platform fee:</span>
                    <span className="font-semibold text-gray-900">{settings.displayValue}</span>
                  </div>
                </div>
              )}

              {/* Fee Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Fee Percentage
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={settings?.minValue ? settings.minValue * 100 : 0}
                      max={settings?.maxValue ? settings.maxValue * 100 : 50}
                      step={1}
                      value={feePercentage}
                      onChange={(e) => setFeePercentage(Math.round(parseFloat(e.target.value)) || 0)}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg text-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        !isValidFee ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg font-semibold">%</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-gray-100 px-4 py-3 rounded-lg">
                      <span className="text-sm text-gray-600">Driver gets:</span>
                      <span className="ml-2 text-lg font-bold text-teal-600">{100 - feePercentage}%</span>
                    </div>
                  </div>
                </div>
                {!isValidFee && (
                  <p className="mt-2 text-sm text-red-600">
                    Fee must be between {settings?.minDisplayValue || '0%'} and {settings?.maxDisplayValue || '50%'}
                  </p>
                )}
              </div>

              {/* Slider */}
              <div className="mb-8">
                <input
                  type="range"
                  min={settings?.minValue ? settings.minValue * 100 : 0}
                  max={settings?.maxValue ? settings.maxValue * 100 : 50}
                  step={1}
                  value={feePercentage}
                  onChange={(e) => setFeePercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{settings?.minDisplayValue || '0%'}</span>
                  <span>{settings?.maxDisplayValue || '50%'}</span>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="mb-8 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Example Calculation</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Total Fare</p>
                    <p className="text-lg font-bold text-gray-900">10,000 KZT</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Platform Fee ({feePercentage}%)</p>
                    <p className="text-lg font-bold text-red-600">{(10000 * feePercentage / 100).toLocaleString()} KZT</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Driver Earnings ({100 - feePercentage}%)</p>
                    <p className="text-lg font-bold text-teal-600">{(10000 * (100 - feePercentage) / 100).toLocaleString()} KZT</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!isValidFee || !hasChanges || saving}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center transition-all ${
                    isValidFee && hasChanges && !saving
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              {/* Warning Note */}
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Changes will apply to new trips and bookings only. 
                    Existing payouts will not be retroactively adjusted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
