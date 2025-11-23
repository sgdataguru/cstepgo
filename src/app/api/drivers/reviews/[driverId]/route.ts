import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/drivers/[id]/reviews
 * Fetch driver reviews with pagination and statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || 'recent'; // 'recent' or 'rating'

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit)); // Max 50 per page

    // Build sort order
    const orderBy: any = sort === 'rating' 
      ? [{ rating: 'desc' }, { createdAt: 'desc' }]
      : { createdAt: 'desc' };

    // Fetch reviews with pagination
    const [reviews, totalReviews] = await Promise.all([
      prisma.review.findMany({
        where: { driverId: id },
        orderBy,
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      prisma.review.count({
        where: { driverId: id },
      }),
    ]);

    // Calculate review statistics
    const [ratingStats, driver] = await Promise.all([
      prisma.review.groupBy({
        by: ['rating'],
        where: { driverId: id },
        _count: { rating: true },
      }),
      prisma.driver.findUnique({
        where: { id },
        select: {
          rating: true,
          reviewCount: true,
        },
      }),
    ]);

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Build rating distribution
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingStats.forEach((stat: any) => {
      distribution[stat.rating] = stat._count.rating;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalReviews / validLimit);

    // Format response
    const response = {
      reviews: reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        tripId: review.tripId,
        reviewer: {
          name: review.reviewerName,
          photoUrl: review.reviewerPhotoUrl,
        },
        response: review.response
          ? {
              comment: review.response,
              createdAt: review.respondedAt,
            }
          : null,
      })),
      stats: {
        averageRating: driver.rating,
        totalReviews: driver.reviewCount,
        distribution,
      },
      pagination: {
        total: totalReviews,
        page: validPage,
        limit: validLimit,
        pages: totalPages,
        hasMore: validPage < totalPages,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching driver reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
