'use client';

import React from 'react';
import { RegistrationFormData } from '@/types/activity-owner-types';

interface LocationContactStepProps {
    formData: RegistrationFormData;
    updateFormData: (data: Partial<RegistrationFormData>) => void;
    errors?: Record<string, string>;
}

export default function LocationContactStep({ formData, updateFormData, errors = {} }: LocationContactStepProps) {
    const location = formData.location || {};
    const handleLocationChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFormData({ location: { ...location, [field]: e.target.value } });
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Location & Contact</h2>
                <p className="text-lg text-gray-600">
                    Where is your business located? Enter your main address and contact details.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                    <input
                        type="text"
                        value={location.country || ''}
                        onChange={handleLocationChange('country')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors['location.country'] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        placeholder="e.g., Kazakhstan"
                    />
                    {errors['location.country'] && <p className="mt-1 text-sm text-red-600">{errors['location.country']}</p>}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                    <input
                        type="text"
                        value={location.city || ''}
                        onChange={handleLocationChange('city')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors['location.city'] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        placeholder="e.g., Almaty"
                    />
                    {errors['location.city'] && <p className="mt-1 text-sm text-red-600">{errors['location.city']}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                    <input
                        type="text"
                        value={location.address || ''}
                        onChange={handleLocationChange('address')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors['location.address'] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Street, building, etc."
                    />
                    {errors['location.address'] && <p className="mt-1 text-sm text-red-600">{errors['location.address']}</p>}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                    <input
                        type="number"
                        value={location.latitude || ''}
                        onChange={handleLocationChange('latitude')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Optional"
                        step="any"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                    <input
                        type="number"
                        value={location.longitude || ''}
                        onChange={handleLocationChange('longitude')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Optional"
                        step="any"
                    />
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Location Tips
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Provide your main business address for verification</li>
                                <li>Latitude/Longitude are optional but help travelers find you</li>
                                <li>You can update your location later from your dashboard</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
