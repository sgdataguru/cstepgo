import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { ToggleStatusSchema } from '@/lib/validations/activitySchemas';
import { toggleActivityStatus } from '@/lib/services/activityService';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: { id: string };
};

/**
 * POST /api/activities/[id]/toggle-status
 * Toggle activity status between ACTIVE and INACTIVE
 * Requires: ACTIVITY_OWNER role
 */
export const POST = withRole('ACTIVITY_OWNER')(
  async (req: NextRequest, user, context: RouteContext) => {
    try {
      const activityId = context.params.id;
      const body = await req.json();
      
      // Validate input
      const { status } = ToggleStatusSchema.parse(body);
      
      // Get activity owner profile
      const activityOwner = await prisma.activityOwner.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      
      if (!activityOwner) {
        return NextResponse.json(
          { error: 'Activity owner profile not found' },
          { status: 404 }
        );
      }
      
      // Toggle status
      const activity = await toggleActivityStatus(
        activityId,
        activityOwner.id,
        status
      );
      
      return NextResponse.json({
        success: true,
        message: `Activity ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
        newStatus: activity.status,
      });
    } catch (error: any) {
      console.error('Error toggling activity status:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid status value', details: error.errors },
          { status: 400 }
        );
      }
      
      if (
        error.message === 'Activity not found or unauthorized' ||
        error.message === 'Cannot activate activity pending approval'
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('unauthorized') ? 404 : 403 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to toggle activity status' },
        { status: 500 }
      );
    }
  }
);
