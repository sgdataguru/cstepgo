'use client';

import React from 'react';
import { RegistrationFormData, ActivityCategory } from '@/types/activity-owner-types';
import { ACTIVITY_CATEGORIES } from '@/lib/utils/activity-constants';

interface ActivityCategoriesStepProps {
    formData: RegistrationFormData;
    updateFormData: (data: Partial<RegistrationFormData>) => void;
    errors?: Record<string, string>;
}

export default function ActivityCategoriesStep({ formData, updateFormData, errors = {} }: ActivityCategoriesStepProps) {
    const primaryCategories = formData.primaryCategories || [];
    const secondaryCategories = formData.secondaryCategories || [];

    const handlePrimaryToggle = (category: ActivityCategory) => {
        const updated = primaryCategories.includes(category)
            ? primaryCategories.filter(c => c !== category)
            : [...primaryCategories, category];
        
        updateFormData({ primaryCategories: updated });
    };

    const handleSecondaryToggle = (category: ActivityCategory) => {
        const updated = secondaryCategories.includes(category)
            ? secondaryCategories.filter(c => c !== category)
            : [...secondaryCategories, category];
        
        updateFormData({ secondaryCategories: updated });
    };

    const getCategoryIcon = (category: ActivityCategory) => {
        const categoryData = ACTIVITY_CATEGORIES.find(cat => cat.value === category);
        return categoryData?.icon || '�';
    };

    const getCategoryData = (categoryValue: ActivityCategory) => {
        return ACTIVITY_CATEGORIES.find(cat => cat.value === categoryValue);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Activity Categories</h2>
                <p className="text-lg text-gray-600">
                    Select the types of activities and services you provide
                </p>
            </div>

            {/* Primary Categories */}
            <div>
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Primary Categories *
                    </h3>
                    <p className="text-gray-600">
                        Select your main areas of expertise (you can choose multiple)
                    </p>
                    {errors.primaryCategories && (
                        <p className="mt-2 text-sm text-red-600">{errors.primaryCategories}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ACTIVITY_CATEGORIES.map((category) => {
                        const isSelected = primaryCategories.includes(category.value);
                        
                        return (
                            <div
                                key={category.value}
                                onClick={() => handlePrimaryToggle(category.value)}
                                className={`
                                    relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                                    ${isSelected 
                                        ? 'border-emerald-500 bg-emerald-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                    }
                                `}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="text-2xl">
                                        {category.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            {category.label}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {category.description}
                                        </p>
                                        <div className="text-xs text-gray-500">
                                            <span className="font-medium">Price range:</span> {category.avgPrice.min}-{category.avgPrice.max} {category.avgPrice.currency}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <span className="font-medium">Duration:</span> {Math.round(category.avgDuration.min/60)}-{Math.round(category.avgDuration.max/60)} hours
                                        </div>
                                    </div>
                                </div>
                                
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                {/* Example Activities */}
                                {category.examples && category.examples.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">
                                            <span className="font-medium">Examples:</span> {category.examples.slice(0, 2).join(', ')}
                                            {category.examples.length > 2 && '...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Secondary Categories */}
            <div>
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Secondary Categories (Optional)
                    </h3>
                    <p className="text-gray-600">
                        Additional services or activities you occasionally offer
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ACTIVITY_CATEGORIES
                        .filter(category => !primaryCategories.includes(category.value))
                        .map((category) => {
                            const isSelected = secondaryCategories.includes(category.value);
                            
                            return (
                                <div
                                    key={category.value}
                                    onClick={() => handleSecondaryToggle(category.value)}
                                    className={`
                                        p-3 border rounded-lg cursor-pointer transition-all duration-200 text-center
                                        ${isSelected 
                                            ? 'border-emerald-300 bg-emerald-25' 
                                            : 'border-gray-200 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <div className="text-lg mb-1">
                                        {category.icon}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {category.label}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Specializations */}
            <div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Specializations & Unique Offerings
                    </label>
                    <p className="text-gray-600 text-sm mb-4">
                        Describe any special skills, certifications, or unique aspects of your activities
                    </p>
                </div>
                <textarea
                    value={formData.specializations?.join('\n') || ''}
                    onChange={(e) => {
                        const specs = e.target.value.split('\n').filter(s => s.trim());
                        updateFormData({ specializations: specs });
                    }}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder={`Examples:
• Certified mountain guide with 10+ years experience
• Traditional horsemanship instructor
• Bilingual tours (English, Russian, Kazakh)
• Photography workshops for beginners`}
                />
            </div>

            {/* Selection Summary */}
            {(primaryCategories.length > 0 || secondaryCategories.length > 0) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <h4 className="font-semibold text-emerald-900 mb-3">Selection Summary</h4>
                    <div className="space-y-2">
                        {primaryCategories.length > 0 && (
                            <div>
                                <span className="text-sm font-medium text-emerald-800">Primary: </span>
                                <span className="text-sm text-emerald-700">
                                    {primaryCategories.map(cat => getCategoryData(cat)?.label).filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                        {secondaryCategories.length > 0 && (
                            <div>
                                <span className="text-sm font-medium text-emerald-800">Secondary: </span>
                                <span className="text-sm text-emerald-700">
                                    {secondaryCategories.map(cat => getCategoryData(cat)?.label).filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Category Selection Tips
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Select at least one primary category to continue</li>
                                <li>Primary categories should be your main business focus</li>
                                <li>Secondary categories help customers discover you for occasional services</li>
                                <li>You can always modify these selections later from your dashboard</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
