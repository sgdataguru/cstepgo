/**
 * Mock SendGrid Integration
 * Replace with real SendGrid when API key is available
 */

import { EmailTemplate } from './templates';
import { DeliveryStatus, MessageResult } from './twilio';

/**
 * Send email via SendGrid
 * @param to - Recipient email address
 * @param template - Email template with subject and body
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<MessageResult> {
  try {
    console.log('✉️ [MOCK] Sending email to:', to);
    console.log('Subject:', template.subject);
    console.log('Body (text):', template.text);
    
    // TODO: Replace with real SendGrid integration
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to,
    //   from: process.env.SENDGRID_FROM_EMAIL,
    //   subject: template.subject,
    //   text: template.text,
    //   html: template.html,
    // };
    // await sgMail.send(msg);
    
    // Mock successful delivery
    return {
      status: DeliveryStatus.SENT,
      messageId: `mock_email_${Date.now()}`,
    };
  } catch (error) {
    console.error('Email delivery failed:', error);
    return {
      status: DeliveryStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
