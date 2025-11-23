import { UserX } from 'lucide-react';
import Link from 'next/link';

export default function DriverNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
        <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Driver Not Found
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The driver profile you're looking for doesn't exist or has been removed.
        </p>

        <Link
          href="/trips"
          className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Browse Available Trips
        </Link>
      </div>
    </div>
  );
}
