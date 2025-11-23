// Activities API Client Functions

import {
    Activity,
    CreateActivityData,
    ActivityFilters,
    PaginatedActivityResponse,
    ActivityStats,
    AvailabilitySlot,
} from '@/types/activity-types';
import { getAuthToken } from './activity-owners-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Get all activities for current owner
 */
export async function getActivities(filters?: ActivityFilters): Promise<PaginatedActivityResponse> {
    const token = getAuthToken();

    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });
    }

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/activities?${queryParams.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch activities');
    }

    return response.json();
}

/**
 * Get single activity by ID
 */
export async function getActivity(id: string): Promise<Activity> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/activities/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch activity');
    }

    return response.json();
}

/**
 * Create new activity
 */
export async function createActivity(data: CreateActivityData): Promise<Activity> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/activities`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create activity');
    }

    return response.json();
}

/**
 * Update existing activity
 */
export async function updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/activities/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update activity');
    }

    return response.json();
}

/**
 * Delete activity
 */
export async function deleteActivity(id: string): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/activities/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete activity');
    }
}

/**
 * Toggle activity active status
 */
export async function toggleActivityStatus(id: string, isActive: boolean): Promise<Activity> {
    return updateActivity(id, { isActive });
}

/**
 * Update activity availability
 */
export async function updateActivityAvailability(
    activityId: string,
    slots: AvailabilitySlot[]
): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/activities/${activityId}/availability`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ slots }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update availability');
    }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(activityId: string): Promise<ActivityStats> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/activities/${activityId}/stats`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch activity stats');
    }

    return response.json();
}

/**
 * Duplicate activity
 */
export async function duplicateActivity(id: string): Promise<Activity> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/activities/${id}/duplicate`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to duplicate activity');
    }

    return response.json();
}

/**
 * Bulk update activities
 */
export async function bulkUpdateActivities(
    ids: string[],
    updates: Partial<Activity>
): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/activities/bulk-update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids, updates }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk update activities');
    }
}

/**
 * Bulk delete activities
 */
export async function bulkDeleteActivities(ids: string[]): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/activities/bulk-delete`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk delete activities');
    }
}
