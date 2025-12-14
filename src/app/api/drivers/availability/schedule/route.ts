import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';


// Validation schema for schedule creation
const scheduleCreateSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  scheduleType: z.enum(['break', 'unavailable', 'custom']).default('break'),
  reason: z.string().max(200).optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    dayOfWeek: z.array(z.number().min(0).max(6)).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  }).optional(),
});

// Get driver from session
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

// GET - Get all schedules for the driver
export async function GET(request: NextRequest) {
  try {
    const driver = await getDriverFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const whereClause: any = {
      driverId: driver.id,
      isActive: true,
    };
    
    if (!includeExpired) {
      whereClause.endTime = {
        gte: new Date()
      };
    }
    
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const schedules = await prisma.driverAvailabilitySchedule.findMany({
      where: whereClause,
      orderBy: {
        startTime: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: schedules.map((schedule: typeof schedules[0]) => ({
        id: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        scheduleType: schedule.scheduleType,
        reason: schedule.reason,
        isRecurring: schedule.isRecurring,
        recurringPattern: schedule.recurringPattern,
        isActive: schedule.isActive,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      }))
    });
    
  } catch (error) {
    console.error('Get schedules error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve schedules' },
      { status: 500 }
    );
  }
}

// POST - Create a new availability schedule (break time, unavailability, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scheduleCreateSchema.parse(body);
    
    const driver = await getDriverFromRequest(request);
    
    // Check if driver can create schedules
    if (driver.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved drivers can create schedules' },
        { status: 403 }
      );
    }
    
    // Validate time range
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }
    
    // Check for overlapping schedules
    const overlappingSchedules = await prisma.driverAvailabilitySchedule.findMany({
      where: {
        driverId: driver.id,
        isActive: true,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lte: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });
    
    if (overlappingSchedules.length > 0) {
      return NextResponse.json(
        { 
          error: 'Schedule overlaps with existing schedule',
          overlappingSchedules: overlappingSchedules.map((s: typeof overlappingSchedules[0]) => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            scheduleType: s.scheduleType
          }))
        },
        { status: 409 }
      );
    }
    
    // Create the schedule
    const schedule = await prisma.driverAvailabilitySchedule.create({
      data: {
        driverId: driver.id,
        startTime,
        endTime,
        scheduleType: validatedData.scheduleType,
        reason: validatedData.reason,
        isRecurring: validatedData.isRecurring,
        recurringPattern: validatedData.recurringPattern,
      }
    });
    
    // If this is a current/immediate schedule, update driver availability
    const now = new Date();
    if (startTime <= now && endTime >= now && validatedData.scheduleType !== 'custom') {
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.driver.update({
          where: { id: driver.id },
          data: {
            availability: validatedData.scheduleType === 'break' ? 'BUSY' : 'OFFLINE',
            lastActivityAt: new Date()
          }
        });
        
        // Log availability change
        await tx.driverAvailabilityHistory.create({
          data: {
            driverId: driver.id,
            previousStatus: driver.availability,
            newStatus: validatedData.scheduleType === 'break' ? 'BUSY' : 'OFFLINE',
            changeReason: `Scheduled ${validatedData.scheduleType}: ${validatedData.reason || 'No reason provided'}`,
            triggeredBy: 'system',
            metadata: {
              scheduleId: schedule.id,
              scheduleType: validatedData.scheduleType
            }
          }
        });
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        id: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        scheduleType: schedule.scheduleType,
        reason: schedule.reason,
        isRecurring: schedule.isRecurring,
        recurringPattern: schedule.recurringPattern,
        createdAt: schedule.createdAt,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create schedule error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
