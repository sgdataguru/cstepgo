'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ff0055]/30 rounded-xl p-8 max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-[#808080] mb-6">
          {error.message || 'Failed to load driver profile'}
        </p>
        <button
          onClick={reset}
          className="bg-[#00f0ff] text-[#0a0a0a] px-6 py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}