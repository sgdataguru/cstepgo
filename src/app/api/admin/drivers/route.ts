import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getClientIp, getUserAgent } from '@/lib/admin/middleware';
import { generateDriverCredentials } from '@/lib/admin/credentials';
import { sendDriverCredentials } from '@/lib/admin/messaging';
import { logAdminAction, AdminActions } from '@/lib/admin/audit';
import { z } from 'zod';

// Validation schema for driver registration
const driverRegistrationSchema = z.object({
  // Personal Information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  
  // Vehicle Information
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  vehicleMake: z.string().min(1, 'Vehicle make is required'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  vehicleYear: z.number().min(1990).max(new Date().getFullYear() + 1),
  vehicleColor: z.string().optional(),
  licensePlate: z.string().min(1, 'License plate is required'),
  
  // Driver License
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiry: z.string().datetime('Invalid license expiry date'),
  
  // Documents (S3 keys)
  documents: z.object({
    driverLicense: z.string().optional(),
    vehicleRegistration: z.string().optional(),
    vehicleInsurance: z.string().optional(),
    vehiclePhoto: z.string().optional(),
    profilePhoto: z.string().optional(),
  }),
  
  // Status
  autoApprove: z.boolean().default(false),
  sendCredentials: z.boolean().default(true),
});

// POST /api/admin/drivers - Register a new driver
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req, admin) => {
    try {
      const body = await req.json();
      
      // Validate input
      const validatedData = driverRegistrationSchema.parse(body);
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: validatedData.email },
            { phone: validatedData.phone },
          ],
        },
      });
      
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'User already exists',
            message: 'A user with this email or phone already exists',
          },
          { status: 400 }
        );
      }
      
      // Generate driver credentials
      const credentials = await generateDriverCredentials();
      
      // Calculate password expiry (30 days)
      const passwordExpiresAt = credentials.expiresAt;
      
      // Create user and driver in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: validatedData.email,
            phone: validatedData.phone,
            name: validatedData.name,
            passwordHash: credentials.passwordHash,
            role: 'DRIVER',
            temporaryPassword: true,
            passwordExpiresAt,
            forcePasswordChange: true,
            createdBy: admin.id,
          },
        });
        
        // Create driver profile
        const driver = await tx.driver.create({
          data: {
            driverId: credentials.driverId,
            userId: user.id,
            status: validatedData.autoApprove ? 'APPROVED' : 'PENDING',
            vehicleType: validatedData.vehicleType,
            vehicleMake: validatedData.vehicleMake,
            vehicleModel: validatedData.vehicleModel,
            vehicleYear: validatedData.vehicleYear,
            vehicleColor: validatedData.vehicleColor || null,
            licensePlate: validatedData.licensePlate,
            licenseNumber: validatedData.licenseNumber,
            licenseExpiry: new Date(validatedData.licenseExpiry),
            documentsUrl: validatedData.documents,
            registeredBy: admin.id,
            registrationMethod: 'admin',
            approvedAt: validatedData.autoApprove ? new Date() : null,
          },
        });
        
        return { user, driver };
      });
      
      // Log admin action
      await logAdminAction(
        admin.id,
        AdminActions.DRIVER_REGISTERED,
        'driver',
        result.driver.id,
        {
          driverId: credentials.driverId,
          autoApproved: validatedData.autoApprove,
          vehicleInfo: {
            type: validatedData.vehicleType,
            make: validatedData.vehicleMake,
            model: validatedData.vehicleModel,
          },
        },
        getClientIp(req),
        getUserAgent(req)
      );
      
      // Send credentials if requested
      let deliveryResults = [];
      if (validatedData.sendCredentials) {
        deliveryResults = await sendDriverCredentials(
          validatedData.name,
          credentials.driverId,
          credentials.password,
          validatedData.phone,
          validatedData.email
        );
        
        // Log credential deliveries
        for (const deliveryResult of deliveryResults) {
          await prisma.driverCredentialDelivery.create({
            data: {
              driverId: result.driver.id,
              userId: result.user.id,
              channel: deliveryResult.channel,
              recipient:
                deliveryResult.channel === 'email'
                  ? validatedData.email
                  : validatedData.phone,
              status: deliveryResult.success ? 'sent' : 'failed',
              messageId: deliveryResult.messageId,
              credentials: {
                driverId: credentials.driverId,
                passwordSent: true,
              },
              sentAt: deliveryResult.success ? new Date() : null,
              deliveredAt: deliveryResult.success ? new Date() : null,
              failedAt: !deliveryResult.success ? new Date() : null,
              errorMessage: deliveryResult.error,
            },
          });
        }
        
        // Log credential send action
        await logAdminAction(
          admin.id,
          AdminActions.CREDENTIALS_SENT,
          'driver',
          result.driver.id,
          {
            channels: deliveryResults.map((r) => r.channel),
            successful: deliveryResults.filter((r) => r.success).length,
            failed: deliveryResults.filter((r) => !r.success).length,
          },
          getClientIp(req),
          getUserAgent(req)
        );
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        data: {
          driver: {
            id: result.driver.id,
            driverId: credentials.driverId,
            userId: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
            status: result.driver.status,
          },
          credentials: validatedData.sendCredentials
            ? {
                driverId: credentials.driverId,
                password: credentials.password,
                expiresAt: passwordExpiresAt,
              }
            : undefined,
          delivery: deliveryResults.length > 0 ? {
            sent: deliveryResults.filter((r) => r.success).length,
            failed: deliveryResults.filter((r) => !r.success).length,
            channels: deliveryResults.map((r) => ({
              channel: r.channel,
              success: r.success,
              error: r.error,
            })),
          } : undefined,
        },
        message: 'Driver registered successfully',
      });
    } catch (error) {
      console.error('Driver registration failed:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: 'Driver registration failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/admin/drivers - List drivers with filters
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (req) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      
      // Build where clause
      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { driverId: { contains: search, mode: 'insensitive' } },
          { licenseNumber: { contains: search, mode: 'insensitive' } },
          { licensePlate: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
        ];
      }
      
      // Get drivers with pagination
      const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                createdAt: true,
                lastLoginAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        prisma.driver.count({ where }),
      ]);
      
      return NextResponse.json({
        success: true,
        data: drivers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch drivers',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}
