/**
 * API Route: Verify OTP
 * POST /api/auth/verify-otp
 * Verifies the OTP code provided by the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isOTPExpired, sanitizeContact } from '@/lib/auth-utils';
import { isValidOTPFormat } from '@/lib/otp-service';

const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact, code, type } = body;

    // Validate input
    if (!contact || !code || !type) {
      return NextResponse.json(
        { success: false, error: 'Contact, code, and type are required' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!isValidOTPFormat(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Sanitize contact
    const sanitizedContact = sanitizeContact(contact, type === 'email' ? 'email' : 'phone');

    // Find the most recent OTP for this contact
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        contact: sanitizedContact,
        type: type === 'email' ? 'EMAIL' : 'SMS',
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'No OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP code
    if (otpRecord.code !== code) {
      // Increment attempts
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid OTP code. ${remainingAttempts} attempts remaining.` 
        },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { 
        verified: true,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        contact: sanitizedContact,
        type: otpRecord.type,
      },
    });

  } catch (error) {
    console.error('[Verify OTP] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
