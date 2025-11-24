import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { validateFile, uploadToS3, isS3Configured } from '@/lib/services/fileUploadService';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

/**
 * POST /api/upload - Upload a file
 */
async function handlePost(req: AuthenticatedRequest) {
  try {
    // Check if S3 is configured
    if (!isS3Configured()) {
      return NextResponse.json(
        { error: 'File upload service is not configured' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const purpose = (formData.get('purpose') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file, { purpose: purpose as any });
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const uploadResult = await uploadToS3(
      buffer,
      file.name,
      file.type,
      req.user!.userId,
      purpose
    );

    // Store file metadata in database
    const fileRecord = await prisma.fileUpload.create({
      data: {
        id: nanoid(),
        userId: req.user!.userId,
        originalName: uploadResult.originalName,
        storedName: uploadResult.storedName,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.size,
        s3Bucket: uploadResult.bucket,
        s3Key: uploadResult.key,
        url: uploadResult.url,
        purpose,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        url: fileRecord.url,
        name: fileRecord.originalName,
        size: fileRecord.sizeBytes,
        type: fileRecord.mimeType,
        purpose: fileRecord.purpose,
        uploadedAt: fileRecord.createdAt,
      },
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload - Get endpoint info
 */
async function handleGet(req: NextRequest) {
  return NextResponse.json({
    message: 'File upload endpoint',
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      file: 'File - The file to upload',
      purpose: 'string - Purpose of upload (profileImage, document, vehiclePhoto, etc.)',
    },
    limits: {
      profileImage: '5MB',
      document: '10MB',
      vehiclePhoto: '5MB',
    },
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/webp'],
      documents: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    configured: isS3Configured(),
  });
}

export const POST = withAuth(handlePost);
export const GET = handleGet;
