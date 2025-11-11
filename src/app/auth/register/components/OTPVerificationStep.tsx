/**
 * OTP Verification Step Component
 * Verify OTP code sent to email or phone
 */

'use client';

import { useState, useEffect } from 'react';
import type { ContactMethod } from '@/types/auth-types';

interface OTPVerificationStepProps {
  contact: string;
  contactType: ContactMethod;
  onVerified: () => void;
  onBack: () => void;
}

export function OTPVerificationStep({
  contact,
  contactType,
  onVerified,
  onBack,
}: OTPVerificationStepProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every((digit) => digit !== '') && !loading) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          code: otpCode,
          type: contactType === 'email' ? 'email' : 'sms',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Invalid verification code');
        setLoading(false);
        setOtp(['', '', '', '', '', '']);
        return;
      }

      // Success
      onVerified();
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
      setOtp(['', '', '', '', '', '']);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError('');
    setCanResend(false);
    setResendCountdown(60);

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          type: contactType === 'email' ? 'email' : 'sms',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to resend code');
        setCanResend(true);
        setResendCountdown(0);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setCanResend(true);
      setResendCountdown(0);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Enter Verification Code
      </h2>
      <p className="text-gray-600 mb-6">
        We sent a code to{' '}
        <span className="font-semibold text-gray-900">{contact}</span>
      </p>

      {/* OTP Input Fields */}
      <div className="flex gap-2 justify-center mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Resend Code */}
      <div className="text-center mb-6">
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Resend Code
          </button>
        ) : (
          <p className="text-gray-500 text-sm">
            Resend code in {resendCountdown}s
          </p>
        )}
      </div>

      {/* Verify Button */}
      <button
        onClick={() => handleVerify()}
        disabled={loading || otp.some((digit) => !digit)}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>
    </div>
  );
}
