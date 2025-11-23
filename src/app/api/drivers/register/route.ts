import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { generateDriverCredentials, hashPassword } from '@/lib/auth/credentials';

const prisma = new PrismaClient();

// Validation schema for driver registration
const driverRegistrationSchema = z.object({
  // Personal Information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  
  // Vehicle Information
  vehicleMake: z.string().min(1, 'Vehicle make is required'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  vehicleYear: z.number().min(1990, 'Vehicle year must be 1990 or later'),
  licensePlate: z.string().min(1, 'License plate is required'),
  vehicleColor: z.string().optional(),
  passengerCapacity: z.number().min(1).max(50),
  
  // License Information
  licenseNumber: z.string().min(6, 'License number must be at least 6 characters'),
  licenseExpiry: z.string().refine((date) => new Date(date) > new Date(), 
    'License must not be expired'),
  
  // Service Preferences
  serviceRadiusKm: z.number().min(5).max(50).default(10),
  willingToTravel: z.array(z.string()).optional(),
  
  // Optional fields
  bio: z.string().optional(),
  yearsExperience: z.number().min(0).default(0),
  languages: z.array(z.object({
    code: z.string(),
    name: z.string(),
    proficiency: z.string()
  })).optional(),
  
  // Terms acceptance
  acceptsTerms: z.boolean().refine(val => val === true, 
    'You must accept the terms and conditions'),
  acceptsDataProcessing: z.boolean().refine(val => val === true, 
    'You must accept data processing terms')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validatedData = driverRegistrationSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { phone: validatedData.phone }
        ]
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 400 }
      );
    }
    
    // Check if license number is already registered
    const existingDriver = await prisma.driver.findFirst({
      where: { licenseNumber: validatedData.licenseNumber }
    });
    
    if (existingDriver) {
      return NextResponse.json(
        { error: 'Driver with this license number already registered' },
        { status: 400 }
      );
    }
    
    // Generate driver credentials
    const credentials = generateDriverCredentials();
    const hashedPassword = await hashPassword(credentials.tempPassword);
    
    // Create user and driver profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          passwordHash: hashedPassword,
          role: 'DRIVER',
          emailVerified: false,
          phoneVerified: false
        }
      });
      
      // Create driver profile with minimal required fields
      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          status: 'PENDING',
          
          // Vehicle Information (required fields)
          vehicleType: 'SEDAN',
          vehicleMake: validatedData.vehicleMake,
          vehicleModel: validatedData.vehicleModel,
          vehicleYear: validatedData.vehicleYear,
          licensePlate: validatedData.licensePlate,
          passengerCapacity: validatedData.passengerCapacity,
          
          // License Information
          licenseNumber: validatedData.licenseNumber,
          licenseExpiry: new Date(validatedData.licenseExpiry),
          
          // Document placeholder
          documentsUrl: {},
        }
      });
      
      return { user, driver, credentials };
    });
    
    // Don't return the password in the response for security
    const { tempPassword, ...safeCredentials } = result.credentials;
    
    return NextResponse.json({
      success: true,
      message: 'Driver registration submitted successfully. You will receive login credentials once approved.',
      data: {
        userId: result.user.id,
        driverId: result.driver.id,
        status: result.driver.status,
        loginUrl: safeCredentials.loginUrl,
        nextSteps: [
          'Upload required documents (license, insurance, vehicle registration)',
          'Complete background check process',
          'Wait for admin approval',
          'Receive login credentials via SMS/WhatsApp'
        ]
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Driver registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Driver registration endpoint',
    requiredFields: [
      'name', 'email', 'phone',
      'vehicleMake', 'vehicleModel', 'vehicleYear', 'licensePlate',
      'licenseNumber', 'licenseExpiry', 'passengerCapacity',
      'acceptsTerms', 'acceptsDataProcessing'
    ],
    optionalFields: [
      'vehicleColor', 'serviceRadiusKm', 'willingToTravel',
      'bio', 'yearsExperience', 'languages'
    ]
  });
}
