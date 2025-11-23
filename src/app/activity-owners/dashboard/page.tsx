'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '../components/shared/ProviderLayout';

export default function ActivityOwnerDashboardPage() {
    const router = useRouter();

    const stats = [
        { label: 'Total Bookings', value: '0', change: '+0%', color: 'emerald' },
        { label: 'Active Activities', value: '0', change: '+0%', color: 'cyan' },
        { label: 'Pending Requests', value: '0', change: '', color: 'amber' },
        { label: 'Monthly Revenue', value: '₸0', change: '+0%', color: 'emerald' },
    ];

    return (
        <ProviderLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome to your activity provider dashboard</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    {stat.change && (
                                        <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                                    )}
                                </div>
                                <div className={`w-12 h-12 rounded-full bg-${stat.color}-100 flex items-center justify-center`}>
                                    <svg className={`w-6 h-6 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push('/activity-owners/activities/create')}
                            className="flex items-center space-x-3 p-4 border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Create Activity</p>
                                <p className="text-sm text-gray-600">Add a new activity</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/activity-owners/bookings')}
                            className="flex items-center space-x-3 p-4 border-2 border-cyan-200 rounded-lg hover:bg-cyan-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">View Bookings</p>
                                <p className="text-sm text-gray-600">Manage requests</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/activity-owners/profile')}
                            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Profile Settings</p>
                                <p className="text-sm text-gray-600">Update your info</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Getting Started */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-emerald-900 mb-2">🎉 Welcome to StepperGO!</h2>
                    <p className="text-emerald-700 mb-4">
                        Get started by creating your first activity and start receiving bookings from travelers.
                    </p>
                    <button
                        onClick={() => router.push('/activity-owners/activities/create')}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                    >
                        Create Your First Activity
                    </button>
                </div>
            </div>
        </ProviderLayout>
    );
}
