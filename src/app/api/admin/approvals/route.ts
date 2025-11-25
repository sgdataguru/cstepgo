import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, TokenPayload } from '@/lib/auth/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/approvals - Get list of items pending approval
 */
async function handleGet(req: NextRequest, user: TokenPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // drivers, documents, all
    const status = searchParams.get('status') || 'PENDING_REVIEW';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let results: any = {};

    // Get pending drivers
    if (type === 'all' || type === 'drivers') {
      const drivers = await prisma.driver.findMany({
        where: {
          approvalStatus: status,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      });

      const totalDrivers = await prisma.driver.count({
        where: { approvalStatus: status },
      });

      results.drivers = {
        items: drivers.map((driver: typeof drivers[0]) => ({
          id: driver.id,
          driverId: driver.driverId,
          userId: driver.userId,
          fullName: driver.fullName || driver.user.name,
          email: driver.user.email,
          phone: driver.user.phone,
          vehicleType: driver.vehicleType,
          vehicleMake: driver.vehicleMake,
          vehicleModel: driver.vehicleModel,
          licensePlate: driver.licensePlate,
          licenseNumber: driver.licenseNumber,
          homeCity: driver.homeCity,
          appliedAt: driver.appliedAt,
          approvalStatus: driver.approvalStatus,
          status: driver.status,
        })),
        total: totalDrivers,
        page,
        limit,
        hasMore: skip + drivers.length < totalDrivers,
      };
    }

    // Get pending documents
    if (type === 'all' || type === 'documents') {
      const documents = await prisma.documentVerification.findMany({
        where: {
          status: status === 'APPROVED' ? 'VERIFIED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      });

      const totalDocuments = await prisma.documentVerification.count({
        where: {
          status: status === 'APPROVED' ? 'VERIFIED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        },
      });

      results.documents = {
        items: documents,
        total: totalDocuments,
        page,
        limit,
        hasMore: skip + documents.length < totalDocuments,
      };
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handleGet);
