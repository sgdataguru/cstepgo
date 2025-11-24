import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/services/otpService';
import { z } from 'zod';

const otpRequestSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  channel: z.enum(['SMS', 'WHATSAPP']).optional().default('SMS'),
});

/**
 * POST /api/otp/send - Send OTP to phone number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = otpRequestSchema.parse(body);

    const result = await sendOTP(validated.phone, validated.channel);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Send OTP error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/otp/send - Get endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Send OTP endpoint',
    method: 'POST',
    body: {
      phone: 'string - Phone number in international format',
      channel: 'string - SMS or WHATSAPP (default: SMS)',
    },
    response: {
      success: 'boolean',
      message: 'string',
      expiresAt: 'string - ISO datetime',
    },
  });
}
