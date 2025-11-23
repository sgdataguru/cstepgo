'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActivityOwnerAuth } from '../hooks/useActivityOwnerAuth';

export default function ProviderHeader() {
    const pathname = usePathname();
    const { owner, logout } = useActivityOwnerAuth();

    const navItems = [
        { href: '/activity-owners/dashboard', label: 'Dashboard' },
        { href: '/activity-owners/activities', label: 'Activities' },
        { href: '/activity-owners/bookings', label: 'Bookings' },
        { href: '/activity-owners/analytics', label: 'Analytics' },
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/activity-owners/dashboard" className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-emerald-600">StepperGO</span>
                        <span className="text-sm text-gray-500">Provider</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname?.startsWith(item.href)
                                        ? 'text-emerald-600 bg-emerald-50'
                                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {owner && (
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                        {owner.businessName || owner.email}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                        {owner.verificationStatus}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-50">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                <Link
                                    href="/activity-owners/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Profile Settings
                                </Link>
                                <Link
                                    href="/activity-owners/profile#notifications"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Notifications
                                </Link>
                                <hr className="my-1" />
                                <button
                                    onClick={logout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
