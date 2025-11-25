import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { TokenPayload } from '@/lib/auth/jwt';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const verificationSchema = z.object({
  documentId: z.string(),
  action: z.enum(['verify', 'reject']),
  rejectionReason: z.string().optional(),
});

/**
 * POST /api/admin/documents - Verify or reject a document
 */
async function handlePost(req: NextRequest, user: TokenPayload) {
  try {
    const body = await req.json();
    const validated = verificationSchema.parse(body);
    const adminId = user.userId;

    // Get document
    const document = await prisma.documentVerification.findUnique({
      where: { id: validated.documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Document has already been processed' },
        { status: 400 }
      );
    }

    // Update document status
    const updateData: any = {
      status: validated.action === 'verify' ? 'VERIFIED' : 'REJECTED',
      verifiedBy: adminId,
      verifiedAt: new Date(),
    };

    if (validated.action === 'reject') {
      updateData.rejectionReason = validated.rejectionReason;
    }

    const updatedDocument = await prisma.documentVerification.update({
      where: { id: validated.documentId },
      data: updateData,
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: validated.action === 'verify' ? 'VERIFY_DOCUMENT' : 'REJECT_DOCUMENT',
        targetType: 'DOCUMENT',
        targetId: validated.documentId,
        details: {
          documentType: document.documentType,
          userId: document.userId,
          rejectionReason: validated.rejectionReason,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Document ${validated.action === 'verify' ? 'verified' : 'rejected'} successfully`,
      document: {
        id: updatedDocument.id,
        status: updatedDocument.status,
        verifiedAt: updatedDocument.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Document verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process document verification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/documents - Get all documents for review
 */
async function handleGet(req: NextRequest, user: TokenPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const documents = await prisma.documentVerification.findMany({
      where: {
        status,
      },
      orderBy: { uploadedAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.documentVerification.count({
      where: { status },
    });

    return NextResponse.json({
      success: true,
      documents,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + documents.length < total,
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handlePost);
export const GET = withAdmin(handleGet);
