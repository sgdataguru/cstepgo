// Activity TypeScript interfaces for StepperGO

import { LocationData } from './activity-owner-types';

/**
 * Activity Category - Types of activities offered
 */
export type ActivityCategory =
    | 'adventure-sports'
    | 'water-sports'
    | 'winter-sports'
    | 'cultural-tours'
    | 'wildlife-safari'
    | 'mountain-trekking'
    | 'cycling-tours'
    | 'horseback-riding'
    | 'accommodation'
    | 'rental-services'
    | 'other';

/**
 * Difficulty Level
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'hard' | 'expert';

/**
 * Activity - Complete activity information
 */
export interface Activity {
    id: string;
    ownerId: string;
    ownerName: string;
    category: ActivityCategory;
    name: string;
    description: string;
    shortDescription: string;
    duration: number; // minutes
    difficultyLevel: DifficultyLevel;
    minParticipants: number;
    maxParticipants: number;
    minAge?: number;
    maxAge?: number;
    basePrice: number;
    currency: string;
    equipmentIncluded: string[];
    equipmentRental?: EquipmentRental[];
    equipmentRequired?: string[];
    requirements: string[];
    safetyNotes: string;
    cancellationPolicy: string;
    location?: LocationData;
    accessInstructions?: string;
    photos: ActivityPhoto[];
    availability: AvailabilitySlot[];
    pricingPackages?: PricingPackage[];
    groupDiscounts?: GroupDiscount[];
    isActive: boolean;
    featured: boolean;
    rating: number;
    reviewCount: number;
    bookingCount: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Activity Photo - Image with metadata
 */
export interface ActivityPhoto {
    id: string;
    url: string;
    thumbnailUrl: string;
    caption?: string;
    sortOrder: number;
    uploadedAt: Date;
}

/**
 * Availability Slot - Time slots when activity is available
 */
export interface AvailabilitySlot {
    id: string;
    activityId: string;
    date: Date;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    availableSpots: number;
    bookedSpots: number;
    isBlocked: boolean;
    blockReason?: string;
}

/**
 * Pricing Package - Special pricing options
 */
export interface PricingPackage {
    id: string;
    name: string;
    description: string;
    price: number;
    includes: string[];
    maxParticipants: number;
    validFrom?: Date;
    validUntil?: Date;
}

/**
 * Group Discount - Discounts for group bookings
 */
export interface GroupDiscount {
    id: string;
    minParticipants: number;
    maxParticipants: number;
    discountPercentage: number;
    description: string;
}

/**
 * Equipment Rental - Optional equipment for rent
 */
export interface EquipmentRental {
    id: string;
    item: string;
    price: number;
    quantity: number;
    description?: string;
}

/**
 * Create Activity Data - Data required to create a new activity
 */
export interface CreateActivityData {
    category: ActivityCategory;
    name: string;
    description: string;
    shortDescription: string;
    duration: number;
    difficultyLevel: DifficultyLevel;
    minParticipants: number;
    maxParticipants: number;
    ageRestrictions?: {
        minAge?: number;
        maxAge?: number;
    };
    pricing: {
        basePrice: number;
        currency: string;
        packages?: Omit<PricingPackage, 'id'>[];
        groupDiscounts?: Omit<GroupDiscount, 'id'>[];
    };
    equipment: {
        included: string[];
        rental?: Omit<EquipmentRental, 'id'>[];
        required?: string[];
    };
    location?: {
        coordinates: { lat: number; lng: number };
        address: string;
        accessInstructions?: string;
    };
    requirements: string[];
    safetyNotes: string;
    cancellationPolicy: string;
}

/**
 * Activity Form Data - Form state for activity creation/editing
 */
export interface ActivityFormData {
    // Basic Information
    category?: ActivityCategory;
    name?: string;
    description?: string;
    shortDescription?: string;
    duration?: number;
    difficultyLevel?: DifficultyLevel;

    // Participant Limits
    minParticipants?: number;
    maxParticipants?: number;
    minAge?: number;
    maxAge?: number;

    // Pricing
    basePrice?: number;
    currency?: string;
    pricingPackages?: Partial<PricingPackage>[];
    groupDiscounts?: Partial<GroupDiscount>[];

    // Equipment
    equipmentIncluded?: string[];
    equipmentRental?: Partial<EquipmentRental>[];
    equipmentRequired?: string[];

    // Location
    location?: Partial<LocationData>;
    accessInstructions?: string;

    // Details
    requirements?: string[];
    safetyNotes?: string;
    cancellationPolicy?: string;

    // Photos
    photos?: ActivityPhoto[];
    newPhotos?: File[];

    // Availability
    availability?: AvailabilitySlot[];
}

/**
 * Activity Filters - Query filters for activity list
 */
export interface ActivityFilters {
    category?: ActivityCategory;
    status?: 'active' | 'inactive' | 'all';
    featured?: boolean;
    sortBy?: 'name' | 'rating' | 'bookings' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

/**
 * Paginated Activity Response
 */
export interface PaginatedActivityResponse {
    activities: Activity[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

/**
 * Activity Stats - Performance metrics for an activity
 */
export interface ActivityStats {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
    conversionRate: number; // views to bookings
    popularityTrend: number; // percentage change
}

/**
 * Compact Activity Info - For cards and listings
 */
export interface CompactActivityInfo {
    id: string;
    name: string;
    category: ActivityCategory;
    shortDescription: string;
    basePrice: number;
    currency: string;
    duration: number;
    difficultyLevel: DifficultyLevel;
    rating: number;
    reviewCount: number;
    thumbnailUrl?: string;
    location: {
        city: string;
        region: string;
    };
    availableSpots: number;
    featured: boolean;
}
