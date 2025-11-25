import twilio from 'twilio';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// WhatsApp Configuration
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ENABLED = process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === 'true';

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;
const MIN_TIME_BETWEEN_OTP_SECONDS = 60; // 1 minute between OTP requests

// Initialize Twilio client (only if credentials are provided)
let twilioClient: ReturnType<typeof twilio> | null = null;
try {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && 
      TWILIO_ACCOUNT_SID !== 'dev' && TWILIO_AUTH_TOKEN !== 'dev') {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  } else {
    console.warn('Twilio credentials not configured. OTP service will run in mock mode.');
  }
} catch (error) {
  console.warn('Failed to initialize Twilio client:', error);
}

export interface OTPResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Rate limiting map to track OTP requests
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for phone number
 */
function checkRateLimit(phone: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const rateLimit = rateLimitMap.get(phone);

  if (!rateLimit || now > rateLimit.resetAt) {
    // Reset or create new limit
    rateLimitMap.set(phone, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, resetAt: rateLimit.resetAt };
  }

  rateLimit.count += 1;
  return { allowed: true };
}

/**
 * Generate a random OTP code using cryptographically secure random bytes
 */
function generateOTP(): string {
  // Use crypto.randomBytes for secure random number generation
  // Generate a number between 0 and 999999
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1000000;
  
  // Pad with leading zeros to ensure 6 digits
  return num.toString().padStart(OTP_LENGTH, '0');
}

/**
 * Hash OTP code for storage
 */
async function hashOTP(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

/**
 * Verify OTP code against hash
 */
async function verifyOTP(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Send OTP via SMS using Twilio
 */
async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio is not configured');
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return true;
  } catch (error) {
    console.error('Twilio SMS error:', error);
    throw new Error('Failed to send SMS');
  }
}

/**
 * Send OTP via WhatsApp using WhatsApp Business API
 */
async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp is not configured');
  }

  try {
    // Use WhatsApp Business API to send message
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    throw new Error('Failed to send WhatsApp message');
  }
}

/**
 * Generate and send OTP via SMS or WhatsApp
 */
export async function sendOTP(
  phone: string,
  channel: 'SMS' | 'WHATSAPP' = 'SMS'
): Promise<OTPResult> {
  try {
    // Check rate limit
    const rateLimit = checkRateLimit(phone);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil((rateLimit.resetAt! - Date.now()) / 1000);
      return {
        success: false,
        message: `Too many requests. Please try again in ${waitSeconds} seconds.`,
        error: 'RATE_LIMITED',
      };
    }

    // Check if there's a recent unverified OTP
    const existingOTP = await prisma.oTP.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOTP) {
      const secondsUntilExpiry = Math.ceil(
        (existingOTP.expiresAt.getTime() - Date.now()) / 1000
      );
      
      if (secondsUntilExpiry > (OTP_EXPIRY_MINUTES * 60) - MIN_TIME_BETWEEN_OTP_SECONDS) {
        // Less than MIN_TIME_BETWEEN_OTP_SECONDS since last OTP
        return {
          success: false,
          message: 'An OTP was recently sent. Please wait before requesting a new one.',
          error: 'TOO_SOON',
        };
      }
    }

    // Generate OTP
    const code = generateOTP();
    const codeHash = await hashOTP(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    await prisma.oTP.create({
      data: {
        phone,
        codeHash,
        expiresAt,
      },
    });

    // Send OTP based on channel
    const message = `Your StepperGO verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`;

    if (channel === 'WHATSAPP' && WHATSAPP_ENABLED) {
      await sendWhatsApp(phone, message);
    } else {
      await sendSMS(phone, message);
    }

    return {
      success: true,
      message: `OTP sent successfully via ${channel}`,
      expiresAt,
    };
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: error.message,
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTPCode(
  phone: string,
  code: string
): Promise<OTPResult> {
  try {
    // Find the most recent OTP for this phone
    const otp = await prisma.oTP.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return {
        success: false,
        message: 'OTP not found or expired. Please request a new one.',
        error: 'NOT_FOUND',
      };
    }

    // Check attempts
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        error: 'MAX_ATTEMPTS',
      };
    }

    // Verify code
    const isValid = await verifyOTP(code, otp.codeHash);

    if (!isValid) {
      // Increment attempts
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });

      const remainingAttempts = MAX_OTP_ATTEMPTS - (otp.attempts + 1);
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        error: 'INVALID_CODE',
      };
    }

    // Mark as verified
    await prisma.oTP.update({
      where: { id: otp.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.',
      error: error.message,
    };
  }
}

/**
 * Clean up expired OTPs (should be run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  try {
    const result = await prisma.oTP.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { verified: true, verifiedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    return result.count;
  } catch (error) {
    console.error('Cleanup OTPs error:', error);
    return 0;
  }
}

/**
 * Send driver credentials via SMS/WhatsApp
 */
export async function sendDriverCredentials(
  phone: string,
  driverId: string,
  tempPassword: string,
  loginUrl: string,
  channel: 'SMS' | 'WHATSAPP' = 'SMS'
): Promise<OTPResult> {
  try {
    const message = `Welcome to StepperGO!\n\nYour driver credentials:\nDriver ID: ${driverId}\nPassword: ${tempPassword}\n\nLogin: ${loginUrl}\n\nPlease change your password after first login.`;

    if (channel === 'WHATSAPP' && WHATSAPP_ENABLED) {
      await sendWhatsApp(phone, message);
    } else {
      await sendSMS(phone, message);
    }

    return {
      success: true,
      message: `Credentials sent successfully via ${channel}`,
    };
  } catch (error: any) {
    console.error('Send credentials error:', error);
    return {
      success: false,
      message: 'Failed to send credentials',
      error: error.message,
    };
  }
}

/**
 * Check if SMS/WhatsApp services are configured
 */
export function isMessagingConfigured(): {
  sms: boolean;
  whatsapp: boolean;
} {
  return {
    sms: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER),
    whatsapp: !!(WHATSAPP_API_KEY && WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ENABLED),
  };
}
