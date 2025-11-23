'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepProgress from './components/StepProgress';
import { RegistrationFormData, RegistrationStep } from '@/types/activity-owner-types';
import { registerOwner } from '@/lib/api/activity-owners-api';
import LoadingSpinner from '@/app/activity-owners/components/shared/LoadingSpinner';
import ErrorMessage from '@/app/activity-owners/components/shared/ErrorMessage';
import BusinessInfoStep from './components/steps/BusinessInfoStep';
import ActivityCategoriesStep from './components/steps/ActivityCategoriesStep';
import LocationContactStep from './components/steps/LocationContactStep';
import DocumentUploadStep from './components/steps/DocumentUploadStep';
import VerificationStep from './components/steps/VerificationStep';

export default function ActivityOwnerRegistrationPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
    const [formData, setFormData] = useState<RegistrationFormData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep((currentStep + 1) as RegistrationStep);
            setError(null);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as RegistrationStep);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await registerOwner(formData);
            router.push('/activity-owners/auth/verify');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateFormData = (data: Partial<RegistrationFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Join StepperGO as an Activity Provider
                    </h1>
                    <p className="text-lg text-gray-600">
                        Share your unique experiences with travelers across Central Asia
                    </p>
                </div>

                {/* Registration Card */}
                <div className="bg-white rounded-xl shadow-xl p-8">
                    <StepProgress currentStep={currentStep} />

                    {error && (
                        <ErrorMessage message={error} className="mb-6" />
                    )}

                    {/* Step Content */}
                    <div className="mt-8">
                        {currentStep === 1 && (
                            <BusinessInfoStep
                                formData={formData}
                                updateFormData={updateFormData}
                                errors={{}}
                            />
                        )}
                        {currentStep === 2 && (
                            <ActivityCategoriesStep
                                formData={formData}
                                updateFormData={updateFormData}
                                errors={{}}
                            />
                        )}
                        {currentStep === 3 && (
                            <LocationContactStep
                                formData={formData}
                                updateFormData={updateFormData}
                                errors={{}}
                            />
                        )}
                        {currentStep === 4 && (
                            <DocumentUploadStep
                                formData={formData}
                                updateFormData={updateFormData}
                                errors={{}}
                            />
                        )}
                        {currentStep === 5 && (
                            <VerificationStep
                                formData={formData}
                                updateFormData={updateFormData}
                                errors={{}}
                            />
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Back
                        </button>

                        <div className="flex space-x-3">
                            <button
                                className="px-6 py-3 border border-emerald-600 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50"
                            >
                                Save Draft
                            </button>

                            {currentStep < 5 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.termsAccepted}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <LoadingSpinner size="small" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>Submit Application</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                        Need help? <a href="/support" className="text-emerald-600 hover:text-emerald-700 font-medium">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
