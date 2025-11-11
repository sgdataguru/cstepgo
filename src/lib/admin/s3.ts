import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface PresignedUrlResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Generate a unique file key for S3
 * @param driverId Driver ID
 * @param fileType Type of document (e.g., 'license', 'vehicle_registration')
 * @param extension File extension
 * @returns S3 key
 */
export function generateDocumentKey(
  driverId: string,
  fileType: string,
  extension: string
): string {
  const timestamp = Date.now();
  const randomId = nanoid(8);
  return `drivers/${driverId}/${fileType}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Generate a pre-signed URL for document upload
 * @param driverId Driver ID
 * @param fileType Type of document
 * @param fileName Original file name
 * @param contentType MIME type
 * @param expiresIn URL expiration time in seconds (default: 1 hour)
 * @returns Pre-signed URL result
 */
export async function generateUploadUrl(
  driverId: string,
  fileType: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<PresignedUrlResult> {
  try {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('AWS S3 bucket not configured');
    }

    // Extract file extension
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(contentType)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, PDF');
    }

    // Validate extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid file extension');
    }

    // Generate unique key
    const key = generateDocumentKey(driverId, fileType, extension);

    // Create upload command with encryption
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'driver-id': driverId,
        'file-type': fileType,
        'original-name': fileName,
        'uploaded-at': new Date().toISOString(),
      },
    });

    // Generate pre-signed URL
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate multiple pre-signed URLs for batch upload
 * @param driverId Driver ID
 * @param files Array of file info
 * @returns Array of pre-signed URL results
 */
export async function generateBatchUploadUrls(
  driverId: string,
  files: Array<{
    fileType: string;
    fileName: string;
    contentType: string;
  }>
): Promise<PresignedUrlResult[]> {
  const results = await Promise.all(
    files.map((file) =>
      generateUploadUrl(
        driverId,
        file.fileType,
        file.fileName,
        file.contentType
      )
    )
  );

  return results;
}

/**
 * Get public URL for an uploaded document
 * @param key S3 key
 * @returns Public URL
 */
export function getDocumentUrl(key: string): string {
  const cdnUrl = process.env.NEXT_PUBLIC_S3_CDN_URL;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (cdnUrl) {
    return `${cdnUrl}/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Document types for driver registration
 */
export const DocumentTypes = {
  DRIVER_LICENSE: 'driver_license',
  VEHICLE_REGISTRATION: 'vehicle_registration',
  VEHICLE_INSURANCE: 'vehicle_insurance',
  VEHICLE_PHOTO: 'vehicle_photo',
  PROFILE_PHOTO: 'profile_photo',
  BACKGROUND_CHECK: 'background_check',
} as const;

export type DocumentType = typeof DocumentTypes[keyof typeof DocumentTypes];
