// Bookings API Client Functions

import {
    Booking,
    BookingFilters,
    PaginatedBookingResponse,
    BookingActionRequest,
    BookingUpdateData,
    BookingStatistics,
} from '@/types/booking-types';
import { getAuthToken } from './activity-owners-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Get all bookings for current owner
 */
export async function getBookings(filters?: BookingFilters): Promise<PaginatedBookingResponse> {
    const token = getAuthToken();

    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof Date) {
                    queryParams.append(key, value.toISOString());
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });
    }

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings?${queryParams.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookings');
    }

    return response.json();
}

/**
 * Get single booking by ID
 */
export async function getBooking(id: string): Promise<Booking> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/bookings/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch booking');
    }

    return response.json();
}

/**
 * Accept booking request
 */
export async function acceptBooking(bookingId: string, message?: string): Promise<Booking> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/accept`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept booking');
    }

    return response.json();
}

/**
 * Decline booking request
 */
export async function declineBooking(bookingId: string, reason: string): Promise<Booking> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/decline`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reason }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to decline booking');
    }

    return response.json();
}

/**
 * Cancel booking
 */
export async function cancelBooking(bookingId: string, reason: string): Promise<Booking> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/cancel`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reason }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
    }

    return response.json();
}

/**
 * Mark booking as completed
 */
export async function completeBooking(bookingId: string): Promise<Booking> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/complete`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete booking');
    }

    return response.json();
}

/**
 * Update booking details
 */
export async function updateBooking(id: string, data: BookingUpdateData): Promise<Booking> {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/activity-owners/bookings/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update booking');
    }

    return response.json();
}

/**
 * Send message to customer
 */
export async function sendMessage(bookingId: string, message: string): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/messages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
    }
}

/**
 * Send message with attachment
 */
export async function sendMessageWithAttachment(
    bookingId: string,
    message: string,
    file: File
): Promise<void> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('message', message);
    formData.append('attachment', file);

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/messages`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
    }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(bookingId: string): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/messages/read`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark messages as read');
    }
}

/**
 * Get booking statistics
 */
export async function getBookingStatistics(period: 'week' | 'month' | 'quarter' | 'year'): Promise<BookingStatistics> {
    const token = getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/statistics?period=${period}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch booking statistics');
    }

    return response.json();
}

/**
 * Respond to customer review
 */
export async function respondToReview(bookingId: string, response: string): Promise<void> {
    const token = getAuthToken();

    const res = await fetch(
        `${API_BASE_URL}/activity-owners/bookings/${bookingId}/review/respond`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ response }),
        }
    );

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to respond to review');
    }
}
