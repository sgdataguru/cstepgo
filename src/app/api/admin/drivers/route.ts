import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateDriverCredentials, hashPassword } from '@/lib/auth/credentials';
import { getCredentialMessage } from '@/lib/messaging/templates';
import { sendWhatsAppMessage, sendSMS } from '@/lib/messaging/twilio';
import { sendEmail } from '@/lib/messaging/email';
import { requireAdmin } from '@/lib/auth/adminMiddleware';

const prisma = new PrismaClient();

/**
 * POST /api/admin/drivers
 * Register a new driver manually (admin only)
 */
export async function POST(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const {
      fullName,
      phone,
      email,
      nationalId,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      licensePlate,
      vehicleColor,
      seatCapacity,
      homeCity,
      serviceRadiusKm = 50,
      willingToTravel = [],
      documents,
    } = body;
    
    if (!fullName || !phone || !nationalId || !vehicleMake || !vehicleModel || !licensePlate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate credentials
    const credentials = generateDriverCredentials();
    const passwordHash = await hashPassword(credentials.tempPassword);
    
    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }
    
    // Check if license plate already exists
    const existingDriver = await prisma.driver.findFirst({
      where: { licensePlate },
    });
    
    if (existingDriver) {
      return NextResponse.json(
        { error: 'License plate already registered' },
        { status: 409 }
      );
    }
    
    // Create user and driver in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: fullName,
          phone,
          email: email || undefined,
          passwordHash,
          role: 'DRIVER',
          emailVerified: false,
          phoneVerified: false,
          isFirstLogin: true,
        },
      });
      
      // Create driver profile
      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          driverId: credentials.driverId,
          fullName,
          nationalId,
          vehicleType: vehicleType || 'SEDAN',
          vehicleMake,
          vehicleModel,
          vehicleYear: vehicleYear || new Date().getFullYear(),
          licensePlate,
          vehicleColor: vehicleColor || 'White',
          passengerCapacity: seatCapacity || 4,
          luggageCapacity: Math.floor((seatCapacity || 4) / 2),
          licenseNumber: nationalId, // Use nationalId as placeholder
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          documentsUrl: documents || {},
          homeCity: homeCity || '',
          serviceRadiusKm,
          willingToTravel: willingToTravel || [],
          status: 'PENDING',
          registeredBy: 'admin', // TODO: Get actual admin user ID
        },
      });
      
      return { user, driver };
    });
    
    // Send credentials via multiple channels
    const messages = getCredentialMessage(credentials, fullName);
    const deliveryResults = {
      whatsapp: 'NOT_SENT',
      sms: 'NOT_SENT',
      email: 'NOT_SENT',
    };
    
    // Try WhatsApp first
    const whatsappResult = await sendWhatsAppMessage(phone, messages.whatsapp);
    deliveryResults.whatsapp = whatsappResult.status;
    
    // Log WhatsApp delivery
    await prisma.driverCredentialDelivery.create({
      data: {
        driverId: result.driver.id,
        channel: 'WHATSAPP',
        status: whatsappResult.status,
        errorMessage: whatsappResult.errorMessage,
      },
    });
    
    // Fallback to SMS if WhatsApp failed
    if (whatsappResult.status === 'FAILED') {
      const smsResult = await sendSMS(phone, messages.sms);
      deliveryResults.sms = smsResult.status;
      
      await prisma.driverCredentialDelivery.create({
        data: {
          driverId: result.driver.id,
          channel: 'SMS',
          status: smsResult.status,
          errorMessage: smsResult.errorMessage,
        },
      });
    }
    
    // Send email if provided
    if (email) {
      const emailResult = await sendEmail(email, messages.email);
      deliveryResults.email = emailResult.status;
      
      await prisma.driverCredentialDelivery.create({
        data: {
          driverId: result.driver.id,
          channel: 'EMAIL',
          status: emailResult.status,
          errorMessage: emailResult.errorMessage,
        },
      });
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      driver: {
        id: result.driver.id,
        driverId: result.driver.driverId,
        fullName: result.driver.fullName,
        phone: result.user.phone,
        status: result.driver.status,
      },
      credentials: {
        driverId: credentials.driverId,
        tempPassword: credentials.tempPassword,
        loginUrl: credentials.loginUrl,
      },
      delivery: deliveryResults,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Driver registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register driver', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/drivers
 * List all drivers with optional filters
 */
export async function GET(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vehicleType = searchParams.get('vehicleType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build where clause
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (vehicleType && vehicleType !== 'ALL') {
      where.vehicleType = vehicleType;
    }
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { driverId: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } },
      ];
    }
    
    // Get total count
    const total = await prisma.driver.count({ where });
    
    // Get drivers with pagination
    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: {
            phone: true,
            email: true,
            isFirstLogin: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({
      drivers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}
