import { z } from 'zod';

// Activity Category Enum
export const ActivityCategoryEnum = z.enum([
  'TOUR',
  'EXCURSION',
  'ATTRACTION',
  'ADVENTURE',
  'CULTURAL',
  'FOOD_DRINK',
  'WELLNESS',
  'WORKSHOP',
]);

// Activity Status Enum
export const ActivityStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
]);

// Day of Week Enum
export const DayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

// Schedule Type Enum
export const ScheduleTypeEnum = z.enum(['FIXED', 'FLEXIBLE']);

// Location Schema
export const LocationSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  country: z.string().default('Kazakhstan'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeId: z.string().optional(),
});

// Group Pricing Tier Schema
export const GroupPricingTierSchema = z.object({
  minParticipants: z.number().int().min(1),
  maxParticipants: z.number().int().min(1),
  pricePerPerson: z.number().int().min(1000, 'Price must be at least 1000 KZT'),
});

// Activity Schedule Schema
export const ActivityScheduleSchema = z.object({
  dayOfWeek: DayOfWeekEnum.optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  isRecurring: z.boolean().default(true),
  specificDate: z.string().datetime().transform(str => new Date(str)).optional(),
});

// Cancellation Policy Schema
export const CancellationPolicySchema = z.object({
  type: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']),
  refundPercentage: z.number().min(0).max(100),
  hoursBeforeActivity: z.number().int().min(0),
  description: z.string().optional(),
});

// Create Activity Schema
export const CreateActivitySchema = z.object({
  // Basic Info
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .min(100, 'Description must be at least 100 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  category: ActivityCategoryEnum,
  
  // Location
  location: LocationSchema,
  
  // Pricing
  pricePerPerson: z.number()
    .int()
    .min(1000, 'Price must be at least 1000 KZT')
    .max(1000000, 'Price cannot exceed 1,000,000 KZT'),
  groupPricing: z.array(GroupPricingTierSchema).optional(),
  
  // Capacity
  minParticipants: z.number()
    .int()
    .min(1, 'Minimum participants must be at least 1')
    .max(100, 'Minimum participants cannot exceed 100'),
  maxParticipants: z.number()
    .int()
    .min(1, 'Maximum participants must be at least 1')
    .max(100, 'Maximum participants cannot exceed 100'),
  
  // Duration
  durationMinutes: z.number()
    .int()
    .min(30, 'Duration must be at least 30 minutes')
    .max(1440, 'Duration cannot exceed 1 day (1440 minutes)'),
  
  // Schedule
  scheduleType: ScheduleTypeEnum,
  schedules: z.array(ActivityScheduleSchema).min(1, 'At least one schedule is required'),
  availableDays: z.array(DayOfWeekEnum).optional(),
  blackoutDates: z.array(z.string().datetime()).optional(),
  
  // Booking Settings
  advanceBookingDays: z.number()
    .int()
    .min(1, 'Advance booking must be at least 1 day')
    .max(365, 'Advance booking cannot exceed 365 days'),
  cancellationPolicy: CancellationPolicySchema,
  
  // Details
  inclusions: z.array(z.string()).min(1, 'At least one inclusion is required'),
  exclusions: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  
  // Photos (uploaded separately, just IDs)
  photoIds: z.array(z.string())
    .min(3, 'At least 3 photos are required')
    .max(10, 'Maximum 10 photos allowed'),
  
  // Status
  status: z.enum(['DRAFT', 'PENDING_APPROVAL']).default('DRAFT'),
}).refine(
  (data) => data.maxParticipants >= data.minParticipants,
  {
    message: 'Maximum participants must be greater than or equal to minimum participants',
    path: ['maxParticipants'],
  }
);

// Update Activity Schema (all fields optional except those that would break validation)
export const UpdateActivitySchema = z.object({
  // Basic Info
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must not exceed 100 characters')
    .optional(),
  description: z.string()
    .min(100, 'Description must be at least 100 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  category: ActivityCategoryEnum.optional(),
  
  // Location
  location: LocationSchema.optional(),
  
  // Pricing
  pricePerPerson: z.number()
    .int()
    .min(1000, 'Price must be at least 1000 KZT')
    .max(1000000, 'Price cannot exceed 1,000,000 KZT')
    .optional(),
  groupPricing: z.array(GroupPricingTierSchema).optional(),
  
  // Capacity
  minParticipants: z.number()
    .int()
    .min(1, 'Minimum participants must be at least 1')
    .max(100, 'Minimum participants cannot exceed 100')
    .optional(),
  maxParticipants: z.number()
    .int()
    .min(1, 'Maximum participants must be at least 1')
    .max(100, 'Maximum participants cannot exceed 100')
    .optional(),
  
  // Duration
  durationMinutes: z.number()
    .int()
    .min(30, 'Duration must be at least 30 minutes')
    .max(1440, 'Duration cannot exceed 1 day (1440 minutes)')
    .optional(),
  
  // Schedule
  scheduleType: ScheduleTypeEnum.optional(),
  schedules: z.array(ActivityScheduleSchema).optional(),
  availableDays: z.array(DayOfWeekEnum).optional(),
  blackoutDates: z.array(z.string().datetime()).optional(),
  
  // Booking Settings
  advanceBookingDays: z.number()
    .int()
    .min(1, 'Advance booking must be at least 1 day')
    .max(365, 'Advance booking cannot exceed 365 days')
    .optional(),
  cancellationPolicy: CancellationPolicySchema.optional(),
  
  // Details
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  
  // Photos
  photoIds: z.array(z.string()).optional(),
  
  // Status
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE']).optional(),
});

// Query Parameters Schema
export const OwnerActivitiesQuerySchema = z.object({
  status: z.enum(['ALL', 'DRAFT', 'ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']).default('ALL'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'bookings']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Toggle Status Schema
export const ToggleStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

// Activity Bookings Query Schema
export const ActivityBookingsQuerySchema = z.object({
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Export types
export type ActivityCategory = z.infer<typeof ActivityCategoryEnum>;
export type ActivityStatus = z.infer<typeof ActivityStatusEnum>;
export type DayOfWeek = z.infer<typeof DayOfWeekEnum>;
export type ScheduleType = z.infer<typeof ScheduleTypeEnum>;
export type Location = z.infer<typeof LocationSchema>;
export type GroupPricingTier = z.infer<typeof GroupPricingTierSchema>;
export type ActivityScheduleInput = z.infer<typeof ActivityScheduleSchema>;
export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
export type OwnerActivitiesQuery = z.infer<typeof OwnerActivitiesQuerySchema>;
export type ToggleStatusInput = z.infer<typeof ToggleStatusSchema>;
export type ActivityBookingsQuery = z.infer<typeof ActivityBookingsQuerySchema>;
