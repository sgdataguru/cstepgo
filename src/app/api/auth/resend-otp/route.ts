/**
 * API Route: Resend OTP
 * POST /api/auth/resend-otp
 * Resend OTP code to email or phone number
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  generateOTP, 
  generateOTPExpiry,
  sanitizeContact 
} from '@/lib/auth-utils';
import { sendOTP } from '@/lib/otp-service';

// Rate limiting for resend (stricter than initial send)
const resendLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkResendLimit(contact: string): boolean {
  const now = Date.now();
  const limit = resendLimitMap.get(contact);
  
  if (!limit || now > limit.resetAt) {
    resendLimitMap.set(contact, { count: 1, resetAt: now + 60 * 1000 }); // 1 minute
    return true;
  }
  
  if (limit.count >= 1) {
    return false; // Max 1 resend per minute
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

    // Sanitize contact
    const sanitizedContact = sanitizeContact(contact, type === 'email' ? 'email' : 'phone');

    // Check resend rate limit
    if (!checkResendLimit(sanitizedContact)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please wait before requesting another code' 
        },
        { status: 429 }
      );
    }

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = generateOTPExpiry();

    // Store new OTP in database
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
        { success: false, error: 'Failed to resend OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        expiresAt,
      },
    });

  } catch (error) {
    console.error('[Resend OTP] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
