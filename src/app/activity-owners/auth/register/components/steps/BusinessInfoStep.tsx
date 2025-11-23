'use client';

import React from 'react';
import { RegistrationFormData } from '@/types/activity-owner-types';

interface BusinessInfoStepProps {
    formData: RegistrationFormData;
    updateFormData: (data: Partial<RegistrationFormData>) => void;
    errors?: Record<string, string>;
}

export default function BusinessInfoStep({ formData, updateFormData, errors = {} }: BusinessInfoStepProps) {
    const handleInputChange = (field: keyof RegistrationFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        updateFormData({ [field]: e.target.value });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Business Information</h2>
                <p className="text-lg text-gray-600">
                    Tell us about your business and what makes it special
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Name */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Business Name *
                    </label>
                    <input
                        type="text"
                        value={formData.businessName || ''}
                        onChange={handleInputChange('businessName')}
                        className={`
                            w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                            ${errors.businessName ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="e.g., Almaty Mountain Adventures"
                    />
                    {errors.businessName && (
                        <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                    )}
                </div>

                {/* Business Type */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Business Type *
                    </label>
                    <select
                        value={formData.businessType || ''}
                        onChange={(e) => updateFormData({ businessType: e.target.value as any })}
                        className={`
                            w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                            ${errors.businessType ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                        `}
                    >
                        <option value="">Select business type</option>
                        <option value="individual">Individual Entrepreneur</option>
                        <option value="llc">Limited Liability Company</option>
                        <option value="corporation">Corporation</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.businessType && (
                        <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
                    )}
                </div>

                {/* Years in Business */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Years in Business
                    </label>
                    <select
                        value={formData.yearsInBusiness || ''}
                        onChange={(e) => updateFormData({ yearsInBusiness: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                        <option value="">Select experience</option>
                        <option value="new">Just starting</option>
                        <option value="1-2">1-2 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="6-10">6-10 years</option>
                        <option value="10+">10+ years</option>
                    </select>
                </div>

                {/* Contact Person */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Person *
                    </label>
                    <input
                        type="text"
                        value={formData.contactPerson || ''}
                        onChange={handleInputChange('contactPerson')}
                        className={`
                            w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                            ${errors.contactPerson ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="Full name of primary contact"
                    />
                    {errors.contactPerson && (
                        <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={handleInputChange('email')}
                        className={`
                            w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                            ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="business@example.com"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={handleInputChange('phone')}
                        className={`
                            w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                            ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="+7 XXX XXX XX XX"
                    />
                    {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                </div>

                {/* Website */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Website (Optional)
                    </label>
                    <input
                        type="url"
                        value={formData.website || ''}
                        onChange={handleInputChange('website')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="https://yourwebsite.com"
                    />
                </div>

                {/* Business Description */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Business Description *
                    </label>
                    <textarea
                        value={formData.businessDescription || ''}
                        onChange={handleInputChange('businessDescription')}
                        rows={4}
                        className={`
                            w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none
                            ${errors.businessDescription ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="Describe your business, what activities you offer, and what makes your experiences unique..."
                        maxLength={500}
                    />
                    <div className="flex justify-between mt-1">
                        {errors.businessDescription && (
                            <p className="text-sm text-red-600">{errors.businessDescription}</p>
                        )}
                        <p className="text-sm text-gray-500 ml-auto">
                            {(formData.businessDescription || '').length}/500
                        </p>
                    </div>
                </div>

                {/* Tax Registration */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tax Registration Number
                    </label>
                    <input
                        type="text"
                        value={formData.taxRegistrationNumber || ''}
                        onChange={handleInputChange('taxRegistrationNumber')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Your business tax ID"
                    />
                </div>

                {/* Business License */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Business License Number
                    </label>
                    <input
                        type="text"
                        value={formData.businessLicenseNumber || ''}
                        onChange={handleInputChange('businessLicenseNumber')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Your business license number"
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
                            Tips for a successful registration
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Use your official business name as registered with local authorities</li>
                                <li>Provide a detailed description highlighting what makes your activities unique</li>
                                <li>Ensure contact information is accurate - we'll use this for verification</li>
                                <li>Business license information helps build trust with customers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
