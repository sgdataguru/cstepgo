import { messageTemplates, formatPhoneNumber } from './messageTemplates';

export interface MessageDeliveryResult {
  success: boolean;
  channel: 'whatsapp' | 'sms' | 'email';
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp message using Twilio
 * @param phone Phone number
 * @param message Message content
 * @returns Delivery result
 */
export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<MessageDeliveryResult> {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(phone);
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    // Twilio API call
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: whatsappNumber,
          To: `whatsapp:${formattedPhone}`,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send WhatsApp message');
    }

    return {
      success: true,
      channel: 'whatsapp',
      messageId: data.sid,
    };
  } catch (error) {
    console.error('WhatsApp delivery failed:', error);
    return {
      success: false,
      channel: 'whatsapp',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS using Twilio as fallback
 * @param phone Phone number
 * @param message Message content
 * @returns Delivery result
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<MessageDeliveryResult> {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(phone);
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioNumber) {
      throw new Error('Twilio phone number not configured');
    }

    // Twilio API call
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioNumber,
          To: formattedPhone,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send SMS');
    }

    return {
      success: true,
      channel: 'sms',
      messageId: data.sid,
    };
  } catch (error) {
    console.error('SMS delivery failed:', error);
    return {
      success: false,
      channel: 'sms',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email using Resend
 * @param email Email address
 * @param subject Email subject
 * @param html Email HTML content
 * @returns Delivery result
 */
export async function sendEmail(
  email: string,
  subject: string,
  html: string
): Promise<MessageDeliveryResult> {
  try {
    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'noreply@steppergo.com';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return {
      success: true,
      channel: 'email',
      messageId: data.id,
    };
  } catch (error) {
    console.error('Email delivery failed:', error);
    return {
      success: false,
      channel: 'email',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send driver credentials via multiple channels with fallback
 * @param driverName Driver's name
 * @param driverId Driver ID
 * @param password Temporary password
 * @param phone Phone number for WhatsApp/SMS
 * @param email Optional email address
 * @returns Array of delivery results
 */
export async function sendDriverCredentials(
  driverName: string,
  driverId: string,
  password: string,
  phone: string,
  email?: string
): Promise<MessageDeliveryResult[]> {
  const results: MessageDeliveryResult[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://steppergo.com';

  // Try WhatsApp first (primary channel)
  const whatsappMessage = messageTemplates.whatsapp.credentials(
    driverName,
    driverId,
    password
  );
  const whatsappResult = await sendWhatsApp(phone, whatsappMessage);
  results.push(whatsappResult);

  // If WhatsApp fails, try SMS fallback
  if (!whatsappResult.success) {
    const smsMessage = messageTemplates.sms.credentials(
      driverName,
      driverId,
      password
    );
    const smsResult = await sendSMS(phone, smsMessage);
    results.push(smsResult);
  }

  // Send email if provided
  if (email) {
    const emailHtml = messageTemplates.email.credentials(
      driverName,
      driverId,
      password,
      appUrl
    );
    const emailResult = await sendEmail(
      email,
      messageTemplates.email.subject,
      emailHtml
    );
    results.push(emailResult);
  }

  return results;
}

/**
 * Send reminder to driver
 * @param driverName Driver's name
 * @param driverId Driver ID
 * @param phone Phone number
 * @param email Optional email address
 * @returns Array of delivery results
 */
export async function sendDriverReminder(
  driverName: string,
  driverId: string,
  phone: string,
  email?: string
): Promise<MessageDeliveryResult[]> {
  const results: MessageDeliveryResult[] = [];

  // Try WhatsApp first
  const whatsappMessage = messageTemplates.whatsapp.reminder(driverName, driverId);
  const whatsappResult = await sendWhatsApp(phone, whatsappMessage);
  results.push(whatsappResult);

  // If WhatsApp fails, try SMS
  if (!whatsappResult.success) {
    const smsMessage = messageTemplates.sms.reminder(driverName, driverId);
    const smsResult = await sendSMS(phone, smsMessage);
    results.push(smsResult);
  }

  return results;
}
