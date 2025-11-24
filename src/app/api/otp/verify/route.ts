import { NextRequest, NextResponse } from 'next/server';
import { verifyOTPCode } from '@/lib/services/otpService';
import { z } from 'zod';

const otpVerifySchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

/**
 * POST /api/otp/verify - Verify OTP code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = otpVerifySchema.parse(body);

    const result = await verifyOTPCode(validated.phone, validated.code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/otp/verify - Get endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Verify OTP endpoint',
    method: 'POST',
    body: {
      phone: 'string - Phone number in international format',
      code: 'string - 6-digit OTP code',
    },
    response: {
      success: 'boolean',
      message: 'string',
    },
  });
}
