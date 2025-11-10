import { prisma } from '@/lib/prisma';

export interface AdminActionDetails {
  [key: string]: any;
}

/**
 * Log an admin action for audit purposes
 * @param adminId Admin user ID
 * @param action Action type
 * @param targetType Type of target entity
 * @param targetId Target entity ID
 * @param details Additional details
 * @param ipAddress IP address of the admin
 * @param userAgent User agent string
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: AdminActionDetails,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.adminActionLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details || {},
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break the main flow
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Get admin action logs with optional filters
 * @param filters Filter options
 * @returns Array of admin action logs
 */
export async function getAdminActionLogs(filters?: {
  adminId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.adminId) {
    where.adminId = filters.adminId;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.targetType) {
    where.targetType = filters.targetType;
  }

  if (filters?.targetId) {
    where.targetId = filters.targetId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const logs = await prisma.adminActionLog.findMany({
    where,
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  });

  return logs;
}

/**
 * Admin action types for type safety
 */
export const AdminActions = {
  DRIVER_REGISTERED: 'driver_registered',
  DRIVER_APPROVED: 'driver_approved',
  DRIVER_REJECTED: 'driver_rejected',
  DRIVER_SUSPENDED: 'driver_suspended',
  DRIVER_UPDATED: 'driver_updated',
  CREDENTIALS_SENT: 'credentials_sent',
  CREDENTIALS_RESENT: 'credentials_resent',
  PASSWORD_RESET: 'password_reset',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DELETED: 'document_deleted',
} as const;

export type AdminActionType = typeof AdminActions[keyof typeof AdminActions];
