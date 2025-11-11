'use client';

import React, { useState } from 'react';
import { CheckCircle, Copy, X, Eye, EyeOff } from 'lucide-react';

interface SuccessModalProps {
  driverId: string;
  password: string;
  expiresAt: Date;
  onClose: () => void;
}

export function SuccessModal({
  driverId,
  password,
  expiresAt,
  onClose,
}: SuccessModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'id' | 'password' | null>(null);

  const handleCopy = (text: string, type: 'id' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Driver Registered Successfully!
          </h2>
          <p className="text-gray-600 mt-2">
            The driver has been registered and credentials have been sent.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          {/* Driver ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver ID
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm">
                {driverId}
              </div>
              <button
                onClick={() => handleCopy(driverId, 'id')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy Driver ID"
              >
                {copied === 'id' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Temporary Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temporary Password
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm flex items-center justify-between">
                <span className={showPassword ? '' : 'select-none'}>
                  {showPassword ? password : '•'.repeat(password.length)}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-600 hover:text-gray-900 ml-2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <button
                onClick={() => handleCopy(password, 'password')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy Password"
              >
                {copied === 'password' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Expiry Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> This password expires on{' '}
              <strong>{expiryDate}</strong>. The driver must change it on first
              login.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Credentials Sent Via:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ WhatsApp message (primary)</li>
              <li>✓ SMS (fallback if WhatsApp fails)</li>
              <li>✓ Email (if provided)</li>
            </ul>
          </div>

          <div className="text-sm text-gray-600">
            <h4 className="font-semibold text-gray-900 mb-2">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Driver will receive credentials via WhatsApp/SMS/Email</li>
              <li>Driver downloads the StepperGO Driver app</li>
              <li>Driver logs in with the provided credentials</li>
              <li>Driver must change password on first login</li>
              <li>Driver completes profile setup and starts driving</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Print
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Keep these credentials secure. They contain sensitive information.
        </p>
      </div>
    </div>
  );
}
