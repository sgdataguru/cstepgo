'use client';

import { useState, useEffect, useRef } from 'react';

interface OTPVerificationStepProps {
  contactMethod: 'phone' | 'email';
  contactValue: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
}

export function OTPVerificationStep({ 
  contactMethod, 
  contactValue, 
  onVerify, 
  onResend,
  onBack 
}: OTPVerificationStepProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Countdown timer
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]; // Only take first character
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    
    if (newOtp.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      await onVerify(code);
    } catch (err) {
      setError('Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendCountdown(30);
    await onResend();
  };

  const maskContact = (value: string) => {
    if (contactMethod === 'phone') {
      return value.slice(0, -4).replace(/./g, '*') + value.slice(-4);
    }
    const [user, domain] = value.split('@');
    return user.slice(0, 2) + '***@' + domain;
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back
      </button>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verify Your {contactMethod === 'phone' ? 'Number' : 'Email'}
        </h3>
        <p className="text-sm text-gray-600">
          We sent a 6-digit code to:
        </p>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          {contactMethod === 'phone' ? '📱' : '📧'} {maskContact(contactValue)}
        </p>
        <button
          onClick={onBack}
          className="text-xs text-primary-modernSg hover:underline mt-1"
        >
          Change {contactMethod === 'phone' ? 'number' : 'email'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Enter verification code:
        </label>
        
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg transition-all ${
                digit
                  ? 'border-emerald-500 bg-emerald-50'
                  : error
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-primary-modernSg focus:ring-2 focus:ring-primary-modernSg/20'
              }`}
              disabled={isLoading}
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-shake">
            ⚠️ {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            ⏳ Verifying your code...
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          ⏱️ Code expires in 4:{resendCountdown < 10 ? '0' : ''}{resendCountdown}
        </p>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={!canResend}
            className={`text-sm font-semibold transition-colors ${
              canResend
                ? 'text-primary-modernSg hover:underline'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {canResend ? '📱 Resend code' : `Resend available in 0:${resendCountdown < 10 ? '0' : ''}${resendCountdown}`}
          </button>
        </div>
      </div>
    </div>
  );
}
