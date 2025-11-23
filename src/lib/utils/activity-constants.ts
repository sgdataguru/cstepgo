// Activity Owner Constants and Configuration
// Comprehensive constants for activity marketplace

import { 
  ActivityCategory, 
  DifficultyLevel, 
  RegistrationStep 
} from '@/types/activity-owner-types';

/**
 * Activity Categories with comprehensive metadata
 */
export const ACTIVITY_CATEGORIES: {
    value: ActivityCategory;
    label: string;
    icon: string;
    description: string;
    examples: string[];
    avgDuration: { min: number; max: number };
    avgPrice: { min: number; max: number; currency: string };
}[] = [
        {
            value: 'adventure-sports',
            label: 'Adventure Sports',
            icon: '🏔️',
            description: 'High-adrenaline outdoor activities and extreme sports',
            examples: ['Paragliding', 'Zip Line', 'Rock Climbing', 'Bungee Jumping'],
            avgDuration: { min: 60, max: 480 },
            avgPrice: { min: 8000, max: 25000, currency: 'KZT' }
        },
        {
            value: 'winter-activities',
            label: 'Winter Activities',
            icon: '⛷️',
            description: 'Snow and ice-based seasonal activities',
            examples: ['Skiing', 'Snowboarding', 'Dog Sledding', 'Ice Skating'],
            avgDuration: { min: 120, max: 480 },
            avgPrice: { min: 5000, max: 20000, currency: 'KZT' }
        },
        {
            value: 'equipment-rentals',
            label: 'Equipment Rentals',
            icon: '🚴',
            description: 'Sports and adventure equipment rental services',
            examples: ['Bike Rentals', 'Ski Equipment', 'Camping Gear', 'Water Sports'],
            avgDuration: { min: 60, max: 1440 },
            avgPrice: { min: 2000, max: 10000, currency: 'KZT' }
        },
        {
            value: 'cultural-traditional',
            label: 'Cultural & Traditional',
            icon: '�',
            description: 'Authentic local cultural experiences and traditions',
            examples: ['Horse Riding', 'Yurt Stays', 'Eagle Hunting', 'Craft Workshops'],
            avgDuration: { min: 120, max: 1440 },
            avgPrice: { min: 6000, max: 30000, currency: 'KZT' }
        },
        {
            value: 'water-activities',
            label: 'Water Activities',
            icon: '🚤',
            description: 'Lake and river-based water activities',
            examples: ['Boating', 'Fishing Tours', 'Swimming', 'Water Sports'],
            avgDuration: { min: 60, max: 480 },
            avgPrice: { min: 4000, max: 15000, currency: 'KZT' }
        },
        {
            value: 'air-activities',
            label: 'Air Activities',
            icon: '🎈',
            description: 'Aerial experiences and sky tours',
            examples: ['Hot Air Balloon', 'Helicopter Tours', 'Drone Photography'],
            avgDuration: { min: 30, max: 180 },
            avgPrice: { min: 15000, max: 50000, currency: 'KZT' }
        },
        {
            value: 'accommodation',
            label: 'Accommodation',
            icon: '🏕️',
            description: 'Unique stays and lodging experiences',
            examples: ['Eco Lodges', 'Glamping', 'Traditional Homes', 'Mountain Huts'],
            avgDuration: { min: 720, max: 10080 },
            avgPrice: { min: 8000, max: 25000, currency: 'KZT' }
        },
        {
            value: 'food-experiences',
            label: 'Food Experiences',
            icon: '🍽️',
            description: 'Culinary tours and cooking experiences',
            examples: ['Cooking Classes', 'Food Tours', 'Wine Tasting', 'Farm Visits'],
            avgDuration: { min: 90, max: 360 },
            avgPrice: { min: 3000, max: 12000, currency: 'KZT' }
        },
        {
            value: 'wellness-health',
            label: 'Wellness & Health',
            icon: '🧘',
            description: 'Health, wellness and spa experiences',
            examples: ['Yoga Retreats', 'Spa Treatments', 'Meditation', 'Thermal Springs'],
            avgDuration: { min: 60, max: 480 },
            avgPrice: { min: 4000, max: 15000, currency: 'KZT' }
        },
        {
            value: 'photography',
            label: 'Photography',
            icon: '📸',
            description: 'Photography tours and workshops',
            examples: ['Photo Tours', 'Wildlife Photography', 'Landscape Workshops'],
            avgDuration: { min: 120, max: 720 },
            avgPrice: { min: 5000, max: 18000, currency: 'KZT' }
        },
        {
            value: 'wildlife',
            label: 'Wildlife',
            icon: '🦌',
            description: 'Wildlife viewing and conservation experiences',
            examples: ['Safari Tours', 'Bird Watching', 'Wildlife Tracking'],
            avgDuration: { min: 180, max: 720 },
            avgPrice: { min: 7000, max: 22000, currency: 'KZT' }
        },
        {
            value: 'educational',
            label: 'Educational',
            icon: '📚',
            description: 'Learning experiences and skill workshops',
            examples: ['Language Classes', 'History Tours', 'Skill Workshops'],
            avgDuration: { min: 90, max: 480 },
            avgPrice: { min: 3000, max: 10000, currency: 'KZT' }
        },
    ];

