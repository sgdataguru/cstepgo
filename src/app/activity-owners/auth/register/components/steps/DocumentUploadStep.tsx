'use client';

import React from 'react';
import { RegistrationFormData } from '@/types/activity-owner-types';

interface DocumentUploadStepProps {
    formData: RegistrationFormData;
    updateFormData: (data: Partial<RegistrationFormData>) => void;
    errors?: Record<string, string>;
}

export default function DocumentUploadStep({ formData, updateFormData, errors = {} }: DocumentUploadStepProps) {
    const documents = formData.documents || {};

    const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        updateFormData({ documents: { ...documents, [field]: file } });
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification Documents</h2>
                <p className="text-lg text-gray-600">
                    Upload required business documents for verification. Accepted formats: PDF, JPG, PNG.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business License *</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange('businessLicense')}
                        className="w-full"
                    />
                    {errors['documents.businessLicense'] && <p className="mt-1 text-sm text-red-600">{errors['documents.businessLicense']}</p>}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Certificate</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange('insurance')}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications (Optional)</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            updateFormData({ documents: { ...documents, certifications: files } });
                        }}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Identification Document *</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange('identification')}
                        className="w-full"
                    />
                    {errors['documents.identification'] && <p className="mt-1 text-sm text-red-600">{errors['documents.identification']}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Documents (Optional)</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            updateFormData({ documents: { ...documents, additionalDocuments: files } });
                        }}
                        className="w-full"
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
                            Document Upload Tips
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Accepted formats: PDF, JPG, PNG</li>
                                <li>Maximum file size: 10MB per document</li>
                                <li>Ensure documents are clear and legible</li>
                                <li>Required: Business license and identification</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
