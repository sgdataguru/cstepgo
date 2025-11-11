import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getClientIp, getUserAgent } from '@/lib/admin/middleware';
import { generateUploadUrl, generateBatchUploadUrls } from '@/lib/admin/s3';
import { logAdminAction, AdminActions } from '@/lib/admin/audit';
import { z } from 'zod';

// Validation schema for single file
const uploadUrlSchema = z.object({
  driverId: z.string(),
  fileType: z.string(),
  fileName: z.string(),
  contentType: z.string(),
});

// Validation schema for batch upload
const batchUploadUrlSchema = z.object({
  driverId: z.string(),
  files: z.array(
    z.object({
      fileType: z.string(),
      fileName: z.string(),
      contentType: z.string(),
    })
  ),
});

// POST /api/admin/upload-url - Generate pre-signed URL for document upload
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req, admin) => {
    try {
      const body = await req.json();
      
      // Check if it's a batch request
      const isBatch = Array.isArray(body.files);
      
      if (isBatch) {
        // Validate batch input
        const validatedData = batchUploadUrlSchema.parse(body);
        
        // Generate batch upload URLs
        const results = await generateBatchUploadUrls(
          validatedData.driverId,
          validatedData.files
        );
        
        // Check if all succeeded
        const allSucceeded = results.every((r) => r.success);
        
        if (!allSucceeded) {
          const failedFiles = results
            .map((r, i) => (!r.success ? validatedData.files[i].fileType : null))
            .filter(Boolean);
          
          return NextResponse.json(
            {
              success: false,
              error: 'Some uploads failed',
              message: `Failed to generate URLs for: ${failedFiles.join(', ')}`,
              results,
            },
            { status: 400 }
          );
        }
        
        // Log admin action
        await logAdminAction(
          admin.id,
          AdminActions.DOCUMENT_UPLOADED,
          'driver',
          validatedData.driverId,
          {
            fileTypes: validatedData.files.map((f) => f.fileType),
            count: validatedData.files.length,
          },
          getClientIp(req),
          getUserAgent(req)
        );
        
        return NextResponse.json({
          success: true,
          data: results.map((r, i) => ({
            fileType: validatedData.files[i].fileType,
            url: r.url,
            key: r.key,
          })),
          message: 'Upload URLs generated successfully',
        });
      } else {
        // Validate single input
        const validatedData = uploadUrlSchema.parse(body);
        
        // Generate upload URL
        const result = await generateUploadUrl(
          validatedData.driverId,
          validatedData.fileType,
          validatedData.fileName,
          validatedData.contentType
        );
        
        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to generate upload URL',
              message: result.error,
            },
            { status: 400 }
          );
        }
        
        // Log admin action
        await logAdminAction(
          admin.id,
          AdminActions.DOCUMENT_UPLOADED,
          'driver',
          validatedData.driverId,
          {
            fileType: validatedData.fileType,
            fileName: validatedData.fileName,
          },
          getClientIp(req),
          getUserAgent(req)
        );
        
        return NextResponse.json({
          success: true,
          data: {
            url: result.url,
            key: result.key,
          },
          message: 'Upload URL generated successfully',
        });
      }
    } catch (error) {
      console.error('Failed to generate upload URL:', error);
      
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
          error: 'Failed to generate upload URL',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}
