import { NextRequest, NextResponse } from 'next/server';
import { withAuth, TokenPayload } from '@/lib/auth/middleware';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const documentSchema = z.object({
  documentType: z.string(),
  documentNumber: z.string().optional(),
  documentUrl: z.string().url(),
  expiryDate: z.string().datetime().optional(),
  driverId: z.string().optional(),
});

/**
 * POST /api/documents/verify - Submit document for verification
 */
async function handlePost(req: NextRequest, user: TokenPayload) {
  try {
    const body = await req.json();
    const validated = documentSchema.parse(body);

    // Create document verification record
    const document = await prisma.documentVerification.create({
      data: {
        id: nanoid(),
        userId: user.userId,
        driverId: validated.driverId || null,
        documentType: validated.documentType,
        documentNumber: validated.documentNumber || null,
        documentUrl: validated.documentUrl,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentType: document.documentType,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Document submission error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit document' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/verify - Get user's documents
 */
async function handleGet(req: NextRequest, user: TokenPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {
      userId: user.userId,
    };

    if (status) {
      where.status = status;
    }

    const documents = await prisma.documentVerification.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost);
export const GET = withAuth(handleGet);
