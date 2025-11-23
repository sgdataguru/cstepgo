// File Upload Utilities for Activity Owner Portal

/**
 * Compress image file before upload
 */
export async function compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Maximum dimensions
                const maxWidth = 1920;
                const maxHeight = 1080;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    const aspectRatio = width / height;

                    if (width > height) {
                        width = maxWidth;
                        height = width / aspectRatio;
                    } else {
                        height = maxHeight;
                        width = height * aspectRatio;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Could not compress image'));
                            return;
                        }

                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });

                        resolve(compressedFile);
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Could not load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Could not read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Generate thumbnail from image file
 */
export async function generateThumbnail(file: File, size: number = 300): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const aspectRatio = img.width / img.height;

                let width = size;
                let height = size;

                if (aspectRatio > 1) {
                    height = size / aspectRatio;
                } else {
                    width = size * aspectRatio;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Could not generate thumbnail'));
                            return;
                        }
                        resolve(blob);
                    },
                    'image/jpeg',
                    0.7
                );
            };

            img.onerror = () => {
                reject(new Error('Could not load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Could not read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(file: File): boolean {
    return file.type === 'application/pdf';
}

/**
 * Read file as data URL
 */
export async function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };

        reader.onerror = () => {
            reject(new Error('Could not read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Create object URL for file preview
 */
export function createFilePreviewURL(file: File): string {
    return URL.createObjectURL(file);
}

/**
 * Revoke object URL to free memory
 */
export function revokeFilePreviewURL(url: string): void {
    URL.revokeObjectURL(url);
}

/**
 * Sanitize filename for safe upload
 */
export function sanitizeFilename(filename: string): string {
    // Remove special characters and spaces
    const sanitized = filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();

    // Ensure filename is not too long
    const maxLength = 100;
    if (sanitized.length > maxLength) {
        const extension = getFileExtension(sanitized);
        const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
        return nameWithoutExt.substring(0, maxLength - extension.length - 1) + '.' + extension;
    }

    return sanitized;
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
    const extension = getFileExtension(originalFilename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
    const sanitizedName = sanitizeFilename(nameWithoutExt);

    return `${sanitizedName}_${timestamp}_${random}.${extension}`;
}

/**
 * Batch compress multiple images
 */
export async function compressImages(files: File[], quality: number = 0.8): Promise<File[]> {
    const compressionPromises = files.map(file => compressImage(file, quality));
    return Promise.all(compressionPromises);
}

/**
 * Calculate total size of multiple files
 */
export function calculateTotalFileSize(files: File[]): number {
    return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Sort files by name
 */
export function sortFilesByName(files: File[]): File[] {
    return [...files].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort files by size
 */
export function sortFilesBySize(files: File[]): File[] {
    return [...files].sort((a, b) => a.size - b.size);
}

/**
 * Filter files by type
 */
export function filterFilesByType(files: File[], allowedTypes: string[]): File[] {
    return files.filter(file => allowedTypes.includes(file.type));
}
