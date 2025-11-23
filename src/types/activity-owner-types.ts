// Activity Owner TypeScript interfaces for StepperGO
// Comprehensive types for activity marketplace implementation

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'under-review';
export type RegistrationStep = 1 | 2 | 3 | 4 | 5;

export type ActivityCategory = 
  | 'adventure-sports'
  | 'winter-activities'
  | 'equipment-rentals'
  | 'cultural-traditional'
  | 'water-activities'
  | 'air-activities'
  | 'accommodation'
  | 'food-experiences'
  | 'wellness-health'
  | 'photography'
  | 'wildlife'
  | 'educational';

export type DifficultyLevel = 'easy' | 'moderate' | 'hard' | 'expert';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partially-refunded';
export type DocumentType = 'business-license' | 'insurance' | 'certification' | 'identification';

/**
 * Activity Owner - Business profile and account information
 */
export interface ActivityOwner {
  id: string;
  email: string;
  phone: string;
  businessName: string;
  businessDescription?: string;
  contactPerson: string;
  verificationStatus: VerificationStatus;
  languages: string[]; // ISO codes: 'en', 'ru', 'kk', 'ky'
  location: LocationData;
  primaryCategories: ActivityCategory[];
  secondaryCategories?: ActivityCategory[];
  operatingHours?: OperatingHours;
  seasonalOperation?: SeasonalOperation;
  documents: DocumentInfo[];
  marketingConsent: boolean;
  isActive: boolean;
  featuredProvider: boolean;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  monthlyRevenue: number;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

/**
 * Location Data - Geographic information
 */
export interface LocationData {
  lat: number;
  lng: number;
  latitude?: number; // alias for compatibility
  longitude?: number; // alias for compatibility
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  accessInstructions?: string;
}

/**
 * Operating Hours - Business hours for each day
 */
export interface OperatingHours {
  [day: string]: {
    open: string; // HH:MM format
    close: string; // HH:MM format
    closed: boolean;
  };
}

/**
 * Seasonal Operation - Start and end months for seasonal businesses
 */
export interface SeasonalOperation {
  startMonth: number; // 1-12
  endMonth: number; // 1-12
}

/**
 * Document Info - Uploaded verification documents
 */
export interface DocumentInfo {
  id: string;
  type: DocumentType;
  url: string;
  fileName: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  status: VerificationStatus;
}

/**
 * Activity - Individual activity/service offering
 */
export interface Activity {
  id: string;
  ownerId: string;
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
  equipmentRental: EquipmentRental[];
  requirements: string[];
  safetyNotes: string;
  cancellationPolicy: string;
  location?: LocationData;
  photos: ActivityPhoto[];
  packages: PricingPackage[];
  availability: AvailabilitySlot[];
  isActive: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  bookingCount: number;
  viewCount: number;
  lastBooking?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Activity Photo
 */
export interface ActivityPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  sortOrder: number;
  isCover: boolean;
  uploadedAt: Date;
}

/**
 * Equipment Rental
 */
export interface EquipmentRental {
  item: string;
  price: number;
  currency: string;
  required: boolean;
  description?: string;
}

/**
 * Pricing Package
 */
export interface PricingPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // minutes
  includedItems: string[];
  maxParticipants: number;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * Availability Slot
 */
export interface AvailabilitySlot {
  id: string;
  date: Date;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  maxBookings: number;
  currentBookings: number;
  price?: number; // override base price if needed
  isAvailable: boolean;
  notes?: string;
}

/**
 * Booking
 */
export interface Booking {
  id: string;
  activityId: string;
  customerId: string;
  customerDetails: CustomerInfo;
  requestDate: Date;
  activityDate: Date;
  startTime: string;
  participants: number;
  selectedPackage?: string;
  equipmentRentals: EquipmentRental[];
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  communicationHistory: Message[];
  confirmationCode?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer Info
 */
export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalConditions?: string;
  dietaryRestrictions?: string;
  previousExperience?: string;
}

/**
 * Message
 */
export interface Message {
  id: string;
  senderId: string;
  senderType: 'owner' | 'customer' | 'admin';
  content: string;
  attachments: string[];
  timestamp: Date;
  isRead: boolean;
}

/**
 * Owner Session - Authentication session data
 */
export interface OwnerSession {
  token: string;
  ownerId: string;
  expiresAt: Date;
}

/**
 * Owner Permission - Role-based access control
 */
export interface OwnerPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

/**
 * Registration Form Data - Multi-step registration state
 */
export interface RegistrationFormData {
  // Step 1: Business Information
  businessName?: string;
  businessDescription?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  businessType?: 'individual' | 'llc' | 'corporation' | 'partnership' | 'other';
  yearsInBusiness?: string;
  taxRegistrationNumber?: string;
  businessLicenseNumber?: string;

  // Step 2: Activity Categories
  primaryCategories?: ActivityCategory[];
  secondaryCategories?: ActivityCategory[];
  specializations?: string[];

  // Step 3: Location & Contact
  location?: Partial<LocationData>;
  operatingHours?: OperatingHours;
  seasonalOperation?: SeasonalOperation;

  // Step 4: Documents
  documents?: {
    businessLicense?: File | string;
    insurance?: File | string;
    certifications?: (File | string)[];
    identification?: File | string;
    additionalDocuments?: (File | string)[];
  };