/**
 * Difficulty Levels with metadata
 */
export const DIFFICULTY_LEVELS: {
    value: DifficultyLevel;
    label: string;
    description: string;
    color: string;
    requirements: string[];
    ageRecommendation: string;
}[] = [
        {
            value: 'easy',
            label: 'Easy',
            description: 'No experience required - perfect for beginners',
            color: 'green',
            requirements: ['Basic physical fitness', 'Willingness to learn'],
            ageRecommendation: '8+ years'
        },
        {
            value: 'moderate',
            label: 'Moderate',
            description: 'Some experience helpful but not required',
            color: 'blue',
            requirements: ['Good physical condition', 'Basic outdoor experience'],
            ageRecommendation: '12+ years'
        },
        {
            value: 'hard',
            label: 'Hard',
            description: 'Previous experience and good fitness required',
            color: 'orange',
            requirements: ['Previous experience', 'Excellent physical condition', 'Comfort with challenges'],
            ageRecommendation: '16+ years'
        },
        {
            value: 'expert',
            label: 'Expert',
            description: 'Advanced skills and extensive experience required',
            color: 'red',
            requirements: ['Advanced skills', 'Extensive experience', 'Professional-level fitness'],
            ageRecommendation: '18+ years'
        },
    ];
export const REGISTRATION_STEP_DATA: Record<RegistrationStep, {
    title: string;
    description: string;
    icon: string;
    fields: string[];
    estimatedTime: number; // minutes
    tips: string[];
}> = {
    1: {
        title: 'Business Information',
        description: 'Tell us about your business and what makes it special',
        icon: '🏢',
        fields: ['businessName', 'businessDescription', 'contactPerson', 'email', 'phone', 'website'],
        estimatedTime: 5,
        tips: [
            'Use a clear, memorable business name',
            'Write a compelling description that highlights your unique selling points',
            'Provide accurate contact information for verification'
        ]
    },
    2: {
        title: 'Activity Categories',
        description: 'Choose the types of activities you offer',
        icon: '🎯',
        fields: ['primaryCategories', 'secondaryCategories', 'specializations'],
        estimatedTime: 3,
        tips: [
            'Select your main activity category carefully - this affects your search ranking',
            'You can add secondary categories to reach more customers',
            'Be specific about your specializations and unique offerings'
        ]
    },
    3: {
        title: 'Location & Hours',
        description: 'Where do you operate and when are you available?',
        icon: '📍',
        fields: ['location', 'operatingHours', 'seasonalOperation'],
        estimatedTime: 7,
        tips: [
            'Pin your exact location on the map for accurate directions',
            'Set realistic operating hours that you can maintain',
            'Include seasonal variations if applicable'
        ]
    },
    4: {
        title: 'Documents',
        description: 'Upload your business documents for verification',
        icon: '📄',
        fields: ['businessLicense', 'insurance', 'certifications', 'identification'],
        estimatedTime: 10,
        tips: [
            'Upload clear, high-quality images of your documents',
            'Ensure all documents are current and valid',
            'Business license and insurance are typically required'
        ]
    },
    5: {
        title: 'Verification',
        description: 'Verify your email and phone number to complete registration',
        icon: '✅',
        fields: ['emailVerification', 'phoneVerification', 'termsAcceptance'],
        estimatedTime: 5,
        tips: [
            'Check your email and SMS for verification codes',
            'Keep your phone nearby for SMS verification',
            'Review terms and conditions carefully before accepting'
        ]
    }
};

