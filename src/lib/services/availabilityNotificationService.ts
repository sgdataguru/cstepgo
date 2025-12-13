import { prisma } from '@/lib/prisma';


interface NotificationRecipient {
  userId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

/**
 * Service to handle notifications for driver availability changes
 */
export class AvailabilityNotificationService {
  /**
   * Notify passengers when their assigned driver changes availability
   */
  static async notifyPassengersOfDriverChange(
    driverId: string,
    newStatus: string,
    reason?: string
  ): Promise<{ notified: number }> {
    try {
      // Find active trips for this driver
      const activeTrips = await prisma.trip.findMany({
        where: {
          driverId,
          status: {
            in: ['PUBLISHED', 'OFFERED', 'IN_PROGRESS']
          },
          departureTime: {
            gte: new Date()
          }
        },
        include: {
          bookings: {
            where: {
              status: {
                in: ['CONFIRMED', 'PENDING']
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true
                }
              }
            }
          },
          driver: {
            select: {
              driverId: true,
              fullName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Collect unique passengers
      const passengers = new Map<string, NotificationRecipient>();
      
      for (const trip of activeTrips) {
        for (const booking of trip.bookings) {
          passengers.set(booking.user.id, {
            userId: booking.user.id,
            name: booking.user.name,
            phone: booking.user.phone,
            email: booking.user.email
          });
        }
      }
      
      // Only notify if driver went offline or busy and has active trips
      if ((newStatus === 'OFFLINE' || newStatus === 'BUSY') && passengers.size > 0) {
        const driverName = activeTrips[0]?.driver?.fullName || activeTrips[0]?.driver?.user.name || 'Your driver';
        
        const message = newStatus === 'OFFLINE'
          ? `${driverName} is currently offline. ${reason ? reason : 'They will be back online soon.'}`
          : `${driverName} is currently busy. They will update you soon.`;
        
        // Create notifications for each passenger
        for (const passenger of passengers.values()) {
          await this.createNotification({
            userId: passenger.userId,
            type: 'driver_availability_change',
            channel: 'app',
            recipient: passenger.email || passenger.phone || '',
            subject: 'Driver Status Update',
            body: message,
            metadata: {
              driverId,
              newStatus,
              reason,
              tripIds: activeTrips.map(t => t.id)
            }
          });
          
          // If email or phone available, also send via those channels
          if (passenger.email) {
            await this.createNotification({
              userId: passenger.userId,
              type: 'driver_availability_change',
              channel: 'email',
              recipient: passenger.email,
              subject: 'Driver Status Update',
              body: message,
              metadata: {
                driverId,
                newStatus
              }
            });
          }
          
          if (passenger.phone) {
            await this.createNotification({
              userId: passenger.userId,
              type: 'driver_availability_change',
              channel: 'sms',
              recipient: passenger.phone,
              subject: 'Driver Status Update',
              body: message,
              metadata: {
                driverId,
                newStatus
              }
            });
          }
        }
        
        return { notified: passengers.size };
      }
      
      return { notified: 0 };
      
    } catch (error) {
      console.error('Error notifying passengers of driver change:', error);
      throw error;
    }
  }
  
  /**
   * Notify admin when driver goes offline unexpectedly
   */
  static async notifyAdminOfUnexpectedOffline(
    driverId: string,
    driverName: string,
    activeTripsCount: number
  ): Promise<void> {
    try {
      // Find admin users
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN'
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
      
      const message = `Driver ${driverName} (${driverId}) went offline unexpectedly with ${activeTripsCount} active trip(s).`;
      
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.id,
          type: 'driver_offline_alert',
          channel: 'email',
          recipient: admin.email,
          subject: 'Driver Offline Alert',
          body: message,
          metadata: {
            driverId,
            driverName,
            activeTripsCount,
            priority: 'high'
          }
        });
      }
    } catch (error) {
      console.error('Error notifying admin of unexpected offline:', error);
    }
  }
  
  /**
   * Create a notification record
   */
  private static async createNotification(data: {
    userId: string;
    type: string;
    channel: string;
    recipient: string;
    subject: string;
    body: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          channel: data.channel,
          recipient: data.recipient,
          subject: data.subject,
          body: data.body,
          status: 'pending',
          createdAt: new Date(),
          // Note: Notification model doesn't have metadata field in current schema
          // Consider adding it if needed for future use
        }
      });
      
      // TODO: Integrate with actual notification delivery services
      // - Email: Postmark, SendGrid, etc.
      // - SMS: Twilio, etc.
      // - Push: Firebase Cloud Messaging, etc.
      
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  /**
   * Send real-time WebSocket notification
   * This would integrate with a WebSocket server
   */
  static async sendRealtimeNotification(
    userId: string,
    event: string,
    data: any
  ): Promise<void> {
    // TODO: Implement WebSocket integration
    // This could use Socket.io, Pusher, or custom WebSocket server
    
    console.log(`[WebSocket] Sending to user ${userId}:`, {
      event,
      data
    });
    
    // Example with Socket.io:
    // io.to(`user_${userId}`).emit(event, data);
  }
}
