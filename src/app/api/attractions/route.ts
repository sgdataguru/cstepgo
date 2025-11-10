import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/attractions - List all attractions with optional zone filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive') !== 'false'; // Default to true
    
    const where: any = {
      isActive,
    };
    
    if (zone) {
      where.zone = zone;
    }
    
    if (category) {
      where.category = category;
    }
    
    const attractions = await prisma.attraction.findMany({
      where,
      orderBy: [
        { zone: 'asc' },
        { name: 'asc' },
      ],
    });
    
    return NextResponse.json({
      success: true,
      data: attractions,
      count: attractions.length,
    });
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attractions',
      },
      { status: 500 }
    );
  }
}
