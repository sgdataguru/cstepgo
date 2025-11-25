import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { TokenPayload } from '@/lib/auth/jwt';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

/**
 * POST /api/admin/approvals/driver - Approve or reject a driver
 */
async function handlePost(req: NextRequest, user: TokenPayload) {
  try {
    const body = await req.json();
    const { driverId } = body;

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    const validated = approvalSchema.parse(body);
    const adminId = user.userId;

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    if (driver.approvalStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Driver is already approved' },
        { status: 400 }
      );
    }

    // Update driver based on action
    const updateData: any = {
      approvalStatus: validated.action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedByAdmin: adminId,
      approvedAtAdmin: new Date(),
      adminNotes: validated.notes,
    };

    if (validated.action === 'approve') {
      updateData.status = 'APPROVED';
      updateData.approvedAt = new Date();
    } else {
      updateData.status = 'REJECTED';
      updateData.rejectedAt = new Date();
      updateData.rejectionReasonAdmin = validated.rejectionReason;
      updateData.rejectionReason = validated.rejectionReason;
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: updateData,
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: validated.action === 'approve' ? 'APPROVE_DRIVER' : 'REJECT_DRIVER',
        targetType: 'DRIVER',
        targetId: driverId,
        details: {
          driverId: driver.driverId,
          driverName: driver.fullName || driver.user.name,
          notes: validated.notes,
          rejectionReason: validated.rejectionReason,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    });

    // TODO: Send notification to driver via email/SMS

    return NextResponse.json({
      success: true,
      message: `Driver ${validated.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      driver: {
        id: updatedDriver.id,
        driverId: updatedDriver.driverId,
        approvalStatus: updatedDriver.approvalStatus,
        status: updatedDriver.status,
      },
    });
  } catch (error) {
    console.error('Driver approval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handlePost);
