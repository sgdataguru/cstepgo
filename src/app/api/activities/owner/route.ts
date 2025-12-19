import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { OwnerActivitiesQuerySchema } from '@/lib/validations/activitySchemas';
import { getOwnerActivities } from '@/lib/services/activityService';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - uses authentication headers
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/activities/owner
 * List all activities for the authenticated owner
 * Requires: ACTIVITY_OWNER role
 */
export const GET = withRole('ACTIVITY_OWNER')(async (req, user) => {
  try {
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
    const query = OwnerActivitiesQuerySchema.parse({
      status: searchParams.get('status') || 'ALL',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });
    
    // Get activities
    const result = await getOwnerActivities(activityOwner.id, query);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching owner activities:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activities' },
      { status: 500 }
    );
  }
});