  // Step 5: Verification
  preferredLanguages?: string[];
  marketingConsent?: boolean;
  termsAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Validation Errors - Field-specific error messages
 */
export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Business Profile - Public-facing business information
 */
export interface BusinessProfile {
  id: string;
  businessName: string;
  description: string;
  logo?: string;
  coverPhoto?: string;
  location: LocationData;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  rating: number;
  reviewCount: number;
  activeActivities: number;
  totalBookings: number;
  joinedDate: Date;
}

/**
 * Analytics Period - Time range for analytics queries
 */
export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

/**
 * Analytics Data - Performance metrics and insights
 */
export interface AnalyticsData {
  period: AnalyticsPeriod;
  overview: {
    totalBookings: number;
    activeActivities: number;
    pendingRequests: number;
    monthlyRevenue: number;
    averageRating: number;
    totalViews: number;
  };
  revenue: {
    total: number;
    currency: string;
    trend: number; // percentage change
    chartData: { date: string; amount: number }[];
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    trend: number;
  };
  activities: {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    averageRating: number;
  };
  customers: {
    total: number;
    returning: number;
    new: number;
    averageBookingValue: number;
  };
  topActivities: {
    activityId: string;
    activityName: string;
    bookings: number;
    revenue: number;
  }[];
  trends: {
    bookingTrends: TrendData[];
    revenueTrends: TrendData[];
    viewTrends: TrendData[];
  };
  customerDemographics: {
    ageGroups: { range: string; count: number }[];
    nationalities: { country: string; count: number }[];
    returnCustomers: number;
  };
}

/**
 * Trend Data
 */
export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

/**
 * Global Activity Owner State - Application state management
 */
export interface ActivityOwnerState {
  // Authentication
  currentOwner: ActivityOwner | null;
  session: OwnerSession | null;
  permissions: OwnerPermission[];
  isAuthenticated: boolean;

  // Business Data
  business: {
    profile: BusinessProfile | null;
    activities: Activity[];
    bookings: Booking[];
    analytics: AnalyticsData | null;
    verification: VerificationStatus;
  };

  // UI State
  ui: {
    currentStep: RegistrationStep;
    isLoading: boolean;
    activeModal: string | null;
    notifications: Notification[];
    theme: 'light' | 'dark';
    language: 'en' | 'ru' | 'kk' | 'ky';
    sidebarCollapsed: boolean;
  };

  // Form State
  forms: {
    registration: RegistrationFormData;
    activity: ActivityFormData;
    isDirty: boolean;
    validationErrors: ValidationErrors;
    isSubmitting: boolean;
  };
}

/**
 * Notification - In-app notification
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

/**
 * Activity Form Data - Form state for activity creation/editing
 */
export interface ActivityFormData {
  category: ActivityCategory;
  name: string;
  description: string;
  shortDescription: string;
  duration: number;
  difficultyLevel: DifficultyLevel;
  minParticipants: number;
  maxParticipants: number;
  ageRestrictions: AgeRestrictions;
  pricing: PricingData;
  equipment: EquipmentData;
  location?: LocationData;
  requirements: string[];
  safetyNotes: string;
  cancellationPolicy: string;
  photos: File[];
}

/**
 * Age Restrictions
 */
export interface AgeRestrictions {
  minAge?: number;
  maxAge?: number;
  requiresParentalConsent: boolean;
}

/**
 * Pricing Data
 */
export interface PricingData {
  basePrice: number;
  currency: string;
  packages: Omit<PricingPackage, 'id'>[];
  groupDiscounts: GroupDiscount[];
  seasonalPricing: SeasonalPricing[];
}

/**
 * Group Discount
 */
export interface GroupDiscount {
  minParticipants: number;
  discountPercentage: number;
  description: string;
}

/**
 * Seasonal Pricing
 */
export interface SeasonalPricing {
  startDate: Date;
  endDate: Date;
  priceMultiplier: number; // 1.0 = normal, 1.5 = 50% increase, 0.8 = 20% discount
  description: string;
}

/**
 * Equipment Data
 */
export interface EquipmentData {
  included: string[];
  rental: EquipmentRental[];
  required: string[];
}

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Search & Filtering
 */
export interface ActivityFilters {
  categories?: ActivityCategory[];
  location?: {
    lat: number;
    lng: number;
    radius: number; // km
  };
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  difficulty?: DifficultyLevel[];
  duration?: {
    min: number; // minutes
    max: number; // minutes
  };
  ageRange?: {
    min: number;
    max: number;
  };
  groupSize?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  features?: string[];
  rating?: number; // minimum rating
  sortBy?: 'price' | 'rating' | 'popularity' | 'distance' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingFilters {
  status?: BookingStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  activityId?: string;
  paymentStatus?: PaymentStatus[];
}

/**
 * Form Validation
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

// Constants
export const ACTIVITY_CATEGORIES: Record<ActivityCategory, string> = {
  'adventure-sports': 'Adventure Sports',
  'winter-activities': 'Winter Activities', 
  'equipment-rentals': 'Equipment Rentals',
  'cultural-traditional': 'Cultural & Traditional',
  'water-activities': 'Water Activities',
  'air-activities': 'Air Activities',
  'accommodation': 'Accommodation',
  'food-experiences': 'Food Experiences',
  'wellness-health': 'Wellness & Health',
  'photography': 'Photography',
  'wildlife': 'Wildlife',
  'educational': 'Educational',
};

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, string> = {
  'easy': 'Easy - No experience required',
  'moderate': 'Moderate - Some experience helpful',
  'hard': 'Hard - Previous experience required',
  'expert': 'Expert - Advanced skills required',
};

export const REGISTRATION_STEPS = [
  { id: 1, title: 'Business Information', description: 'Basic details about your business' },
  { id: 2, title: 'Activity Categories', description: 'What activities do you offer?' },
  { id: 3, title: 'Location & Hours', description: 'Where and when you operate' },
  { id: 4, title: 'Documents', description: 'Upload verification documents' },
  { id: 5, title: 'Verification', description: 'Verify your email and phone' },
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
] as const;

export const CURRENCIES = [
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
] as const;