/**
 * Supported Currencies
 */
export const CURRENCIES = [
    { code: 'KZT', symbol: '₸', label: 'Kazakhstani Tenge' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'RUB', symbol: '₽', label: 'Russian Ruble' },
    { code: 'KGS', symbol: 'с', label: 'Kyrgyzstani Som' },
];

/**
 * Supported Languages
 */
export const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ru', label: 'Russian', native: 'Русский' },
    { code: 'kk', label: 'Kazakh', native: 'Қазақша' },
    { code: 'ky', label: 'Kyrgyz', native: 'Кыргызча' },
];

/**
 * Days of Week
 */
export const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday', short: 'Mon' },
    { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { value: 'thursday', label: 'Thursday', short: 'Thu' },
    { value: 'friday', label: 'Friday', short: 'Fri' },
    { value: 'saturday', label: 'Saturday', short: 'Sat' },
    { value: 'sunday', label: 'Sunday', short: 'Sun' },
];

/**
 * File Upload Validation
 */
export const FILE_UPLOAD_LIMITS = {
    // Image uploads
    maxImageSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxImagesPerActivity: 20,

    // Document uploads
    maxDocumentSize: 5 * 1024 * 1024, // 5MB
    allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/png'],

    // General
    maxFileNameLength: 255,
};

/**
 * Form Validation Rules
 */
export const VALIDATION_RULES = {
    businessName: {
        minLength: 3,
        maxLength: 100,
    },
    businessDescription: {
        minLength: 20,
        maxLength: 500,
    },
    activityName: {
        minLength: 5,
        maxLength: 100,
    },
    activityDescription: {
        minLength: 50,
        maxLength: 2000,
    },
    shortDescription: {
        minLength: 20,
        maxLength: 200,
    },
    duration: {
        min: 15, // 15 minutes
        max: 1440, // 24 hours
    },
    participants: {
        min: 1,
        max: 100,
    },
    age: {
        min: 0,
        max: 120,
    },
    price: {
        min: 0,
        max: 1000000,
    },
    phonePattern: /^\+?[1-9]\d{1,14}$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

/**
 * Booking Status Colors
 */
export const BOOKING_STATUS_COLORS = {
    pending: 'amber',
    confirmed: 'emerald',
    cancelled: 'red',
    completed: 'blue',
    refunded: 'purple',
};

/**
 * Verification Status Colors
 */
export const VERIFICATION_STATUS_COLORS = {
    pending: 'amber',
    verified: 'emerald',
    rejected: 'red',
};

/**
 * Time Slots - Available time options for activities
 */
export const TIME_SLOTS = [
    '00:00', '00:30', '01:00', '01:30', '02:00', '02:30',
    '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
];

/**
 * Default Operating Hours
 */
export const DEFAULT_OPERATING_HOURS = {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true },
};

/**
 * Chart Colors - For analytics charts
 */
export const CHART_COLORS = {
    primary: '#059669', // emerald-600
    secondary: '#0891b2', // cyan-600
    accent: '#dc2626', // red-600
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    danger: '#ef4444', // red-500
    info: '#3b82f6', // blue-500
    neutral: '#6b7280', // gray-500
};

/**
 * Pagination Defaults
 */
export const PAGINATION_DEFAULTS = {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
};

/**
 * API Rate Limits (requests per hour)
 */
export const RATE_LIMITS = {
    registration: 100,
    dashboard: 1000,
    fileUpload: 50,
    messaging: 200,
};
