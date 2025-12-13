import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/credentials';
import { nanoid } from 'nanoid';


// Validation schema for driver login
const driverLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false)
});

// Create simple token for driver session
async function createDriverToken(user: any, driver: any, remember: boolean = false) {
  const expirationTime = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
  const expiresAt = new Date(Date.now() + expirationTime);
  
  // Simple token - in production you'd want proper JWT
  const token = nanoid(64);
    
  return { token, expiresAt };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validatedData = driverLoginSchema.parse(body);
    
    // Find user by email with driver profile
    const user = await prisma.user.findUnique({
      where: { 
        email: validatedData.email,
        role: 'DRIVER' 
      },
      include: {
        driverProfile: true
      }
    });
    
    if (!user || !user.driverProfile) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check driver status
    const driver = user.driverProfile;
    
    if (driver.status === 'REJECTED') {
      return NextResponse.json(
        { 
          error: 'Account rejected',
          message: driver.rejectionReason || 'Your driver application was not approved.'
        },
        { status: 403 }
      );
    }
    
    if (driver.status === 'SUSPENDED') {
      return NextResponse.json(
        { 
          error: 'Account suspended',
          message: 'Your account has been temporarily suspended. Please contact support.'
        },
        { status: 403 }
      );
    }
    
    // Create session token
    const { token, expiresAt } = await createDriverToken(user, driver, validatedData.remember);
    
    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt
      }
    });
    
    // Update last login time - removing this for now as field doesn't exist
    // await prisma.driver.update({
    //   where: { id: driver.id },
    //   data: { lastLoginAt: new Date() }
    // });
    
    // Determine dashboard URL based on status
    let dashboardUrl = '/driver/dashboard';
    let nextSteps: string[] = [];
    
    if (driver.status === 'PENDING') {
      dashboardUrl = '/driver/onboarding';
      nextSteps = [
        'Complete document upload',
        'Verify your phone number',
        'Wait for admin approval'
      ];
    } else if (driver.status === 'APPROVED') {
      dashboardUrl = '/driver/dashboard';
      if (!user.phoneVerified) {
        nextSteps.push('Verify your phone number');
      }
      if (!driver.isVerified) {
        nextSteps.push('Complete account verification');
      }
    }
    
    // Prepare response data (excluding sensitive information)
    const responseData = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      },
      driver: {
        id: driver.id,
        status: driver.status,
        rating: driver.rating,
        completedTrips: driver.completedTrips,
        availability: driver.availability,
        vehicleType: driver.vehicleType,
        vehicleMake: driver.vehicleMake,
        vehicleModel: driver.vehicleModel,
        licensePlate: driver.licensePlate,
        isVerified: driver.isVerified,
        verificationLevel: driver.verificationLevel
      },
      session: {
        token: token,
        expiresAt: expiresAt.toISOString()
      },
      navigation: {
        dashboardUrl,
        nextSteps
      }
    };
    
    // Set secure HTTP-only cookie for the session
    const response = NextResponse.json(responseData);
    
    response.cookies.set('driver_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: validatedData.remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 24 hours
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Driver login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Driver login endpoint',
    requiredFields: ['email', 'password'],
    optionalFields: ['remember'],
    responses: {
      200: 'Login successful with user, driver, and session data',
      401: 'Invalid credentials',
      403: 'Account rejected or suspended',
      500: 'Server error'
    }
  });
}

// Driver logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('driver_session')?.value ||
                 request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token }
      });
    }
    
    // Clear cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    response.cookies.set('driver_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Driver logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
