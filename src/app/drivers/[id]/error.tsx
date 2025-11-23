'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DriverProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Unable to Load Profile
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an error while loading this driver's profile. Please try again.
        </p>

        {error.message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
          
          <Link
            href="/trips"
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Browse Trips
          </Link>
        </div>
      </div>
    </div>
  );
}
