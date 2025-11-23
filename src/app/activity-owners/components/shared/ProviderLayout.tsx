'use client';

import React from 'react';
import ProviderHeader from './ProviderHeader';

interface ProviderLayoutProps {
    children: React.ReactNode;
}

export default function ProviderLayout({ children }: ProviderLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <ProviderHeader />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-sm text-gray-500">
                            © 2025 StepperGO. All rights reserved.
                        </div>
                        <div className="flex space-x-6 text-sm">
                            <a href="/help" className="text-gray-600 hover:text-emerald-600">
                                Help Center
                            </a>
                            <a href="/terms" className="text-gray-600 hover:text-emerald-600">
                                Terms of Service
                            </a>
                            <a href="/privacy" className="text-gray-600 hover:text-emerald-600">
                                Privacy Policy
                            </a>
                            <a href="/contact" className="text-gray-600 hover:text-emerald-600">
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
