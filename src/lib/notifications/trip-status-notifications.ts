/**
 * Trip Status Notification Service
 * Sends notifications to passengers when trip status changes
 */

import { TripStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '../messaging/email';
import { EmailTemplate } from '../messaging/templates';


export interface TripStatusNotificationContext {
  tripId: string;
  tripTitle: string;
  driverName: string;
  driverPhone?: string;
  previousStatus: TripStatus;
  newStatus: TripStatus;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  departureTime: Date;
  originName: string;
  destName: string;
}

/**
 * Get notification message based on status
 */
function getNotificationMessage(
  context: TripStatusNotificationContext,
  passengerName: string
): { subject: string; message: string; urgency: 'high' | 'medium' | 'low' } {
  const { newStatus, tripTitle, driverName, notes, originName, destName } = context;

  const messages: Record<
    TripStatus,
    { subject: string; message: string; urgency: 'high' | 'medium' | 'low' }
  > = {
    DEPARTED: {
      subject: `🚗 Your trip has departed - ${tripTitle}`,
      message: `Hi ${passengerName}! Your driver ${driverName} has departed and is on the way to pick you up from ${originName}.${notes ? `\n\nDriver's note: ${notes}` : ''}`,
      urgency: 'high',
    },
    EN_ROUTE: {
      subject: `🛣️ Driver is en route - ${tripTitle}`,
      message: `Hi ${passengerName}! Your driver ${driverName} is currently en route to ${originName}.${notes ? `\n\nUpdate: ${notes}` : ''}`,
      urgency: 'medium',
    },
    DRIVER_ARRIVED: {
      subject: `📍 Driver has arrived - ${tripTitle}`,
      message: `Hi ${passengerName}! Your driver ${driverName} has arrived at the pickup location (${originName}). Please head to the vehicle.${notes ? `\n\nDriver's note: ${notes}` : ''}`,
      urgency: 'high',
    },
    PASSENGERS_BOARDED: {
      subject: `✅ All passengers boarded - ${tripTitle}`,
      message: `Hi ${passengerName}! All passengers have boarded and your trip to ${destName} is about to begin.${notes ? `\n\n${notes}` : ''}`,
      urgency: 'medium',
    },
    IN_TRANSIT: {
      subject: `🚙 Trip in progress - ${tripTitle}`,
      message: `Hi ${passengerName}! Your trip to ${destName} is now in progress. Have a safe journey!${notes ? `\n\nUpdate: ${notes}` : ''}`,
      urgency: 'low',
    },
    DELAYED: {
      subject: `⏰ Trip delayed - ${tripTitle}`,
      message: `Hi ${passengerName}! We regret to inform you that your trip has been delayed. Your driver ${driverName} will keep you updated.${notes ? `\n\nReason: ${notes}` : ' Please contact the driver for more information.'}`,
      urgency: 'high',
    },
    ARRIVED: {
      subject: `🎯 Arrived at destination - ${tripTitle}`,
      message: `Hi ${passengerName}! You have arrived at ${destName}. We hope you enjoyed your trip!${notes ? `\n\n${notes}` : ''}`,
      urgency: 'medium',
    },
    COMPLETED: {
      subject: `✨ Trip completed - ${tripTitle}`,
      message: `Hi ${passengerName}! Your trip to ${destName} has been completed. Thank you for choosing StepperGO! We'd love to hear your feedback.${notes ? `\n\n${notes}` : ''}`,
      urgency: 'low',
    },
    CANCELLED: {
      subject: `❌ Trip cancelled - ${tripTitle}`,
      message: `Hi ${passengerName}! Unfortunately, your trip has been cancelled. Please check your email for refund details or contact support.${notes ? `\n\nReason: ${notes}` : ''}`,
      urgency: 'high',
    },
    // Default messages for other statuses
    DRAFT: {
      subject: `Trip update - ${tripTitle}`,
      message: `Hi ${passengerName}! There's an update regarding your trip.`,
      urgency: 'low',
    },
    PUBLISHED: {
      subject: `Trip update - ${tripTitle}`,
      message: `Hi ${passengerName}! There's an update regarding your trip.`,
      urgency: 'low',
    },
    OFFERED: {
      subject: `Trip update - ${tripTitle}`,
      message: `Hi ${passengerName}! There's an update regarding your trip.`,
      urgency: 'low',
    },
    FULL: {
      subject: `Trip update - ${tripTitle}`,
      message: `Hi ${passengerName}! There's an update regarding your trip.`,
      urgency: 'low',
    },
    IN_PROGRESS: {
      subject: `Trip update - ${tripTitle}`,
      message: `Hi ${passengerName}! Your trip is now in progress.`,
      urgency: 'medium',
    },
  };

  return messages[newStatus] || messages.DRAFT;
}

/**
 * Create email template for trip status notification
 */
function createEmailTemplate(
  context: TripStatusNotificationContext,
  passengerName: string
): EmailTemplate {
  const notificationData = getNotificationMessage(context, passengerName);
  const { tripTitle, driverName, driverPhone, newStatus, originName, destName } = context;
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@steppergo.com';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://steppergo.com';

  const statusIcons: Record<string, string> = {
    DEPARTED: '🚗',
    EN_ROUTE: '🛣️',
    DRIVER_ARRIVED: '📍',
    PASSENGERS_BOARDED: '✅',
    IN_TRANSIT: '🚙',
    DELAYED: '⏰',
    ARRIVED: '🎯',
    COMPLETED: '✨',
    CANCELLED: '❌',
  };

  const statusColors: Record<string, string> = {
    DEPARTED: '#14b8a6',
    EN_ROUTE: '#3b82f6',
    DRIVER_ARRIVED: '#10b981',
    PASSENGERS_BOARDED: '#8b5cf6',
    IN_TRANSIT: '#06b6d4',
    DELAYED: '#f59e0b',
    ARRIVED: '#10b981',
    COMPLETED: '#22c55e',
    CANCELLED: '#ef4444',
  };

  const icon = statusIcons[newStatus] || '📢';
  const color = statusColors[newStatus] || '#6b7280';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
            color: white; 
            padding: 30px 20px;
            text-align: center;
          }
          .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .header-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .content { 
            padding: 30px 20px; 
          }
          .trip-info {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            color: #111827;
            text-align: right;
          }
          .message-box {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: ${color};
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
            text-align: center;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .footer a {
            color: ${color};
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">${icon}</div>
            <h1 class="header-title">${notificationData.subject}</h1>
          </div>
          
          <div class="content">
            <p>Hi ${passengerName}!</p>
            <p>${notificationData.message}</p>
            
            <div class="trip-info">
              <div class="info-row">
                <span class="info-label">Trip:</span>
                <span class="info-value">${tripTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">From:</span>
                <span class="info-value">${originName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">To:</span>
                <span class="info-value">${destName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Driver:</span>
                <span class="info-value">${driverName}</span>
              </div>
              ${driverPhone ? `
              <div class="info-row">
                <span class="info-label">Contact:</span>
                <span class="info-value">${driverPhone}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value" style="color: ${color}; font-weight: 600;">${newStatus.replace(/_/g, ' ')}</span>
              </div>
            </div>
            
            <a href="${appUrl}/trips/${context.tripId}" class="button">View Trip Details</a>
            
            <p style="font-size: 14px; color: #6b7280;">
              If you have any questions, please contact support at <a href="mailto:${supportEmail}" style="color: ${color};">${supportEmail}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} StepperGO. All rights reserved.</p>
            <p>
              <a href="${appUrl}">Visit Website</a> | 
              <a href="${appUrl}/support">Support</a> | 
              <a href="${appUrl}/terms">Terms</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `${notificationData.subject}

${notificationData.message}

Trip Details:
- Trip: ${tripTitle}
- From: ${originName}
- To: ${destName}
- Driver: ${driverName}
${driverPhone ? `- Contact: ${driverPhone}` : ''}
- Status: ${newStatus.replace(/_/g, ' ')}

View trip details: ${appUrl}/trips/${context.tripId}

If you have any questions, contact support at ${supportEmail}

© ${new Date().getFullYear()} StepperGO. All rights reserved.
`;

  return {
    subject: notificationData.subject,
    html,
    text,
  };
}

/**
 * Send trip status notification to all passengers
 */
export async function notifyPassengersOfStatusChange(
  context: TripStatusNotificationContext
): Promise<{ success: boolean; notificationsSent: number; errors: string[] }> {
  const errors: string[] = [];
  let notificationsSent = 0;

  try {
    // Get all confirmed bookings for this trip
    const bookings = await prisma.booking.findMany({
      where: {
        tripId: context.tripId,
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (bookings.length === 0) {
      console.log('No confirmed passengers to notify for trip:', context.tripId);
      return { success: true, notificationsSent: 0, errors: [] };
    }

    // Send notification to each passenger
    for (const booking of bookings) {
      try {
        const emailTemplate = createEmailTemplate(context, booking.user.name);

        // Send email notification
        if (booking.user.email) {
          const emailResult = await sendEmail(booking.user.email, emailTemplate);
          
          if (emailResult.status === 'SENT') {
            notificationsSent++;
            
            // Store notification in database
            await prisma.notification.create({
              data: {
                userId: booking.user.id,
                type: 'TRIP_STATUS_UPDATE',
                channel: 'EMAIL',
                recipient: booking.user.email,
                subject: emailTemplate.subject,
                body: emailTemplate.text,
                status: 'SENT',
                sentAt: new Date(),
              },
            });
          } else {
            errors.push(`Failed to send email to ${booking.user.email}: ${emailResult.errorMessage}`);
          }
        }

        // TODO: Send SMS notification if phone number is available
        // TODO: Send WhatsApp notification if WhatsApp is enabled
        // TODO: Send push notification if mobile app is installed

      } catch (error) {
        const errorMsg = `Failed to notify passenger ${booking.user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      notificationsSent,
      errors,
    };
  } catch (error) {
    console.error('Error in notifyPassengersOfStatusChange:', error);
    return {
      success: false,
      notificationsSent,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Check if status change requires notification
 */
export function shouldNotifyPassengers(newStatus: TripStatus): boolean {
  const notifiableStatuses: TripStatus[] = [
    'DEPARTED',
    'EN_ROUTE',
    'DRIVER_ARRIVED',
    'PASSENGERS_BOARDED',
    'IN_TRANSIT',
    'DELAYED',
    'ARRIVED',
    'COMPLETED',
    'CANCELLED',
  ];

  return notifiableStatuses.includes(newStatus);
}
