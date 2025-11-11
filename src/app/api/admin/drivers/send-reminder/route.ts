import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getClientIp, getUserAgent } from '@/lib/admin/middleware';
import { sendDriverReminder } from '@/lib/admin/messaging';
import { logAdminAction, AdminActions } from '@/lib/admin/audit';
import { z } from 'zod';

// Validation schema
const reminderSchema = z.object({
  driverId: z.string(),
});

// POST /api/admin/drivers/send-reminder - Send reminder to driver
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req, admin) => {
    try {
      const body = await req.json();
      const validatedData = reminderSchema.parse(body);
      
      // Get driver details
      const driver = await prisma.driver.findUnique({
        where: { id: validatedData.driverId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              lastLoginAt: true,
            },
          },
        },
      });
      
      if (!driver) {
        return NextResponse.json(
          {
            success: false,
            error: 'Driver not found',
          },
          { status: 404 }
        );
      }
      
      // Check if driver has already logged in
      if (driver.user.lastLoginAt) {
        return NextResponse.json(
          {
            success: false,
            error: 'Driver has already logged in',
            message: 'This driver has already accessed their account',
          },
          { status: 400 }
        );
      }
      
      // Send reminder
      const deliveryResults = await sendDriverReminder(
        driver.user.name,
        driver.driverId,
        driver.user.phone || '',
        driver.user.email
      );
      
      // Log credential deliveries
      for (const deliveryResult of deliveryResults) {
        await prisma.driverCredentialDelivery.create({
          data: {
            driverId: driver.id,
            userId: driver.user.id,
            channel: deliveryResult.channel,
            recipient:
              deliveryResult.channel === 'email'
                ? driver.user.email || ''
                : driver.user.phone || '',
            status: deliveryResult.success ? 'sent' : 'failed',
            messageId: deliveryResult.messageId,
            credentials: {
              driverId: driver.driverId,
              reminder: true,
            },
            sentAt: deliveryResult.success ? new Date() : null,
            deliveredAt: deliveryResult.success ? new Date() : null,
            failedAt: !deliveryResult.success ? new Date() : null,
            errorMessage: deliveryResult.error,
          },
        });
      }
      
      // Log admin action
      await logAdminAction(
        admin.id,
        AdminActions.CREDENTIALS_RESENT,
        'driver',
        driver.id,
        {
          channels: deliveryResults.map((r) => r.channel),
          successful: deliveryResults.filter((r) => r.success).length,
          failed: deliveryResults.filter((r) => !r.success).length,
        },
        getClientIp(req),
        getUserAgent(req)
      );
      
      // Calculate success rate
      const successCount = deliveryResults.filter((r) => r.success).length;
      const totalCount = deliveryResults.length;
      
      return NextResponse.json({
        success: successCount > 0,
        data: {
          sent: successCount,
          failed: totalCount - successCount,
          channels: deliveryResults.map((r) => ({
            channel: r.channel,
            success: r.success,
            error: r.error,
          })),
        },
        message:
          successCount > 0
            ? 'Reminder sent successfully'
            : 'Failed to send reminder',
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send reminder',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}
