import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get driver from session
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const driver = await getDriverFromRequest(request);
    const body = await request.json();
    const { response } = body;

    if (!response || !response.trim()) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      );
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Ensure the review belongs to this driver
    if (review.driverId !== driver.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the review with the driver's response
    const updatedReview = await prisma.review.update({
      where: { id: params.reviewId },
      data: {
        response: response.trim(),
        respondedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Response added successfully',
      data: {
        response: updatedReview.response,
        respondedAt: updatedReview.respondedAt
      }
    });

  } catch (error) {
    console.error('Respond to review error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to respond to review' },
      { status: 500 }
    );
  }
}
