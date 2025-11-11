'use client';

import React from 'react';
import { X, UserPlus, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RegistrationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
  tripTitle?: string;
}

/**
 * RegistrationPromptModal - Prompts visitors to register/login before booking
 */
export default function RegistrationPromptModal({
  isOpen,
  onClose,
  redirectUrl,
  tripTitle,
}: RegistrationPromptModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleRegister = () => {
    const url = redirectUrl 
      ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
      : '/register';
    router.push(url);
  };

  const handleLogin = () => {
    const url = redirectUrl 
      ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
      : '/login';
    router.push(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
            Sign up to book this trip
          </h2>
          {tripTitle && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              You&apos;re about to book: <span className="font-semibold">{tripTitle}</span>
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            Create a free account to book trips, manage reservations, and connect with fellow travelers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <UserPlus className="w-5 h-5" />
            Create Account
          </button>
          
          <button
            onClick={handleLogin}
            className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Log In
          </button>
        </div>

        {/* Benefits List */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
            Benefits of signing up:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Book trips instantly
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Track your reservations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Join WhatsApp groups with co-travelers
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Access exclusive deals and discounts
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
