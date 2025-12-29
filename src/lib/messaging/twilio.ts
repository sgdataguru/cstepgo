/**
 * Twilio Integration for SMS and WhatsApp
 * Real implementation using Twilio API
 */

import twilio from 'twilio';

export enum DeliveryStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}

export interface MessageResult {
  status: DeliveryStatus;
  messageId?: string;
  errorMessage?: string;
}

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
  }

  return twilio(accountSid, authToken);
};

/**
 * Send WhatsApp message via Twilio
 * @param phone - Phone number in E.164 format (e.g., +996555123456)
 * @param message - Message content
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<MessageResult> {
  try {
    console.log('📱 Sending WhatsApp message to:', phone);

    const client = getTwilioClient();
    const whatsappNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!whatsappNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable not set');
    }

    const result = await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${phone}`,
      body: message,
    });

    console.log('WhatsApp message sent successfully:', result.sid);

    return {
      status: DeliveryStatus.SENT,
      messageId: result.sid,
    };
  } catch (error) {
    console.error('WhatsApp delivery failed:', error);
    return {
      status: DeliveryStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS via Twilio
 * @param phone - Phone number in E.164 format
 * @param message - Message content
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<MessageResult> {
  try {
    console.log('📧 Sending SMS to:', phone);

    const client = getTwilioClient();
    const smsNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!smsNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable not set');
    }

    const result = await client.messages.create({
      from: smsNumber,
      to: phone,
      body: message,
    });

    console.log('SMS sent successfully:', result.sid);

    return {
      status: DeliveryStatus.SENT,
      messageId: result.sid,
    };
  } catch (error) {
    console.error('SMS delivery failed:', error);
    return {
      status: DeliveryStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
