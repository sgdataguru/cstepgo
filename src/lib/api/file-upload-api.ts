// File Upload API Client Functions

import { ActivityPhoto } from '@/types/activity-types';
import { getAuthToken } from './activity-owners-api';
import { compressImage } from '@/lib/utils/file-upload-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

/**
 * Upload activity photos with progress tracking
 */
export async function uploadActivityPhotos(
    activityId: string,
    files: File[],
    captions?: string[],
    onProgress?: (progress: UploadProgress) => void
): Promise<ActivityPhoto[]> {
    const token = getAuthToken();

    // Compress images before upload
    const compressedFiles = await Promise.all(
        files.map(file => compressImage(file, 0.85))
    );

    const formData = new FormData();
    formData.append('activityId', activityId);

    compressedFiles.forEach((file, index) => {
        formData.append('photos', file);
        if (captions && captions[index]) {
            formData.append(`captions`, captions[index]);
        }
    });

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                });
            }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.photos);
                } catch (error) {
                    reject(new Error('Invalid response from server'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || 'Upload failed'));
                } catch {
                    reject(new Error('Upload failed'));
                }
            }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        // Send request
        xhr.open('POST', `${API_BASE_URL}/upload/activity-photos`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}

/**
 * Delete activity photo
 */
export async function deleteActivityPhoto(photoId: string): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/upload/activity-photos/${photoId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete photo');
    }
}

/**
 * Reorder activity photos
 */
export async function reorderActivityPhotos(
    activityId: string,
    photoIds: string[]
): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/upload/activity-photos/reorder`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activityId, photoIds }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reorder photos');
    }
}

/**
 * Update photo caption
 */
export async function updatePhotoCaption(photoId: string, caption: string): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/upload/activity-photos/${photoId}/caption`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update caption');
    }
}

/**
 * Upload single activity photo
 */
export async function uploadSinglePhoto(
    activityId: string,
    file: File,
    caption?: string
): Promise<ActivityPhoto> {
    const photos = await uploadActivityPhotos(activityId, [file], caption ? [caption] : undefined);
    return photos[0];
}

/**
 * Upload business logo
 */
export async function uploadBusinessLogo(file: File): Promise<string> {
    const token = getAuthToken();
    const compressedFile = await compressImage(file, 0.9);

    const formData = new FormData();
    formData.append('logo', compressedFile);

    const response = await fetch(`${API_BASE_URL}/upload/business-logo`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload logo');
    }

    const data = await response.json();
    return data.url;
}

/**
 * Upload business cover photo
 */
export async function uploadBusinessCoverPhoto(file: File): Promise<string> {
    const token = getAuthToken();
    const compressedFile = await compressImage(file, 0.85);

    const formData = new FormData();
    formData.append('coverPhoto', compressedFile);

    const response = await fetch(`${API_BASE_URL}/upload/business-cover`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload cover photo');
    }

    const data = await response.json();
    return data.url;
}

/**
 * Upload verification document
 */
export async function uploadVerificationDocument(
    file: File,
    type: 'businessLicense' | 'insurance' | 'certification'
): Promise<{ url: string; verified: boolean }> {
    const token = getAuthToken();

    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/upload/verification-documents`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload document');
    }

    return response.json();
}

/**
 * Get signed upload URL (for direct cloud upload)
 */
export async function getSignedUploadUrl(
    fileName: string,
    fileType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/upload/signed-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName, fileType }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get upload URL');
    }

    return response.json();
}
