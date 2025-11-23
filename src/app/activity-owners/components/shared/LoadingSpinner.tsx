'use client';

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    fullPage?: boolean;
}

export default function LoadingSpinner({
    size = 'medium',
    text,
    fullPage = false
}: LoadingSpinnerProps) {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center">
            <div className={`${sizeClasses[size]} border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin`} />
            {text && (
                <p className="mt-3 text-sm text-gray-600">{text}</p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}
