// Activity Owner API Client Functions

import {
    ActivityOwner,
    LoginCredentials,
    RegistrationFormData,
    BusinessProfile,
    OwnerSession,
} from '@/types/activity-owner-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Register new activity owner
 */
export async function registerOwner(data: RegistrationFormData): Promise<{
    ownerId: string;
    verificationRequired: boolean;
}> {
    // For now, send basic data without file handling
    const registrationData = {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        website: data.website,
        businessType: data.businessType,
        yearsInBusiness: data.yearsInBusiness,
        taxRegistrationNumber: data.taxRegistrationNumber,
        businessLicenseNumber: data.businessLicenseNumber,
        primaryCategories: data.primaryCategories,
        secondaryCategories: data.secondaryCategories,
        specializations: data.specializations,
        location: data.location,
        operatingHours: data.operatingHours,
        seasonalOperation: data.seasonalOperation,
        preferredLanguages: data.preferredLanguages,
        marketingConsent: data.marketingConsent,
        termsAccepted: data.termsAccepted,
        privacyPolicyAccepted: data.privacyPolicyAccepted
    };

    const response = await fetch(`${API_BASE_URL}/activity-owners/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    return {
        ownerId: result.data?.id || 'mock-id',
        verificationRequired: true
    };
}

/**
 * Login activity owner
 */
export async function loginOwner(credentials: LoginCredentials): Promise<{
    token: string;
    owner: ActivityOwner;
}> {
    const response = await fetch(`${API_BASE_URL}/activity-owners/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // Store token in localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('activityOwnerToken', data.token);
    }

    return data;
}

/**
 * Logout activity owner
 */
export async function logoutOwner(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('activityOwnerToken') : null;

    if (token) {
        await fetch(`${API_BASE_URL}/activity-owners/logout`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        localStorage.removeItem('activityOwnerToken');
    }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ verified: boolean }> {
    const response = await fetch(`${API_BASE_URL}/activity-owners/verify-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Email verification failed');
    }

    return response.json();
}

/**
 * Verify phone with code
 */
export async function verifyPhone(code: string, phone: string): Promise<{ verified: boolean }> {
    const response = await fetch(`${API_BASE_URL}/activity-owners/verify-phone`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, phone }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Phone verification failed');
    }

    return response.json();
}

/**
 * Get current owner profile
 */
export async function getOwnerProfile(): Promise<BusinessProfile> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('activityOwnerToken') : null;

    const response = await fetch(`${API_BASE_URL}/activity-owners/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch profile');
    }

    return response.json();
}

/**
 * Update owner profile
 */
export async function updateOwnerProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('activityOwnerToken') : null;

    const response = await fetch(`${API_BASE_URL}/activity-owners/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
}

/**
 * Upload business photo
 */
export async function uploadBusinessPhoto(file: File): Promise<string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('activityOwnerToken') : null;
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE_URL}/activity-owners/upload-photo`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload photo');
    }

    const data = await response.json();
    return data.url;
}

/**
 * Upload verification document
 */
export async function uploadDocument(file: File, type: 'businessLicense' | 'insurance' | 'certification'): Promise<{
    documentUrl: string;
    verified: boolean;
}> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('activityOwnerToken') : null;
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/activity-owners/upload-documents`, {
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
 * Get authentication token from storage
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activityOwnerToken');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getAuthToken();
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<OwnerSession | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/activity-owners/session`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
    } catch (error) {
        return null;
    }
}
