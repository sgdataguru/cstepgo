// Activity Data Formatters

import { LocationData } from '@/types/activity-owner-types';
import { AvailabilitySlot } from '@/types/activity-types';
import { CURRENCIES } from './activity-constants';

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: string = 'KZT'): string {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;

    // Format number with thousand separators
    const formattedAmount = amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    // Place symbol before or after based on currency
    if (currency === 'USD' || currency === 'EUR') {
        return `${symbol}${formattedAmount}`;
    }

    return `${formattedAmount} ${symbol}`;
}

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return hours === 1 ? '1 hour' : `${hours} hours`;
    }

    const hoursPart = hours === 1 ? '1 hour' : `${hours} hours`;
    const minutesPart = `${remainingMinutes} min`;

    return `${hoursPart} ${minutesPart}`;
}

/**
 * Format location data to readable address
 */
export function formatLocation(location: LocationData): string {
    const parts = [];

    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);

    return parts.join(', ');
}

/**
 * Format short location (city and region only)
 */
export function formatShortLocation(location: LocationData): string {
    const parts = [];

    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);

    return parts.join(', ') || 'Location not specified';
}

/**
 * Format availability slots to readable format
 */
export function formatAvailability(slots: AvailabilitySlot[]): string {
    if (!slots || slots.length === 0) {
        return 'No availability set';
    }

    const availableSlots = slots.filter(slot => !slot.isBlocked && slot.availableSpots > 0);

    if (availableSlots.length === 0) {
        return 'Currently unavailable';
    }

    // Group by date
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        const dateKey = slot.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(slot);
        return acc;
    }, {} as Record<string, AvailabilitySlot[]>);

    const dateCount = Object.keys(slotsByDate).length;

    if (dateCount === 1) {
        return '1 day available';
    }

    return `${dateCount} days available`;
}

/**
 * Format date to readable format
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'full' = 'short'): string {
    const d = new Date(date);

    switch (format) {
        case 'short':
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        case 'long':
            return d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        case 'full':
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        default:
            return d.toLocaleDateString();
    }
}

/**
 * Format time (HH:MM format to readable)
 */
export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time range
 */
export function formatTimeRange(startTime: string, endTime: string): string {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Format participant count
 */
export function formatParticipants(count: number): string {
    return count === 1 ? '1 participant' : `${count} participants`;
}

/**
 * Format participant range
 */
export function formatParticipantRange(min: number, max: number): string {
    if (min === max) {
        return `${min} ${min === 1 ? 'person' : 'people'}`;
    }
    return `${min}-${max} people`;
}

/**
 * Format age restriction
 */
export function formatAgeRestriction(minAge?: number, maxAge?: number): string {
    if (!minAge && !maxAge) {
        return 'All ages welcome';
    }

    if (minAge && !maxAge) {
        return `${minAge}+ years`;
    }

    if (!minAge && maxAge) {
        return `Up to ${maxAge} years`;
    }

    return `${minAge}-${maxAge} years`;
}

/**
 * Format rating
 */
export function formatRating(rating: number): string {
    return rating.toFixed(1);
}

/**
 * Format review count
 */
export function formatReviewCount(count: number): string {
    if (count === 0) {
        return 'No reviews';
    }
    return count === 1 ? '1 review' : `${count} reviews`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        const meters = Math.round(km * 1000);
        return `${meters} m`;
    }

    return `${km.toFixed(1)} km`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format based on length
    if (cleaned.length === 11 && cleaned.startsWith('7')) {
        // Kazakhstan format: +7 (XXX) XXX-XX-XX
        return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }

    return phone;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format list to readable string
 */
export function formatList(items: string[], max: number = 3): string {
    if (items.length === 0) {
        return 'None';
    }

    if (items.length <= max) {
        if (items.length === 1) {
            return items[0];
        }
        if (items.length === 2) {
            return `${items[0]} and ${items[1]}`;
        }
        return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
    }

    const remaining = items.length - max;
    return `${items.slice(0, max).join(', ')}, and ${remaining} more`;
}
