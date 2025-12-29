/**
 * Postmark Email Integration
 * Real implementation using Postmark API
 */

import { ServerClient } from 'postmark';
import { EmailTemplate } from './templates';
import { DeliveryStatus, MessageResult } from './twilio';

// Initialize Postmark client
const getPostmarkClient = () => {
  const apiKey = process.env.POSTMARK_API_KEY;

  if (!apiKey) {
    throw new Error('Postmark API key not configured. Please set POSTMARK_API_KEY environment variable.');
  }

  return new ServerClient(apiKey);
};

/**
 * Send email via Postmark
 * @param to - Recipient email address
 * @param template - Email template with subject and body
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<MessageResult> {
  try {
    console.log('✉️ Sending email to:', to);
    console.log('Subject:', template.subject);

    const client = getPostmarkClient();
    const fromEmail = process.env.POSTMARK_FROM_EMAIL;

    if (!fromEmail) {
      throw new Error('POSTMARK_FROM_EMAIL environment variable not set');
    }

    const result = await client.sendEmail({
      From: fromEmail,
      To: to,
      Subject: template.subject,
      TextBody: template.text,
      HtmlBody: template.html,
      ReplyTo: process.env.POSTMARK_REPLY_TO || fromEmail,
    });

    console.log('Email sent successfully:', result.MessageID);

    return {
      status: DeliveryStatus.SENT,
      messageId: result.MessageID,
    };
  } catch (error) {
    console.error('Email delivery failed:', error);
    return {
      status: DeliveryStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
