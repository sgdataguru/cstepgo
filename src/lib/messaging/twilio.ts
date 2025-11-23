/**
 * Mock Twilio Integration
 * Replace with real Twilio when credentials are available
 */

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
    console.log('📱 [MOCK] Sending WhatsApp message to:', phone);
    console.log('Message:', message);
    
    // TODO: Replace with real Twilio integration
    // const twilioClient = twilio(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );
    // const result = await twilioClient.messages.create({
    //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    //   to: `whatsapp:${phone}`,
    //   body: message,
    // });
    
    // Mock successful delivery
    return {
      status: DeliveryStatus.SENT,
      messageId: `mock_wa_${Date.now()}`,
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
    console.log('📧 [MOCK] Sending SMS to:', phone);
    console.log('Message:', message);
    
    // TODO: Replace with real Twilio integration
    // const twilioClient = twilio(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );
    // const result = await twilioClient.messages.create({
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone,
    //   body: message,
    // });
    
    // Mock successful delivery
    return {
      status: DeliveryStatus.SENT,
      messageId: `mock_sms_${Date.now()}`,
    };
  } catch (error) {
    console.error('SMS delivery failed:', error);
    return {
      status: DeliveryStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
