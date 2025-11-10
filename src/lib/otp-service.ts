/**
 * OTP Service
 * Handles sending OTP via email (Resend) and SMS (Twilio)
 */

// For now, we'll mock the services since we don't have actual API keys
// In production, integrate with Resend and Twilio

export interface SendOTPOptions {
  contact: string;
  code: string;
  type: 'email' | 'sms';
}

/**
 * Send OTP via email using Resend
 */
async function sendEmailOTP(email: string, code: string): Promise<boolean> {
  console.log(`[OTP Service] Sending email OTP to ${email}: ${code}`);
  
  // Mock implementation - in production, use Resend
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'StepperGO <noreply@steppergo.com>',
  //   to: email,
  //   subject: 'Your StepperGO Verification Code',
  //   html: `<p>Your verification code is: <strong>${code}</strong></p>
  //          <p>This code expires in 5 minutes.</p>`
  // });
  
  return true;
}

/**
 * Send OTP via SMS using Twilio
 */
async function sendSMSOTP(phone: string, code: string): Promise<boolean> {
  console.log(`[OTP Service] Sending SMS OTP to ${phone}: ${code}`);
  
  // Mock implementation - in production, use Twilio
  // const twilio = require('twilio');
  // const client = twilio(
  //   process.env.TWILIO_ACCOUNT_SID,
  //   process.env.TWILIO_AUTH_TOKEN
  // );
  // await client.messages.create({
  //   body: `Your StepperGO verification code is: ${code}. Valid for 5 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone
  // });
  
  return true;
}

/**
 * Send OTP code via appropriate channel
 */
export async function sendOTP(options: SendOTPOptions): Promise<boolean> {
  try {
    if (options.type === 'email') {
      return await sendEmailOTP(options.contact, options.code);
    } else {
      return await sendSMSOTP(options.contact, options.code);
    }
  } catch (error) {
    console.error('[OTP Service] Failed to send OTP:', error);
    return false;
  }
}

/**
 * Validate OTP format
 */
export function isValidOTPFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}
