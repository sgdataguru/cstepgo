import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { CreateActivitySchema } from '@/lib/validations/activitySchemas';
import { createActivity } from '@/lib/services/activityService';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/activities
 * Create a new activity
 * Requires: ACTIVITY_OWNER role
 */
export const POST = withRole('ACTIVITY_OWNER')(async (req, user) => {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = CreateActivitySchema.parse(body);
    
    // Get activity owner profile
    const activityOwner = await prisma.activityOwner.findUnique({
      where: { userId: user.userId },
    });
    
    if (!activityOwner) {
      return NextResponse.json(
        { error: 'Activity owner profile not found. Please complete registration first.' },
        { status: 404 }
      );
    }
    
    // Check if owner is verified
    if (activityOwner.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { 
          error: 'Your account must be verified before creating activities',
          verificationStatus: activityOwner.verificationStatus 
        },
        { status: 403 }
      );
    }
    
    // Create the activity
    const activity = await createActivity(activityOwner.id, validatedData);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Activity created successfully',
        activity: {
          id: activity.id,
          title: activity.title,
          status: activity.status,
          createdAt: activity.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating activity:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create activity' },
      { status: 500 }
    );
  }
});
