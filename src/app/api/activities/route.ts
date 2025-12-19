import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { CreateActivitySchema } from '@/lib/validations/activitySchemas';
import { createActivity } from '@/lib/services/activityService';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/activities
 * List all published activities (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build where clause - use 'ACTIVE' status as per schema (or 'PUBLISHED' based on API convention)
    const where: any = {
      OR: [
        { status: 'ACTIVE' },
        { status: 'PUBLISHED' },
      ],
    };
    
    if (category) {
      where.category = category;
    }
    
    if (location) {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
      ];
    }
    
    // Fetch activities
    const activities = await prisma.activity.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            businessName: true,
            verificationStatus: true,
          },
        },
        photos: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
    
    // Get total count
    const totalCount = await prisma.activity.count({ where });
    
    return NextResponse.json({
      success: true,
      data: activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        category: activity.category,
        pricePerPerson: activity.pricePerPerson,
        currency: activity.currency,
        durationMinutes: activity.durationMinutes,
        maxParticipants: activity.maxParticipants,
        minParticipants: activity.minParticipants,
        city: activity.city,
        country: activity.country,
        address: activity.address,
        latitude: activity.latitude,
        longitude: activity.longitude,
        imageUrl: activity.photos?.[0]?.url || null,
        rating: activity.averageRating,
        reviewCount: activity.reviewCount,
        totalBookings: activity.totalBookings,
        status: activity.status,
        owner: activity.owner,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + activities.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

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
