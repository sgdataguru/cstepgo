import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getClientIp, getUserAgent } from '@/lib/admin/middleware';
import { logAdminAction, AdminActions } from '@/lib/admin/audit';
import { z } from 'zod';

// Validation schema for driver update
const driverUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  vehicleType: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().min(1990).max(new Date().getFullYear() + 1).optional(),
  vehicleColor: z.string().optional(),
  licensePlate: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  rejectionReason: z.string().optional(),
  documents: z.object({
    driverLicense: z.string().optional(),
    vehicleRegistration: z.string().optional(),
    vehicleInsurance: z.string().optional(),
    vehiclePhoto: z.string().optional(),
    profilePhoto: z.string().optional(),
  }).optional(),
});

// PATCH /api/admin/drivers/[id] - Update driver
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAdmin(request, async (req, admin) => {
    try {
      const driverId = params.id;
      const body = await req.json();
      
      // Validate input
      const validatedData = driverUpdateSchema.parse(body);
      
      // Check if driver exists
      const existingDriver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: { user: true },
      });
      
      if (!existingDriver) {
        return NextResponse.json(
          {
            success: false,
            error: 'Driver not found',
          },
          { status: 404 }
        );
      }
      
      // Update driver in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update user if needed
        const userUpdates: any = {};
        if (validatedData.name) userUpdates.name = validatedData.name;
        if (validatedData.email) userUpdates.email = validatedData.email;
        if (validatedData.phone) userUpdates.phone = validatedData.phone;
        
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: existingDriver.userId },
            data: userUpdates,
          });
        }
        
        // Update driver
        const driverUpdates: any = {};
        if (validatedData.vehicleType) driverUpdates.vehicleType = validatedData.vehicleType;
        if (validatedData.vehicleMake) driverUpdates.vehicleMake = validatedData.vehicleMake;
        if (validatedData.vehicleModel) driverUpdates.vehicleModel = validatedData.vehicleModel;
        if (validatedData.vehicleYear) driverUpdates.vehicleYear = validatedData.vehicleYear;
        if (validatedData.vehicleColor !== undefined) driverUpdates.vehicleColor = validatedData.vehicleColor;
        if (validatedData.licensePlate) driverUpdates.licensePlate = validatedData.licensePlate;
        if (validatedData.licenseNumber) driverUpdates.licenseNumber = validatedData.licenseNumber;
        if (validatedData.licenseExpiry) driverUpdates.licenseExpiry = new Date(validatedData.licenseExpiry);
        if (validatedData.documents) {
          // Merge with existing documents
          const existingDocs = existingDriver.documentsUrl as any;
          driverUpdates.documentsUrl = {
            ...existingDocs,
            ...validatedData.documents,
          };
        }
        
        // Handle status changes
        if (validatedData.status) {
          driverUpdates.status = validatedData.status;
          
          if (validatedData.status === 'APPROVED' && existingDriver.status !== 'APPROVED') {
            driverUpdates.approvedAt = new Date();
            driverUpdates.rejectedAt = null;
            driverUpdates.rejectionReason = null;
          } else if (validatedData.status === 'REJECTED') {
            driverUpdates.rejectedAt = new Date();
            driverUpdates.approvedAt = null;
            if (validatedData.rejectionReason) {
              driverUpdates.rejectionReason = validatedData.rejectionReason;
            }
          }
        }
        
        const updatedDriver = await tx.driver.update({
          where: { id: driverId },
          data: driverUpdates,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        });
        
        return updatedDriver;
      });
      
      // Log admin action
      const actionType = validatedData.status
        ? validatedData.status === 'APPROVED'
          ? AdminActions.DRIVER_APPROVED
          : validatedData.status === 'REJECTED'
          ? AdminActions.DRIVER_REJECTED
          : validatedData.status === 'SUSPENDED'
          ? AdminActions.DRIVER_SUSPENDED
          : AdminActions.DRIVER_UPDATED
        : AdminActions.DRIVER_UPDATED;
      
      await logAdminAction(
        admin.id,
        actionType,
        'driver',
        driverId,
        {
          updates: validatedData,
          previousStatus: existingDriver.status,
          newStatus: validatedData.status,
        },
        getClientIp(req),
        getUserAgent(req)
      );
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Driver updated successfully',
      });
    } catch (error) {
      console.error('Driver update failed:', error);
      
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
          error: 'Driver update failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/admin/drivers/[id] - Get driver details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAdmin(request, async () => {
    try {
      const driverId = params.id;
      
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              createdAt: true,
              updatedAt: true,
              lastLoginAt: true,
              temporaryPassword: true,
              passwordExpiresAt: true,
            },
          },
          trips: {
            select: {
              id: true,
              title: true,
              status: true,
              departureTime: true,
            },
            orderBy: {
              departureTime: 'desc',
            },
            take: 10,
          },
          payouts: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
          credentialDeliveries: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });
      
      if (!driver) {
        return NextResponse.json(
          {
            success: false,
            error: 'Driver not found',
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: driver,
      });
    } catch (error) {
      console.error('Failed to fetch driver:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch driver',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}
