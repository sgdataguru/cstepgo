/**
 * Progress Indicator Component
 * Shows current step in registration flow
 */

import type { RegistrationStep } from '@/types/auth-types';

interface ProgressIndicatorProps {
  steps: RegistrationStep[];
  currentStep: RegistrationStep;
}

const stepLabels: Record<RegistrationStep, string> = {
  'contact-method': 'Contact',
  'otp-verification': 'Verify',
  'basic-info': 'Profile',
  'wallet-setup': 'Wallet',
  'complete': 'Done',
};

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={step} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-semibold text-sm transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium
                  ${isActive ? 'text-blue-600' : 'text-gray-500'}
                `}
              >
                {stepLabels[step]}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 -mt-8">
                <div
                  className={`
                    h-full transition-all duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
