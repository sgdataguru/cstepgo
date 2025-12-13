import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


// Validation schema for driver profile update
const driverProfileUpdateSchema = z.object({
  // Personal Information
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  languages: z.array(z.object({
    code: z.string(),
    name: z.string(),
    proficiency: z.enum(['beginner', 'intermediate', 'fluent', 'native'])
  })).optional(),
  
  // Vehicle Information
  vehicleColor: z.string().optional(),
  luggageCapacity: z.number().min(0).max(20).optional(),
  
  // Availability
  availability: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).optional(),
  currentLocation: z.string().max(100).optional(),
});

// Get driver from session - simplified for now
async function getDriverFromRequest(request: NextRequest) {
  // In a real implementation, you'd verify the session token
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { 
      user: true
    }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

// GET - Get driver profile
export async function GET(request: NextRequest) {
  try {
    // Get authenticated driver with related data
    const driver = await getDriverFromRequest(request);
    
    // Prepare simplified response
    const profileData = {
      // Basic Info
      id: driver.id,
      userId: driver.userId,
      status: driver.status,
      
      // Personal Information
      fullName: driver.user.name,
      email: driver.user.email,
      phone: driver.user.phone,
      bio: driver.bio,
      avatar: driver.user.avatar,
      coverPhotoUrl: driver.coverPhotoUrl,
      yearsExperience: driver.yearsExperience,
      languages: driver.languages,
      
      // Vehicle Information
      vehicleType: driver.vehicleType,
      vehicleMake: driver.vehicleMake,
      vehicleModel: driver.vehicleModel,
      vehicleYear: driver.vehicleYear,
      licensePlate: driver.licensePlate,
      vehicleColor: driver.vehicleColor,
      passengerCapacity: driver.passengerCapacity,
      luggageCapacity: driver.luggageCapacity,
      
      // License & Documents
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      documentsUrl: driver.documentsUrl,
      
      // Verification Status
      isVerified: driver.isVerified,
      verificationLevel: driver.verificationLevel,
      verificationBadges: driver.verificationBadges,
      
      // Performance Stats
      rating: driver.rating,
      reviewCount: driver.reviewCount,
      completedTrips: driver.completedTrips,
      totalDistance: driver.totalDistance,
      totalEarnings: driver.totalEarnings,
      onTimePercentage: driver.onTimePercentage,
      cancellationRate: driver.cancellationRate,
      responseTime: driver.responseTime,
      
      // Availability
      availability: driver.availability,
      currentLocation: driver.currentLocation,
      
      // Application Status
      appliedAt: driver.appliedAt,
      approvedAt: driver.approvedAt,
      rejectedAt: driver.rejectedAt,
      rejectionReason: driver.rejectionReason,
      
      // Timestamps
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    };
    
    return NextResponse.json({
      success: true,
      data: profileData
    });
    
  } catch (error) {
    console.error('Get driver profile error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve driver profile' },
      { status: 500 }
    );
  }
}

// PUT - Update driver profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validatedData = driverProfileUpdateSchema.parse(body);
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Check if driver can update profile
    if (driver.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Cannot update profile while suspended' },
        { status: 403 }
      );
    }
    
    // Update driver profile
    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedDriver.id,
        bio: updatedDriver.bio,
        yearsExperience: updatedDriver.yearsExperience,
        languages: updatedDriver.languages,
        vehicleColor: updatedDriver.vehicleColor,
        luggageCapacity: updatedDriver.luggageCapacity,
        availability: updatedDriver.availability,
        currentLocation: updatedDriver.currentLocation,
        updatedAt: updatedDriver.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update driver profile error:', error);
    
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
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update driver profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update availability status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { availability, currentLocation } = body;
    
    // Validate availability status
    if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(availability)) {
      return NextResponse.json(
        { error: 'Invalid availability status' },
        { status: 400 }
      );
    }
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Check if driver can change availability
    if (driver.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved drivers can change availability' },
        { status: 403 }
      );
    }
    
    // Update availability
    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        availability,
        currentLocation: currentLocation || driver.currentLocation,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Availability updated to ${availability}`,
      data: {
        availability: updatedDriver.availability,
        currentLocation: updatedDriver.currentLocation,
        updatedAt: updatedDriver.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update availability error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
