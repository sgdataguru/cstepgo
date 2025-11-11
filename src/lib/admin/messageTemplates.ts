/**
 * Message templates for driver credential delivery
 */

export const messageTemplates = {
  whatsapp: {
    credentials: (name: string, driverId: string, password: string) => `
🚗 Welcome to StepperGO, ${name}! 🎉

Your driver account has been created:

📱 Driver ID: ${driverId}
🔑 Temporary Password: ${password}

⚠️ Important:
• This password expires in 30 days
• You'll be asked to change it on first login
• Keep your credentials secure

👉 Download the StepperGO Driver App:
iOS: https://apps.apple.com/steppergo
Android: https://play.google.com/steppergo

Need help? Reply to this message or call support at +7 (727) 123-4567

Happy driving! 🚙
    `.trim(),
    
    reminder: (name: string, driverId: string) => `
Hi ${name}!

Reminder: Your StepperGO driver account is ready.

Driver ID: ${driverId}

Haven't logged in yet? Download the app and start earning today!

Need your password reset? Contact support.
    `.trim(),
  },

  sms: {
    credentials: (name: string, driverId: string, password: string) => `
StepperGO: Welcome ${name}! Your driver account is ready.
ID: ${driverId}
Password: ${password}
Expires in 30 days. Change on first login.
Download app: steppergo.com/driver
    `.trim(),
    
    reminder: (name: string, driverId: string) => `
StepperGO: Hi ${name}, your driver account ${driverId} is ready. Download the app to start earning!
    `.trim(),
  },

  email: {
    subject: 'Welcome to StepperGO - Your Driver Account is Ready! 🚗',
    
    credentials: (name: string, driverId: string, password: string, appUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00C2B0 0%, #4FACFE 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .credentials { background: #f8f9fa; border-left: 4px solid #00C2B0; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .credentials h3 { margin-top: 0; color: #00C2B0; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: 600; color: #666; }
    .credential-value { font-family: monospace; background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; font-size: 16px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning h4 { margin-top: 0; color: #856404; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #00C2B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Welcome to StepperGO!</h1>
      <p>Your Driver Account is Ready</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${name}</strong>,</p>
      
      <p>Congratulations! Your StepperGO driver account has been created and you're all set to start earning.</p>
      
      <div class="credentials">
        <h3>Your Login Credentials</h3>
        <div class="credential-item">
          <div class="credential-label">Driver ID:</div>
          <div class="credential-value">${driverId}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Temporary Password:</div>
          <div class="credential-value">${password}</div>
        </div>
      </div>
      
      <div class="warning">
        <h4>⚠️ Important Security Information</h4>
        <ul>
          <li>This is a temporary password that expires in <strong>30 days</strong></li>
          <li>You will be required to change your password on first login</li>
          <li>Never share your credentials with anyone</li>
          <li>Keep this email secure or delete it after changing your password</li>
        </ul>
      </div>
      
      <div class="cta">
        <a href="${appUrl}" class="button">Download Driver App</a>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Download the StepperGO Driver app from the App Store or Google Play</li>
        <li>Login with your Driver ID and temporary password</li>
        <li>Create a new secure password</li>
        <li>Complete your profile setup</li>
        <li>Start accepting rides!</li>
      </ol>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team:</p>
      <ul>
        <li>📞 Phone: +7 (727) 123-4567</li>
        <li>📧 Email: driver-support@steppergo.com</li>
        <li>💬 Live Chat: Available in the app</li>
      </ul>
      
      <p>We're excited to have you on board!</p>
      
      <p>Best regards,<br>The StepperGO Team</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} StepperGO. All rights reserved.</p>
      <p>This email contains sensitive information. Please handle it securely.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  },
};

/**
 * Format phone number to E.164 format for international messaging
 * @param phone Phone number
 * @param countryCode Default country code (e.g., 'KZ' for Kazakhstan)
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string, countryCode: string = 'KZ'): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (countryCode === 'KZ' && !cleaned.startsWith('7')) {
    cleaned = '7' + cleaned;
  }
  
  return '+' + cleaned;
}
