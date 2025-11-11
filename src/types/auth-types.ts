/**
 * Authentication Types for OTP-based Registration Flow
 */

export type ContactMethod = 'email' | 'phone';

export type RegistrationStep = 
  | 'contact-method'
  | 'otp-verification'
  | 'basic-info'
  | 'wallet-setup'
  | 'complete';

export interface OTPRequest {
  contact: string;
  type: 'email' | 'sms';
  purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
}

export interface OTPVerification {
  contact: string;
  code: string;
  type: 'email' | 'sms';
}

export interface UserRegistration {
  contact: string;
  contactType: ContactMethod;
  name: string;
  preferredLanguage?: string;
  otpVerified: boolean;
}

export interface SessionData {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    session?: SessionData;
    user?: {
      id: string;
      email: string;
      phone: string | null;
      name: string;
      role: string;
    };
  };
  error?: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  data?: {
    expiresAt: Date;
    attemptsRemaining?: number;
  };
  error?: string;
}
