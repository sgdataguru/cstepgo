'use client';

import React from 'react';
import { RegistrationStep } from '@/types/activity-owner-types';

interface StepProgressProps {
    currentStep: RegistrationStep;
    totalSteps?: number;
}

const STEP_LABELS = [
    'Business Info',
    'Categories',
    'Location',
    'Documents',
    'Verification',
];

export default function StepProgress({ currentStep, totalSteps = 5 }: StepProgressProps) {
    return (
        <div className="w-full py-6">
            {/* Step Counter */}
            <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-600">
                    Step {currentStep} of {totalSteps}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="relative">
                {/* Background line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2" />

                {/* Progress line */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-emerald-600 transform -translate-y-1/2 transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                />

                {/* Step circles */}
                <div className="relative flex justify-between">
                    {Array.from({ length: totalSteps }, (_, index) => {
                        const stepNumber = (index + 1) as RegistrationStep;
                        const isComplete = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;

                        return (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${isComplete
                                            ? 'bg-emerald-600 text-white'
                                            : isCurrent
                                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                                : 'bg-white text-gray-400 border-2 border-gray-300'
                                        }`}
                                >
                                    {isComplete ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        stepNumber
                                    )}
                                </div>
                                <p
                                    className={`mt-2 text-xs font-medium hidden md:block ${isCurrent ? 'text-emerald-600' : 'text-gray-500'
                                        }`}
                                >
                                    {STEP_LABELS[index]}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
