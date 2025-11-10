/**
 * Authentication Utilities
 * JWT token generation, session management, and security helpers
 */

import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const SESSION_EXPIRY_DAYS = 7;

/**
 * Generate a secure random OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate OTP expiration time (5 minutes from now)
 */
export function generateOTPExpiry(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return nanoid(64);
}

/**
 * Generate session expiration date
 */
export function generateSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Simple JWT-like token encoding (for demo purposes)
 * In production, use a proper JWT library like 'jsonwebtoken'
 */
export function encodeToken(payload: Record<string, unknown>): string {
  const data = JSON.stringify(payload);
  return Buffer.from(data).toString('base64');
}

/**
 * Simple JWT-like token decoding (for demo purposes)
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const data = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if it has 10-15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneE164(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('7') && digitsOnly.length === 11) {
    // Kazakhstan number
    return `+${digitsOnly}`;
  }
  if (!digitsOnly.startsWith('+')) {
    return `+${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Sanitize contact information
 */
export function sanitizeContact(contact: string, type: 'email' | 'phone'): string {
  if (type === 'email') {
    return contact.trim().toLowerCase();
  }
  return formatPhoneE164(contact.trim());
}

/**
 * Hash password (placeholder - use bcrypt in production)
 */
export async function hashPassword(password: string): Promise<string> {
  // This is a placeholder - in production, use bcrypt
  return Buffer.from(password).toString('base64');
}

/**
 * Verify password (placeholder - use bcrypt in production)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // This is a placeholder - in production, use bcrypt
  return Buffer.from(password).toString('base64') === hash;
}
