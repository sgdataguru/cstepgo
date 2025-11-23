import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/drivers/[id]
 * Fetch complete driver profile with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch driver with user information
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        vehicles: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Calculate review distribution
    const reviewDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { driverId: id },
      _count: { rating: true },
    });

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviewDistribution.forEach((item) => {
      distribution[item.rating] = item._count.rating;
    });

    // Parse JSON fields
    const languages = driver.languages as any[] || [];
    const verificationBadges = driver.verificationBadges as any[] || [];

    // Construct response
    const response = {
      driver: {
        id: driver.id,
        personalInfo: {
          name: driver.user.name,
          photoUrl: driver.user.avatar,
          email: driver.user.email,
          phone: driver.user.phone,
          bio: driver.bio,
          coverPhotoUrl: driver.coverPhotoUrl,
          joinedDate: driver.createdAt,
        },
        professionalInfo: {
          yearsOfExperience: driver.yearsExperience,
          languages: languages,
          responseTime: driver.responseTime,
        },
        stats: {
          totalTrips: driver.completedTrips,
          totalDistance: driver.totalDistance,
          onTimePercentage: driver.onTimePercentage,
          cancellationRate: driver.cancellationRate,
        },
        rating: {
          average: driver.rating,
          count: driver.reviewCount,
          distribution,
        },
        verification: {
          badges: verificationBadges,
          verificationLevel: driver.verificationLevel,
          isVerified: driver.isVerified,
        },
        availability: {
          status: driver.availability,
          currentLocation: driver.currentLocation,
        },
        vehicles: driver.vehicles.map((vehicle) => ({
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          type: vehicle.type,
          licensePlate: vehicle.licensePlate,
          passengerCapacity: vehicle.passengerCapacity,
          luggageCapacity: vehicle.luggageCapacity,
          amenities: vehicle.amenities as string[],
          photos: vehicle.photos as string[],
        })),
        recentReviews: driver.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          reviewerName: review.reviewerName,
          reviewerPhotoUrl: review.reviewerPhotoUrl,
          response: review.response ? {
            comment: review.response,
            createdAt: review.respondedAt,
          } : null,
        })),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
