'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { DriverFormData } from '../types';
import { DocumentUploader } from './DocumentUploader';
import { SuccessModal } from './SuccessModal';
import { User, Car, FileText, Send, Loader2 } from 'lucide-react';

interface DriverRegistrationFormProps {
  onSuccess?: () => void;
}

export function DriverRegistrationForm({ onSuccess }: DriverRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [tempDriverId, setTempDriverId] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DriverFormData>({
    defaultValues: {
      autoApprove: false,
      sendCredentials: true,
      documents: {},
    },
  });

  const watchedDocuments = watch('documents');

  const onSubmit = async (data: DriverFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to register driver');
      }

      setCredentials(result.data.credentials);
      setShowSuccess(true);
    } catch (error) {
      console.error('Registration failed:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to register driver'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = (documents: Record<string, string>) => {
    setValue('documents', documents);
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Vehicle Info', icon: Car },
    { number: 3, title: 'Documents', icon: FileText },
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-sm mt-2 ${
                        isActive ? 'text-blue-500 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('phone', {
                      required: 'Phone number is required',
                      minLength: {
                        value: 10,
                        message: 'Phone number must be at least 10 digits',
                      },
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+7 777 123 4567"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('licenseNumber', {
                      required: 'License number is required',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="AB1234567"
                  />
                  {errors.licenseNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.licenseNumber.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('licenseExpiry', {
                      required: 'License expiry date is required',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.licenseExpiry && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.licenseExpiry.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Vehicle Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Vehicle Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('vehicleType', {
                      required: 'Vehicle type is required',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="van">Van</option>
                    <option value="minibus">Minibus</option>
                  </select>
                  {errors.vehicleType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.vehicleType.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('vehicleMake', {
                      required: 'Vehicle make is required',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Toyota"
                  />
                  {errors.vehicleMake && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.vehicleMake.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('vehicleModel', {
                      required: 'Vehicle model is required',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Camry"
                  />
                  {errors.vehicleModel && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.vehicleModel.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('vehicleYear', {
                      required: 'Vehicle year is required',
                      min: {
                        value: 1990,
                        message: 'Year must be 1990 or later',
                      },
                      max: {
                        value: new Date().getFullYear() + 1,
                        message: 'Invalid year',
                      },
                      valueAsNumber: true,
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2020"
                  />
                  {errors.vehicleYear && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.vehicleYear.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Color
                  </label>
                  <input
                    type="text"
                    {...register('vehicleColor')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="White"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('licensePlate', {
                      required: 'License plate is required',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC 123"
                  />
                  {errors.licensePlate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.licensePlate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Documents</h2>

              <DocumentUploader
                driverId={tempDriverId || 'temp'}
                onUploadComplete={handleDocumentUpload}
                initialDocuments={watchedDocuments}
              />

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Registration Options
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('autoApprove')}
                      className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Auto-approve driver (skip manual review)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('sendCredentials')}
                      className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Send login credentials via WhatsApp/SMS/Email
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Register Driver
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {showSuccess && credentials && (
        <SuccessModal
          driverId={credentials.driverId}
          password={credentials.password}
          expiresAt={credentials.expiresAt}
          onClose={() => {
            setShowSuccess(false);
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}
