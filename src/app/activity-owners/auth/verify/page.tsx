'use client';

import { useSearchParams } from 'next/navigation';

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 py-12 px-4">
            <div className="max-w-2xl mx-auto text-center">
                <div className="bg-white rounded-xl shadow-xl p-8">
                    {/* Success Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
                        <svg
                            className="h-8 w-8 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Registration Submitted!
                    </h1>

                    <p className="text-lg text-gray-600 mb-6">
                        Thank you for joining StepperGO as an activity provider.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
                        <div className="text-left text-sm text-blue-700">
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Check your email{email && ` (${email})`} for a verification link</li>
                                <li>Verify your phone number via SMS</li>
                                <li>Our team will review your application within 24-48 hours</li>
                                <li>Once approved, you can start creating activities and accepting bookings</li>
                            </ol>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => window.location.href = '/activity-owners/auth/login'}
                            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                        >
                            Go to Login
                        </button>
                        
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        >
                            Return to Homepage
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                        Need help? <a href="/support" className="text-emerald-600 hover:text-emerald-700 font-medium">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
