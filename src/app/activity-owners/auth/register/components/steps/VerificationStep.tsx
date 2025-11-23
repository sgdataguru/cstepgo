'use client';

import React from 'react';
import { RegistrationFormData } from '@/types/activity-owner-types';

interface VerificationStepProps {
    formData: RegistrationFormData;
    updateFormData: (data: Partial<RegistrationFormData>) => void;
    errors?: Record<string, string>;
}

export default function VerificationStep({ formData, updateFormData, errors = {} }: VerificationStepProps) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Final Verification</h2>
                <p className="text-lg text-gray-600">
                    Review your information and submit your application for approval.
                </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <h3 className="font-semibold text-emerald-900 mb-2">Ready to Submit!</h3>
                <p className="text-sm text-emerald-700">
                    By submitting this application, you agree to StepperGO's Terms of Service and Privacy Policy.
                </p>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="terms"
                    checked={formData.termsAccepted || false}
                    onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the Terms of Service and Privacy Policy
                </label>
            </div>
            {errors.termsAccepted && (
                <p className="text-sm text-red-600">{errors.termsAccepted}</p>
            )}

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
                            Submission Tips
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Double-check all information before submitting</li>
                                <li>Required fields must be completed</li>
                                <li>Approval typically takes 24-48 hours</li>
                                <li>You will receive an email/SMS once your account is verified</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
