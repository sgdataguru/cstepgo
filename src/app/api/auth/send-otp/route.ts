/**
 * API Route: Send OTP
 * POST /api/auth/send-otp
 * Sends OTP code to email or phone number
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  generateOTP, 
  generateOTPExpiry, 
  isValidEmail, 
  isValidPhone,
  sanitizeContact 
} from '@/lib/auth-utils';
import { sendOTP } from '@/lib/otp-service';

// Rate limiting - in production, use Redis or a proper rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(contact: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(contact);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(contact, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 minutes
    return true;
  }
  
  if (limit.count >= 3) {
    return false; // Max 3 attempts per 15 minutes
  }
  
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact, type } = body;

    // Validate input
    if (!contact || !type) {
      return NextResponse.json(
        { success: false, error: 'Contact and type are required' },
        { status: 400 }
      );
    }

    // Validate contact format
    if (type === 'email' && !isValidEmail(contact)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (type === 'sms' && !isValidPhone(contact)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Sanitize contact
    const sanitizedContact = sanitizeContact(contact, type === 'email' ? 'email' : 'phone');

    // Rate limiting
    if (!checkRateLimit(sanitizedContact)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many attempts. Please try again in 15 minutes.' 
        },
        { status: 429 }
      );
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = generateOTPExpiry();

    // Store OTP in database
    await prisma.oTP.create({
      data: {
        contact: sanitizedContact,
        code,
        type: type === 'email' ? 'EMAIL' : 'SMS',
        purpose: 'REGISTRATION',
        expiresAt,
      },
    });

    // Send OTP
    const sent = await sendOTP({
      contact: sanitizedContact,
      code,
      type,
    });

    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${type === 'email' ? 'email' : 'phone'}`,
      data: {
        expiresAt,
      },
    });

  } catch (error) {
    console.error('[Send OTP] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
