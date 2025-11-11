import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/attractions/[id] - Get a single attraction by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const attraction = await prisma.attraction.findUnique({
      where: { id },
    });
    
    if (!attraction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attraction not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: attraction,
    });
  } catch (error) {
    console.error('Error fetching attraction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attraction',
      },
      { status: 500 }
    );
  }
}
