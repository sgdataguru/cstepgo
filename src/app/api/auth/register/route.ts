/**
 * API Route: Complete Registration
 * POST /api/auth/register
 * Complete user registration after OTP verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  generateSessionToken, 
  generateSessionExpiry,
  sanitizeContact,
  isValidEmail
} from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact, type, name, preferredLanguage } = body;

    // Validate input
    if (!contact || !type || !name) {
      return NextResponse.json(
        { success: false, error: 'Contact, type, and name are required' },
        { status: 400 }
      );
    }

    // Sanitize contact
    const sanitizedContact = sanitizeContact(contact, type === 'email' ? 'email' : 'phone');

    // Verify that OTP was verified
    const verifiedOTP = await prisma.oTP.findFirst({
      where: {
        contact: sanitizedContact,
        type: type === 'email' ? 'EMAIL' : 'SMS',
        verified: true,
        verifiedAt: {
          // Within last 10 minutes
          gte: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
      orderBy: {
        verifiedAt: 'desc',
      },
    });

    if (!verifiedOTP) {
      return NextResponse.json(
        { success: false, error: 'Please verify your contact information first' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: type === 'email' 
        ? { email: sanitizedContact }
        : { phone: sanitizedContact },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this contact' },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: type === 'email' ? sanitizedContact : `user${Date.now()}@steppergo.com`,
        phone: type === 'sms' ? sanitizedContact : null,
        name,
        preferredLanguage: preferredLanguage || 'en',
        emailVerified: type === 'email',
        phoneVerified: type === 'sms',
        role: 'PASSENGER',
      },
    });

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = generateSessionExpiry();

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    // Return user and session data
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        session: {
          userId: session.userId,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      },
    });

  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
