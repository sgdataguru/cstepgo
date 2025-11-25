import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { ActivityBookingsQuerySchema } from '@/lib/validations/activitySchemas';
import { getActivityBookings } from '@/lib/services/activityService';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: { id: string };
};

/**
 * GET /api/activities/[id]/bookings
 * Get bookings for a specific activity
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
      
      // Parse query parameters
      const { searchParams } = new URL(req.url);
      const query = ActivityBookingsQuerySchema.parse({
        status: searchParams.get('status') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
      });
      
      // Get bookings
      const result = await getActivityBookings(
        activityId,
        activityOwner.id,
        query
      );
      
      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error fetching activity bookings:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
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
        { error: error.message || 'Failed to fetch bookings' },
        { status: 500 }
      );
    }
  }
);
