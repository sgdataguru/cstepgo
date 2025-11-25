import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { UpdateActivitySchema } from '@/lib/validations/activitySchemas';
import {
  getActivity,
  updateActivity,
  deleteActivity,
} from '@/lib/services/activityService';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: { id: string };
};

/**
 * GET /api/activities/[id]
 * Get activity details
 * Requires: ACTIVITY_OWNER role
 */
export const GET = withRole('ACTIVITY_OWNER')(
  async (req: NextRequest, user, context: RouteContext) => {
    try {
      const activityId = context.params.id;
      
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
      
      // Get activity (with ownership verification)
      const activity = await getActivity(activityId, activityOwner.id);
      
      if (!activity) {
        return NextResponse.json(
          { error: 'Activity not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        activity,
      });
    } catch (error: any) {
      console.error('Error fetching activity:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch activity' },
        { status: 500 }
      );
    }
  }
);

/**
 * PUT /api/activities/[id]
 * Update activity
 * Requires: ACTIVITY_OWNER role
 */
export const PUT = withRole('ACTIVITY_OWNER')(
  async (req: NextRequest, user, context: RouteContext) => {
    try {
      const activityId = context.params.id;
      const body = await req.json();
      
      // Validate input
      const validatedData = UpdateActivitySchema.parse(body);
      
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
      
      // Update activity
      const activity = await updateActivity(
        activityId,
        activityOwner.id,
        validatedData
      );
      
      return NextResponse.json({
        success: true,
        message: 'Activity updated successfully',
        activity: {
          id: activity.id,
          title: activity.title,
          status: activity.status,
          updatedAt: activity.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating activity:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      
      if (error.message === 'Activity not found or unauthorized') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to update activity' },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/activities/[id]
 * Delete or archive activity
 * Requires: ACTIVITY_OWNER role
 */
export const DELETE = withRole('ACTIVITY_OWNER')(
  async (req: NextRequest, user, context: RouteContext) => {
    try {
      const activityId = context.params.id;
      
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
      
      // Delete activity
      const result = await deleteActivity(activityId, activityOwner.id);
      
      return NextResponse.json({
        success: true,
        message: result.archived
          ? 'Activity archived (has bookings)'
          : 'Activity deleted successfully',
        archived: result.archived,
      });
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      
      if (error.message === 'Activity not found or unauthorized') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to delete activity' },
        { status: 500 }
      );
    }
  }
);
