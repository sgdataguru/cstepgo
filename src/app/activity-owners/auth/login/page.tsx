'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActivityOwnerAuth } from '@/app/activity-owners/components/hooks/useActivityOwnerAuth';
import LoadingSpinner from '@/app/activity-owners/components/shared/LoadingSpinner';
import ErrorMessage from '@/app/activity-owners/components/shared/ErrorMessage';

export default function ActivityOwnerLoginPage() {
    const router = useRouter();
    const { login, isLoading } = useActivityOwnerAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await login({ email, password });
            router.push('/activity-owners/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">StepperGO</h1>
                    <p className="text-lg text-gray-600">Activity Provider Login</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <ErrorMessage message={error} />}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <a href="/activity-owners/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <span>Login</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a href="/activity-owners/auth/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Register your business
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
                        ← Back to main site
                    </a>
                </div>
            </div>
        </div>
    );
}
