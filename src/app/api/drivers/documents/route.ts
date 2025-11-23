import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Document types for validation
const documentTypes = [
  'drivers_license',
  'vehicle_registration',
  'insurance_certificate',
  'passport',
  'national_id',
  'bank_statement',
  'criminal_background_check',
  'vehicle_photos'
] as const;

// Validation schema for document upload
const documentUploadSchema = z.object({
  documentType: z.enum(documentTypes, {
    errorMap: () => ({ message: 'Invalid document type' })
  }),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().min(1, 'File size must be greater than 0'),
  mimeType: z.string().refine(
    (type) => type.startsWith('image/') || type === 'application/pdf',
    'File must be an image or PDF'
  ),
  fileUrl: z.string().url('Valid file URL is required'),
  description: z.string().optional(),
  expiryDate: z.string().optional().refine(
    (date) => !date || new Date(date) > new Date(),
    'Expiry date must be in the future'
  )
});

// Get driver from session - simplified for now
async function getDriverFromRequest(request: NextRequest) {
  // In a real implementation, you'd verify the session token
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validatedData = documentUploadSchema.parse(body);
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Check if driver is in a state where they can upload documents
    if (driver.status === 'REJECTED' || driver.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Cannot upload documents. Account is rejected or suspended.' },
        { status: 403 }
      );
    }
    
    // Get current documents
    const currentDocuments = driver.documentsUrl as Record<string, any> || {};
    
    // Add new document to the documents object
    const newDocument = {
      fileName: validatedData.fileName,
      fileSize: validatedData.fileSize,
      mimeType: validatedData.mimeType,
      fileUrl: validatedData.fileUrl,
      description: validatedData.description,
      expiryDate: validatedData.expiryDate,
      uploadedAt: new Date().toISOString(),
      status: 'pending_review',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null
    };
    
    // Update documents in database
    currentDocuments[validatedData.documentType] = newDocument;
    
    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        documentsUrl: currentDocuments
      }
    });
    
    // Check if all required documents are uploaded
    const requiredDocs = ['drivers_license', 'vehicle_registration', 'insurance_certificate'];
    const uploadedDocs = Object.keys(currentDocuments);
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));
    
    let message = 'Document uploaded successfully.';
    let nextSteps: string[] = [];
    
    if (missingDocs.length > 0) {
      nextSteps.push(`Upload missing documents: ${missingDocs.join(', ')}`);
    } else {
      nextSteps.push('All required documents uploaded. Waiting for admin review.');
      message = 'All required documents uploaded successfully. Your application is now under review.';
    }
    
    return NextResponse.json({
      success: true,
      message,
      data: {
        documentType: validatedData.documentType,
        status: newDocument.status,
        uploadedAt: newDocument.uploadedAt,
        documentsStatus: {
          total: uploadedDocs.length,
          required: requiredDocs.length,
          missing: missingDocs,
          allRequiredUploaded: missingDocs.length === 0
        },
        nextSteps
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Document upload error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Document upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Get current documents
    const documents = driver.documentsUrl as Record<string, any> || {};
    
    // Required documents list
    const requiredDocs = [
      { type: 'drivers_license', name: "Driver's License", required: true },
      { type: 'vehicle_registration', name: 'Vehicle Registration', required: true },
      { type: 'insurance_certificate', name: 'Insurance Certificate', required: true },
      { type: 'passport', name: 'Passport', required: false },
      { type: 'national_id', name: 'National ID', required: false },
      { type: 'bank_statement', name: 'Bank Statement', required: false },
      { type: 'criminal_background_check', name: 'Criminal Background Check', required: false },
      { type: 'vehicle_photos', name: 'Vehicle Photos', required: false }
    ];
    
    // Map documents with status
    const documentStatus = requiredDocs.map(doc => ({
      type: doc.type,
      name: doc.name,
      required: doc.required,
      uploaded: !!documents[doc.type],
      status: documents[doc.type]?.status || 'not_uploaded',
      uploadedAt: documents[doc.type]?.uploadedAt,
      expiryDate: documents[doc.type]?.expiryDate,
      reviewNotes: documents[doc.type]?.reviewNotes
    }));
    
    const uploadedCount = documentStatus.filter(doc => doc.uploaded).length;
    const requiredCount = documentStatus.filter(doc => doc.required).length;
    const requiredUploadedCount = documentStatus.filter(doc => doc.required && doc.uploaded).length;
    
    return NextResponse.json({
      success: true,
      data: {
        driver: {
          id: driver.id,
          status: driver.status,
          isVerified: driver.isVerified
        },
        documents: documentStatus,
        summary: {
          totalDocuments: uploadedCount,
          requiredDocuments: requiredCount,
          requiredUploaded: requiredUploadedCount,
          allRequiredUploaded: requiredUploadedCount === requiredCount,
          completionPercentage: Math.round((requiredUploadedCount / requiredCount) * 100)
        }
      }
    });
    
  } catch (error) {
    console.error('Get documents error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}

// Delete document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('type');
    
    if (!documentType || !documentTypes.includes(documentType as any)) {
      return NextResponse.json(
        { error: 'Invalid or missing document type' },
        { status: 400 }
      );
    }
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Get current documents
    const currentDocuments = driver.documentsUrl as Record<string, any> || {};
    
    if (!currentDocuments[documentType]) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Remove document
    delete currentDocuments[documentType];
    
    // Update database
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        documentsUrl: currentDocuments
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete document error:', error);
    
    if (error instanceof Error && error.message === 'Driver not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
