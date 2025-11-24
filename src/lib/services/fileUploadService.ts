import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// Allowed file types by category
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
  ],
  documents: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ],
  all: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
  ],
};

// File size limits (in bytes)
const SIZE_LIMITS = {
  profileImage: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  vehiclePhoto: 5 * 1024 * 1024, // 5MB
  default: 10 * 1024 * 1024, // 10MB
};

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'steppergo-documents';
const CDN_URL = process.env.NEXT_PUBLIC_S3_CDN_URL;

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  category?: keyof typeof ALLOWED_MIME_TYPES;
  purpose?: keyof typeof SIZE_LIMITS;
}

export interface UploadResult {
  id: string;
  url: string;
  key: string;
  bucket: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File | { name: string; type: string; size: number },
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    allowedTypes = options.category ? ALLOWED_MIME_TYPES[options.category] : ALLOWED_MIME_TYPES.all,
    maxSize = options.purpose ? SIZE_LIMITS[options.purpose] : SIZE_LIMITS.default,
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate a secure random filename
 */
function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomBytes}${ext}`;
}

/**
 * Get S3 key for file based on purpose
 */
function getS3Key(purpose: string, filename: string, userId: string): string {
  const sanitizedPurpose = purpose.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `${sanitizedPurpose}/${userId}/${filename}`;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
  file: Buffer,
  originalName: string,
  mimeType: string,
  userId: string,
  purpose: string
): Promise<UploadResult> {
  // Generate secure filename
  const storedName = generateSecureFilename(originalName);
  const key = getS3Key(purpose, storedName, userId);

  try {
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        originalName,
        userId,
        purpose,
        uploadedAt: new Date().toISOString(),
      },
      // Server-side encryption
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);

    // Generate URL
    const url = CDN_URL
      ? `${CDN_URL}/${key}`
      : `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      id: crypto.randomBytes(16).toString('hex'),
      url,
      key,
      bucket: S3_BUCKET,
      originalName,
      storedName,
      mimeType,
      size: file.length,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Generate a signed URL for private file access
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from storage');
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory traversal patterns
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove any path separators
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove special characters except dot, dash, underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized;
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'application/pdf': '.pdf',
  };

  return mimeToExt[mimeType] || '';
}
