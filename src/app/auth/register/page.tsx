'use client';

/**
 * Registration Page
 * Multi-step OTP-based registration flow
 */

import { useState } from 'react';
import { ContactMethodStep } from './components/ContactMethodStep';
import { OTPVerificationStep } from './components/OTPVerificationStep';
import { BasicInfoStep } from './components/BasicInfoStep';
import { WalletSetupStep } from './components/WalletSetupStep';
import { ProgressIndicator } from './components/ProgressIndicator';
import type { RegistrationStep, ContactMethod } from '@/types/auth-types';

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('contact-method');
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState<ContactMethod>('email');
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [userName, setUserName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  const steps: RegistrationStep[] = [
    'contact-method',
    'otp-verification',
    'basic-info',
    'wallet-setup',
    'complete',
  ];

  const handleContactSubmit = (contactValue: string, type: ContactMethod) => {
    setContact(contactValue);
    setContactType(type);
    setCurrentStep('otp-verification');
  };

  const handleOTPVerified = () => {
    setIsOTPVerified(true);
    setCurrentStep('basic-info');
  };

  const handleBasicInfoSubmit = (name: string, language: string) => {
    setUserName(name);
    setPreferredLanguage(language);
    setCurrentStep('wallet-setup');
  };

  const handleWalletSetup = (skip: boolean) => {
    setCurrentStep('complete');
    // Redirect to home or dashboard after a brief moment
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to StepperGO
          </h1>
          <p className="text-gray-600">
            Quick registration to start your journey
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator 
          steps={steps.slice(0, 4)} // Exclude 'complete' from indicator
          currentStep={currentStep}
        />

        {/* Registration Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
          {currentStep === 'contact-method' && (
            <ContactMethodStep onSubmit={handleContactSubmit} />
          )}

          {currentStep === 'otp-verification' && (
            <OTPVerificationStep
              contact={contact}
              contactType={contactType}
              onVerified={handleOTPVerified}
              onBack={() => setCurrentStep('contact-method')}
            />
          )}

          {currentStep === 'basic-info' && (
            <BasicInfoStep
              onSubmit={handleBasicInfoSubmit}
              onBack={() => setCurrentStep('otp-verification')}
            />
          )}

          {currentStep === 'wallet-setup' && (
            <WalletSetupStep
              contact={contact}
              contactType={contactType}
              name={userName}
              preferredLanguage={preferredLanguage}
              onComplete={handleWalletSetup}
            />
          )}

          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registration Complete!
              </h2>
              <p className="text-gray-600">
                Redirecting you to the home page...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
