import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Simple test to see if database is working
    const userCount = await prisma.user.count();
    const driverCount = await prisma.driver.count();
    
    // Try to find our specific test driver
    const testDriver = await prisma.driver.findUnique({
      where: { id: 'test-driver-123' },
      include: {
        user: true
      }
    });

    return NextResponse.json({
      success: true,
      userCount,
      driverCount,
      testDriver: testDriver ? {
        id: testDriver.id,
        userId: testDriver.userId,
        userName: testDriver.user.name,
        status: testDriver.status
      } : null
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
