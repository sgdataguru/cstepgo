'use client';

import { useState } from 'react';
import { ContactMethodStep } from './ContactMethodStep';
import { OTPVerificationStep } from './OTPVerificationStep';
import { BasicInfoStep } from './BasicInfoStep';
import { SuccessScreen } from './SuccessScreen';
import { ProgressIndicator } from './ProgressIndicator';

type RegistrationStep = 'contact-method' | 'otp-verification' | 'basic-info' | 'complete';

interface RegistrationFlowProps {
  onComplete: (userData: UserRegistrationData) => void;
  onCancel: () => void;
  initialMethod?: 'phone' | 'email';
}

interface UserRegistrationData {
  id: string;
  contactMethod: 'phone' | 'email';
  contactValue: string;
  name: string;
  preferredLanguage: string;
  createdAt: Date;
}

export function RegistrationFlow({ onComplete, onCancel, initialMethod }: RegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('contact-method');
  const [contactMethod, setContactMethod] = useState<'phone' | 'email' | null>(initialMethod || null);
  const [contactValue, setContactValue] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [userName, setUserName] = useState('');
  const [language, setLanguage] = useState('en');

  const handleContactSubmit = async (method: 'phone' | 'email', value: string) => {
    setContactMethod(method);
    setContactValue(value);
    
    // Simulate OTP sending
    console.log(`Sending OTP to ${method}: ${value}`);
    setOtpToken('mock-token-123');
    
    // Move to OTP step
    setCurrentStep('otp-verification');
  };

  const handleOTPVerify = async (code: string) => {
    // Simulate OTP verification
    console.log(`Verifying OTP: ${code}`);
    
    // Move to basic info step
    setCurrentStep('basic-info');
  };

  const handleBasicInfoSubmit = async (data: { name: string; preferredLanguage: string }) => {
    setUserName(data.name);
    setLanguage(data.preferredLanguage);
    
    // Complete registration
    setCurrentStep('complete');
    
    // Simulate user creation
    const userData: UserRegistrationData = {
      id: 'user-' + Date.now(),
      contactMethod: contactMethod!,
      contactValue,
      name: data.name,
      preferredLanguage: data.preferredLanguage,
      createdAt: new Date(),
    };
    
    setTimeout(() => {
      onComplete(userData);
    }, 2000);
  };

  const handleResendOTP = async () => {
    console.log('Resending OTP...');
    // Simulate resend
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'contact-method': return 1;
      case 'otp-verification': return 2;
      case 'basic-info': return 3;
      case 'complete': return 3;
      default: return 1;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-modernSg to-primary-peranakan p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-display font-bold">StepperGO</h1>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {currentStep !== 'complete' && (
            <>
              <h2 className="text-xl font-semibold mb-2">Quick Registration</h2>
              <p className="text-white/90 text-sm mb-4">Travel smart in 2 minutes 🚀</p>
              <ProgressIndicator currentStep={getStepNumber()} totalSteps={3} />
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'contact-method' && (
            <ContactMethodStep
              onSubmit={handleContactSubmit}
              initialMethod={initialMethod}
            />
          )}

          {currentStep === 'otp-verification' && contactMethod && (
            <OTPVerificationStep
              contactMethod={contactMethod}
              contactValue={contactValue}
              onVerify={handleOTPVerify}
              onResend={handleResendOTP}
              onBack={() => setCurrentStep('contact-method')}
            />
          )}

          {currentStep === 'basic-info' && (
            <BasicInfoStep
              onSubmit={handleBasicInfoSubmit}
              onBack={() => setCurrentStep('otp-verification')}
            />
          )}

          {currentStep === 'complete' && (
            <SuccessScreen userName={userName} />
          )}
        </div>
      </div>
    </div>
  );
}
