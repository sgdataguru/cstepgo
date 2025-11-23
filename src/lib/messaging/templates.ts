import { DriverCredentials } from '../auth/credentials';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface CredentialMessage {
  whatsapp: string;
  sms: string;
  email: EmailTemplate;
}

/**
 * Get credential message templates for all channels
 */
export function getCredentialMessage(
  credentials: DriverCredentials,
  driverName: string
): CredentialMessage {
  const { driverId, tempPassword, loginUrl } = credentials;
  const supportPhone = process.env.SUPPORT_PHONE || '+996 555 000 000';
  
  const whatsappMessage = `Welcome to StepperGO! 🚗

Your driver account has been created:

Login URL: ${loginUrl}
Driver ID: ${driverId}
Temporary Password: ${tempPassword}

⚠️ Please change your password after first login.

Need help? Contact support: ${supportPhone}`;

  const smsMessage = `StepperGO Driver Account Created
Login: ${loginUrl}
ID: ${driverId}
Pass: ${tempPassword}
Change password after first login.
Support: ${supportPhone}`;

  const emailTemplate: EmailTemplate = {
    subject: 'Welcome to StepperGO - Your Driver Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .logo { width: 200px; margin-bottom: 20px; }
            .credentials-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .credential-row { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #555; }
            .credential-value { color: #000; font-size: 16px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #14b8a6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome, ${driverName}!</h2>
            <p>Your driver account has been successfully created. Here are your login credentials:</p>
            
            <div class="credentials-box">
              <div class="credential-row">
                <div class="credential-label">Login URL:</div>
                <div class="credential-value"><a href="${loginUrl}">${loginUrl}</a></div>
              </div>
              <div class="credential-row">
                <div class="credential-label">Driver ID:</div>
                <div class="credential-value">${driverId}</div>
              </div>
              <div class="credential-row">
                <div class="credential-label">Temporary Password:</div>
                <div class="credential-value">${tempPassword}</div>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Please change your password after first login for security reasons.
            </div>
            
            <a href="${loginUrl}" class="button">Login to Your Account</a>
            
            <p>If you have any questions or need assistance, please contact our support team at ${supportPhone}</p>
            
            <div class="footer">
              <p>This is an automated message from StepperGO. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} StepperGO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to StepperGO!

Your driver account has been created, ${driverName}.

Login URL: ${loginUrl}
Driver ID: ${driverId}
Temporary Password: ${tempPassword}

IMPORTANT: Please change your password after first login.

If you have any questions, contact support at ${supportPhone}

---
StepperGO © ${new Date().getFullYear()}
    `,
  };
  
  return { whatsapp: whatsappMessage, sms: smsMessage, email: emailTemplate };
}

/**
 * Get reminder message templates for drivers who haven't logged in
 */
export function getReminderMessage(
  credentials: DriverCredentials,
  driverName: string
): CredentialMessage {
  const { driverId, tempPassword, loginUrl } = credentials;
  const supportPhone = process.env.SUPPORT_PHONE || '+996 555 000 000';
  
  const whatsappMessage = `Hi ${driverName}! 👋

We noticed you haven't logged into your StepperGO driver account yet.

Your login credentials:
Login URL: ${loginUrl}
Driver ID: ${driverId}
Password: ${tempPassword}

Need help? Contact us: ${supportPhone}`;

  const smsMessage = `Hi ${driverName}, haven't seen you login yet!
URL: ${loginUrl}
ID: ${driverId}
Pass: ${tempPassword}
Help: ${supportPhone}`;

  const emailTemplate: EmailTemplate = {
    subject: 'Reminder: Login to Your StepperGO Driver Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${driverName}!</h2>
        <p>We noticed you haven't logged into your StepperGO driver account yet.</p>
        <p>Your login credentials are:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Driver ID:</strong> ${driverId}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
        </div>
        <p>If you're having trouble logging in or have any questions, please contact support at ${supportPhone}</p>
      </div>
    `,
    text: `Hi ${driverName}!

We noticed you haven't logged into your StepperGO driver account yet.

Login URL: ${loginUrl}
Driver ID: ${driverId}
Password: ${tempPassword}

Need help? Contact us at ${supportPhone}`,
  };
  
  return { whatsapp: whatsappMessage, sms: smsMessage, email: emailTemplate };
}
