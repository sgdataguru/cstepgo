# 09 Activity Owner Registration - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, File Storage
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), AWS S3/Cloudinary (Images)

## User Story

As an adventure activity owner (horse riding, bike rental, paragliding, boating, hot air balloon, snowboarding, ski equipment rental, yurt stay, zip line, dog sledding, snow motorcycle, etc.), I want to register my business and upload my activity details, prices, photos, and availability, so that travelers using StepperGO can discover and book my activities while traveling across Central Asia.

## Pre-conditions

- User authentication system exists (for admin approval workflow)
- File upload infrastructure available (Cloudinary/S3)
- Email/SMS verification services configured
- Database connection and migration system set up
- Payment processing foundation available
- Google Maps API integration for location services

## Business Requirements

- Increase platform ecosystem completeness by 100% through activity marketplace
- Acquire 50+ activity owners in first 3 months with 4.5+ rating
- Generate ₸500,000+ GMV from activities within 6 months
- Enable 15% of travelers to book activities, increasing to 25% by month 6
- Establish regional market leadership in Central Asian adventure tourism

## Technical Specifications

### Integration Points
- **Authentication**: Multi-role auth system (activity-owners, travelers, admins)
- **File Storage**: Cloudinary for image uploads with optimization and CDN
- **Maps/Places**: Google Places API for location autocomplete and coordinates
- **Payments**: Kaspi Pay, PayPal integration for activity bookings and payouts
- **Notifications**: Email (Postmark), SMS (Twilio) for verification and booking alerts
- **Search**: Elasticsearch for activity discovery and filtering

### Security Requirements
- JWT authentication with role-based access control (RBAC)
- PII encryption for business documents and personal information
- Image upload validation and virus scanning
- API rate limiting (100 requests/hour for registration, 1000/hour for dashboard)
- Business verification workflow with document validation
- GDPR compliance for data handling and deletion

## Design Specifications

### Visual Layout & Components

**Activity Owner Portal Layout**:
```
[Header]
├── StepperGO Logo
├── Provider Navigation (Dashboard, Activities, Bookings, Analytics)
├── Language Selector (EN, RU, KK, KY)
└── User Menu (Profile, Settings, Logout)

[Main Content Area]
├── Sidebar (Navigation, Quick Actions) - 1/4 width desktop
└── Content Area (Forms, Tables, Charts) - 3/4 width desktop

[Footer]
├── Support Links
├── Legal Information
└── Language & Region Settings
```

**Registration Wizard Layout**:
```
[Registration Header]
├── Progress Indicator (●━━━○━━○━━○━━○)
├── Step Counter (Step 2 of 5)
└── Exit/Save Draft Options

[Form Container]
├── Step Title & Description
├── Form Fields (2-3 columns on desktop)
├── Validation Messages
├── File Upload Areas
└── Navigation (Back, Continue, Save Draft)

[Help Sidebar]
├── Step Explanation
├── Tips & Best Practices
└── Support Contact
```

**Dashboard Layout**:
```
[Metrics Row]
├── Total Bookings Card
├── Active Activities Card
├── Pending Requests Card
└── Monthly Revenue Card

[Main Dashboard Grid]
├── Recent Bookings List (2/3 width)
└── Quick Actions Panel (1/3 width)

[Analytics Section]
├── Activity Performance Chart
├── Booking Trends Graph
└── Customer Demographics
```

### Design System Compliance

**Activity Owner Color Palette**:
```css
/* Primary Brand Colors */
--provider-primary: #059669;       /* Emerald 600 - trust, nature */
--provider-secondary: #0891b2;     /* Cyan 600 - adventure, water */
--provider-accent: #dc2626;        /* Red 600 - excitement */
--provider-neutral: #6b7280;       /* Gray 500 - text */

/* Status & Feedback Colors */
--status-pending: #f59e0b;         /* Amber - waiting approval */
--status-approved: #10b981;        /* Emerald - active/verified */
--status-rejected: #ef4444;        /* Red - needs attention */
--status-featured: #8b5cf6;        /* Purple - premium listing */

/* Background Colors */
--bg-provider: #f0fdf4;           /* Light emerald wash */
--bg-card: #ffffff;               /* Clean white cards */
--bg-overlay: rgba(5, 150, 105, 0.05);  /* Subtle brand overlay */
```

**Typography Scale**:
```css
/* Provider Dashboard Typography */
--heading-hero: 3rem;             /* 48px - Main dashboard title */
--heading-xl: 2.25rem;            /* 36px - Section headers */
--heading-lg: 1.875rem;           /* 30px - Card titles */
--heading-md: 1.5rem;             /* 24px - Form sections */
--heading-sm: 1.25rem;            /* 20px - Subsection headers */

/* Body Text Hierarchy */
--body-xl: 1.25rem;               /* 20px - Important descriptions */
--body-lg: 1.125rem;              /* 18px - Primary content */
--body-base: 1rem;                /* 16px - Standard text */
--body-sm: 0.875rem;              /* 14px - Meta information */
--body-xs: 0.75rem;               /* 12px - Helper text */

/* Weight & Line Height */
--weight-light: 300;
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Responsive Behavior

**Mobile-First Breakpoints**:
```css
/* Mobile (320px - 767px) */
.registration-mobile {
  @apply flex flex-col space-y-4 px-4;
  .form-grid { @apply grid-cols-1 gap-4; }
  .photo-grid { @apply grid-cols-2 gap-2; }
  .dashboard-stats { @apply grid-cols-2 gap-3; }
}

/* Tablet (768px - 1023px) */
.registration-tablet {
  @apply px-6;
  .form-grid { @apply grid-cols-2 gap-6; }
  .photo-grid { @apply grid-cols-3 gap-3; }
  .dashboard-stats { @apply grid-cols-4 gap-4; }
}

/* Desktop (1024px+) */
.registration-desktop {
  @apply px-8 max-w-6xl mx-auto;
  .form-grid { @apply grid-cols-3 gap-8; }
  .photo-grid { @apply grid-cols-4 gap-4; }
  .dashboard-sidebar { @apply w-64 fixed left-0; }
  .dashboard-content { @apply ml-64 p-8; }
}
```

### Interaction Patterns

**Form Validation States**:
```typescript
interface ValidationStates {
  default: 'border-gray-300 bg-white focus:border-provider-primary';
  valid: 'border-green-500 bg-green-50 focus:border-green-600';
  invalid: 'border-red-500 bg-red-50 focus:border-red-600';
  warning: 'border-amber-500 bg-amber-50 focus:border-amber-600';
  disabled: 'border-gray-200 bg-gray-100 cursor-not-allowed';
}
```

**Button Interaction System**:
```typescript
interface ButtonStates {
  primary: {
    default: 'bg-provider-primary text-white hover:bg-emerald-700';
    loading: 'bg-provider-primary/80 text-white cursor-wait';
    disabled: 'bg-gray-400 text-white cursor-not-allowed';
  };
  secondary: {
    default: 'bg-white text-provider-primary border border-provider-primary hover:bg-emerald-50';
    loading: 'bg-emerald-50 text-provider-primary cursor-wait';
  };
  danger: {
    default: 'bg-red-600 text-white hover:bg-red-700';
    outline: 'bg-white text-red-600 border border-red-600 hover:bg-red-50';
  };
}
```

**File Upload Animation**:
```typescript
const uploadAnimations = {
  dragEnter: {
    scale: 1.02,
    borderColor: 'var(--provider-primary)',
    backgroundColor: 'var(--bg-provider)',
  },
  uploading: {
    backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(5,150,105,0.1) 50%, transparent 75%)',
    animation: 'progress-slide 1s linear infinite',
  },
  success: {
    scale: [1, 1.1, 1],
    borderColor: 'var(--status-approved)',
    transition: { duration: 0.5 },
  },
};
```

## Technical Architecture

### Component Structure
```
src/app/activity-owners/
├── auth/
│   ├── register/
│   │   ├── page.tsx                     # Registration entry point
│   │   └── components/
│   │       ├── RegistrationWizard.tsx   # Main wizard container
│   │       ├── StepProgress.tsx         # Progress indicator
│   │       ├── BusinessInfoStep.tsx     # Step 1: Business details
│   │       ├── ActivityCategoriesStep.tsx # Step 2: Activity types
│   │       ├── LocationDetailsStep.tsx  # Step 3: Location & contact
│   │       ├── DocumentUploadStep.tsx   # Step 4: Verification docs
│   │       └── VerificationStep.tsx     # Step 5: Email/Phone verify
│   ├── login/
│   │   └── page.tsx                     # Provider login page
│   └── verify/
│       └── page.tsx                     # Email/SMS verification
├── dashboard/
│   ├── page.tsx                         # Dashboard overview
│   ├── layout.tsx                       # Dashboard layout
│   ├── loading.tsx                      # Loading states
│   ├── error.tsx                        # Error boundary
│   └── components/
│       ├── DashboardStats.tsx           # Metrics cards
│       ├── RecentBookings.tsx           # Booking list
│       ├── ActivityPerformance.tsx      # Analytics charts
│       ├── QuickActions.tsx             # Action shortcuts
│       └── NavSidebar.tsx               # Navigation sidebar
├── activities/
│   ├── page.tsx                         # Activities list
│   ├── create/
│   │   └── page.tsx                     # New activity form
│   ├── [id]/
│   │   ├── page.tsx                     # Activity details
│   │   └── edit/
│   │       └── page.tsx                 # Edit activity
│   └── components/
│       ├── ActivityForm.tsx             # Activity creation form
│       ├── PhotoGalleryUpload.tsx       # Photo management
│       ├── PricingManager.tsx           # Pricing configuration
│       ├── AvailabilityCalendar.tsx     # Calendar management
│       ├── ActivityList.tsx             # Activities table
│       └── ActivityCard.tsx             # Activity preview card
├── bookings/
│   ├── page.tsx                         # Bookings management
│   └── components/
│       ├── BookingsList.tsx             # Bookings table
│       ├── BookingDetails.tsx           # Booking detail view
│       ├── BookingActions.tsx           # Accept/decline actions
│       └── CustomerCommunication.tsx    # Messaging system
├── analytics/
│   ├── page.tsx                         # Analytics dashboard
│   └── components/
│       ├── RevenueChart.tsx             # Revenue tracking
│       ├── BookingTrends.tsx            # Booking analytics
│       ├── CustomerInsights.tsx         # Customer data
│       └── PerformanceMetrics.tsx       # Activity performance
├── profile/
│   ├── page.tsx                         # Profile management
│   └── components/
│       ├── BusinessProfile.tsx          # Business info editing
│       ├── ContactSettings.tsx          # Contact preferences
│       ├── NotificationSettings.tsx     # Notification config
│       └── AccountSecurity.tsx          # Security settings
└── components/
    ├── shared/
    │   ├── ProviderLayout.tsx           # Common layout wrapper
    │   ├── ProviderHeader.tsx           # Header with navigation
    │   ├── LoadingSpinner.tsx           # Loading components
    │   ├── ErrorMessage.tsx             # Error displays
    │   ├── ConfirmDialog.tsx            # Confirmation modals
    │   └── DataTable.tsx                # Reusable table component
    ├── forms/
    │   ├── FormField.tsx                # Standard form field
    │   ├── FileUpload.tsx               # File upload component
    │   ├── LocationPicker.tsx           # Map location selector
    │   ├── TimePicker.tsx               # Time selection
    │   └── PriceInput.tsx               # Price formatting input
    └── hooks/
        ├── useActivityOwnerAuth.ts      # Authentication hook
        ├── useFileUpload.ts             # File upload logic
        ├── useActivityForm.ts           # Activity form management
        ├── useBookingActions.ts         # Booking operations
        ├── useAnalytics.ts              # Analytics data
        └── useNotifications.ts          # Notification management
```

### State Management Architecture

**Global Provider State Interface**:
```typescript
interface ActivityOwnerState {
  // Authentication
  currentOwner: ActivityOwner | null;
  session: OwnerSession | null;
  permissions: OwnerPermission[];
  
  // Business Data
  business: {
    profile: BusinessProfile;
    activities: Activity[];
    bookings: Booking[];
    analytics: AnalyticsData;
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
  };
  
  // Form State
  forms: {
    registration: RegistrationFormData;
    activity: ActivityFormData;
    isDirty: boolean;
    validationErrors: Record<string, string>;
  };
}

interface ActivityOwner {
  id: string;
  email: string;
  phone: string;
  businessName: string;
  contactPerson: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  languages: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    region: string;
  };
  createdAt: Date;
  lastLogin: Date;
}

interface Activity {
  id: string;
  ownerId: string;
  category: ActivityCategory;
  name: string;
  description: string;
  shortDescription: string;
  duration: number; // minutes
  difficultyLevel: 'easy' | 'moderate' | 'hard' | 'expert';
  minParticipants: number;
  maxParticipants: number;
  minAge?: number;
  maxAge?: number;
  basePrice: number;
  currency: string;
  equipmentIncluded: string[];
  requirements: string[];
  safetyNotes: string;
  location: LocationData;
  photos: ActivityPhoto[];
  availability: AvailabilitySlot[];
  isActive: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  bookingCount: number;
}

interface Booking {
  id: string;
  activityId: string;
  customerId: string;
  customerDetails: CustomerInfo;
  requestDate: Date;
  activityDate: Date;
  participants: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  communicationHistory: Message[];
  paymentStatus: 'pending' | 'paid' | 'refunded';
}
```

**Provider Actions Interface**:
```typescript
interface ActivityOwnerActions {
  // Authentication Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<void>;
  verifyPhone: (code: string) => Promise<void>;
  
  // Registration Actions
  startRegistration: () => void;
  saveRegistrationStep: (step: RegistrationStep, data: any) => void;
  submitRegistration: (formData: RegistrationFormData) => Promise<void>;
  uploadDocument: (file: File, type: DocumentType) => Promise<string>;
  
  // Business Management
  updateBusinessProfile: (data: Partial<BusinessProfile>) => Promise<void>;
  uploadBusinessPhoto: (file: File) => Promise<string>;
  
  // Activity Management
  createActivity: (activityData: CreateActivityData) => Promise<Activity>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  uploadActivityPhotos: (activityId: string, files: File[]) => Promise<void>;
  updateActivityAvailability: (activityId: string, slots: AvailabilitySlot[]) => Promise<void>;
  
  // Booking Management
  loadBookings: (filters?: BookingFilters) => Promise<void>;
  acceptBooking: (bookingId: string, response?: string) => Promise<void>;
  declineBooking: (bookingId: string, reason: string) => Promise<void>;
  sendMessage: (bookingId: string, message: string) => Promise<void>;
  
  // Analytics
  loadAnalytics: (period: AnalyticsPeriod) => Promise<void>;
  exportAnalytics: (format: 'pdf' | 'csv') => Promise<void>;
}
```

### API Integration Schema

**Authentication Endpoints**:
```typescript
// Registration & Authentication
interface AuthAPIEndpoints {
  POST: {
    '/api/activity-owners/register': {
      body: RegistrationData;
      response: { ownerId: string; verificationRequired: boolean };
    };
    '/api/activity-owners/verify-email': {
      body: { token: string };
      response: { verified: boolean };
    };
    '/api/activity-owners/verify-phone': {
      body: { code: string; phone: string };
      response: { verified: boolean };
    };
    '/api/activity-owners/login': {
      body: LoginCredentials;
      response: { token: string; owner: ActivityOwner };
    };
    '/api/activity-owners/logout': {
      response: void;
    };
  };
}

// Business Management
interface BusinessAPIEndpoints {
  GET: {
    '/api/activity-owners/profile': {
      response: BusinessProfile;
    };
    '/api/activity-owners/activities': {
      query?: { page: number; limit: number; status?: string };
      response: PaginatedResponse<Activity>;
    };
    '/api/activity-owners/bookings': {
      query?: BookingFilters;
      response: PaginatedResponse<Booking>;
    };
    '/api/activity-owners/analytics': {
      query: AnalyticsQuery;
      response: AnalyticsData;
    };
  };
  POST: {
    '/api/activity-owners/activities': {
      body: CreateActivityData;
      response: Activity;
    };
    '/api/activity-owners/upload-photos': {
      body: FormData; // multipart file upload
      response: { urls: string[] };
    };
    '/api/activity-owners/upload-documents': {
      body: FormData;
      response: { documentUrl: string; verified: boolean };
    };
  };
  PUT: {
    '/api/activity-owners/profile': {
      body: Partial<BusinessProfile>;
      response: BusinessProfile;
    };
    '/api/activity-owners/activities/:id': {
      body: Partial<Activity>;
      response: Activity;
    };
    '/api/activity-owners/bookings/:id/status': {
      body: { status: BookingStatus; message?: string };
      response: Booking;
    };
  };
  DELETE: {
    '/api/activity-owners/activities/:id': {
      response: void;
    };
  };
}

// File Upload & Media
interface MediaAPISchema {
  POST: {
    '/api/upload/activity-photos': {
      headers: { 'Content-Type': 'multipart/form-data' };
      body: {
        files: File[];
        activityId: string;
        captions?: string[];
      };
      response: {
        photos: {
          id: string;
          url: string;
          thumbnailUrl: string;
          caption?: string;
          sortOrder: number;
        }[];
      };
    };
  };
}
```

**Data Transfer Objects**:
```typescript
interface RegistrationData {
  // Step 1: Business Information
  businessName: string;
  businessDescription: string;
  contactPerson: string;
  email: string;
  phone: string;
  
  // Step 2: Activity Categories
  primaryCategories: ActivityCategory[];
  secondaryCategories?: ActivityCategory[];
  
  // Step 3: Location & Contact
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  operatingHours: {
    [day: string]: { open: string; close: string; closed: boolean };
  };
  seasonalOperation?: {
    startMonth: number;
    endMonth: number;
  };
  
  // Step 4: Documents
  documents: {
    businessLicense?: File;
    insurance?: File;
    certifications?: File[];
  };
  
  // Step 5: Verification
  preferredLanguages: string[];
  marketingConsent: boolean;
  termsAccepted: boolean;
}

interface CreateActivityData {
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
    packages?: PricingPackage[];
    groupDiscounts?: GroupDiscount[];
  };
  equipment: {
    included: string[];
    rental?: { item: string; price: number }[];
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
```

## Implementation Requirements

### Core Components

**RegistrationWizard.tsx** - Multi-step registration flow
```typescript
interface RegistrationWizardProps {
  initialStep?: number;
  onComplete?: (data: RegistrationData) => void;
  onSaveDraft?: (data: Partial<RegistrationData>) => void;
  allowDraft?: boolean;
}

const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  initialStep = 1,
  onComplete,
  onSaveDraft,
  allowDraft = true
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<RegistrationData>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Implementation details...
};
```

**ActivityForm.tsx** - Activity creation and editing
```typescript
interface ActivityFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Activity>;
  onSubmit: (data: CreateActivityData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**DashboardStats.tsx** - Metrics overview
```typescript
interface DashboardStatsProps {
  stats: {
    totalBookings: number;
    activeActivities: number;
    pendingRequests: number;
    monthlyRevenue: number;
  };
  isLoading?: boolean;
  period?: 'week' | 'month' | 'quarter';
}
```

**PhotoGalleryUpload.tsx** - Photo management
```typescript
interface PhotoGalleryUploadProps {
  activityId?: string;
  existingPhotos?: ActivityPhoto[];
  maxPhotos?: number;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onReorder: (photoIds: string[]) => Promise<void>;
}
```

### Custom Hooks

**useActivityOwnerAuth()** - Authentication management
```typescript
function useActivityOwnerAuth(): {
  owner: ActivityOwner | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<void>;
  verifyPhone: (code: string) => Promise<void>;
  error: string | null;
}
```

**useFileUpload()** - File upload handling
```typescript
function useFileUpload(options?: {
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}): {
  uploadFile: (file: File) => Promise<string>;
  uploadFiles: (files: File[]) => Promise<string[]>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}
```

**useActivityForm()** - Activity form state management
```typescript
function useActivityForm(initialData?: Partial<Activity>): {
  formData: ActivityFormData;
  updateField: (field: keyof ActivityFormData, value: any) => void;
  validateForm: () => boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  reset: () => void;
  submit: () => Promise<void>;
}
```

**useBookingActions()** - Booking management
```typescript
function useBookingActions(): {
  bookings: Booking[];
  isLoading: boolean;
  loadBookings: (filters?: BookingFilters) => Promise<void>;
  acceptBooking: (id: string, message?: string) => Promise<void>;
  declineBooking: (id: string, reason: string) => Promise<void>;
  sendMessage: (bookingId: string, message: string) => Promise<void>;
  error: string | null;
}
```

### Utility Functions

**activity-validation.ts** - Form validation
```typescript
function validateBusinessInfo(data: BusinessInfoData): ValidationErrors;
function validateActivityData(data: CreateActivityData): ValidationErrors;
function validatePhotos(files: File[]): ValidationErrors;
function validatePricing(pricing: PricingData): ValidationErrors;
```

**file-upload-utils.ts** - File processing
```typescript
function compressImage(file: File, quality: number): Promise<File>;
function generateThumbnail(file: File): Promise<Blob>;
function validateFileType(file: File, allowedTypes: string[]): boolean;
function formatFileSize(bytes: number): string;
```

**activity-formatters.ts** - Data formatting
```typescript
function formatPrice(amount: number, currency: string): string;
function formatDuration(minutes: number): string;
function formatLocation(location: LocationData): string;
function formatAvailability(slots: AvailabilitySlot[]): string;
```

## Acceptance Criteria

### Functional Requirements

**Registration Process**
- ✓ Complete 5-step registration wizard with form validation
- ✓ Email and SMS verification with resend functionality
- ✓ Document upload for business license and certifications
- ✓ Multi-language support (English, Russian, Kazakh, Kyrgyz)
- ✓ Save draft capability at each step
- ✓ Admin approval workflow with notification system

**Activity Management**
- ✓ Create activities with comprehensive details and photo gallery
- ✓ Set pricing with multiple packages and group discounts
- ✓ Manage availability calendar with recurring schedules
- ✓ Real-time availability updates
- ✓ Bulk activity operations (activate, deactivate, delete)

**Booking Management**
- ✓ Receive and respond to booking requests
- ✓ Two-way messaging system with customers
- ✓ Automatic booking confirmations and reminders
- ✓ Cancellation and refund processing
- ✓ Customer review collection and response

**Dashboard & Analytics**
- ✓ Real-time dashboard with key metrics
- ✓ Revenue tracking and forecasting
- ✓ Activity performance analytics
- ✓ Customer demographics and behavior insights
- ✓ Export functionality for reports

### Non-Functional Requirements

**Performance**
- Registration wizard loads in < 2 seconds
- Photo uploads process in < 30 seconds for 10 images
- Dashboard refresh in < 1 second
- Search response time < 500ms

**Accessibility**
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- Multi-language interface support

**Security**
- All file uploads scanned for malware
- PII data encrypted at rest and in transit
- Role-based access control enforced
- Session timeout after 24 hours of inactivity

**Usability**
- Mobile-responsive design for all screens
- Progressive web app capabilities
- Offline form draft saving
- Contextual help and tooltips

## Modified Files
```
src/
├── app/
│   └── activity-owners/
│       ├── auth/
│       │   ├── register/
│       │   │   ├── page.tsx ⬜
│       │   │   └── components/
│       │   │       ├── RegistrationWizard.tsx ⬜
│       │   │       ├── StepProgress.tsx ⬜
│       │   │       ├── BusinessInfoStep.tsx ⬜
│       │   │       ├── ActivityCategoriesStep.tsx ⬜
│       │   │       ├── LocationDetailsStep.tsx ⬜
│       │   │       ├── DocumentUploadStep.tsx ⬜
│       │   │       └── VerificationStep.tsx ⬜
│       │   ├── login/
│       │   │   └── page.tsx ⬜
│       │   └── verify/
│       │       └── page.tsx ⬜
│       ├── dashboard/
│       │   ├── page.tsx ⬜
│       │   ├── layout.tsx ⬜
│       │   ├── loading.tsx ⬜
│       │   ├── error.tsx ⬜
│       │   └── components/
│       │       ├── DashboardStats.tsx ⬜
│       │       ├── RecentBookings.tsx ⬜
│       │       ├── ActivityPerformance.tsx ⬜
│       │       ├── QuickActions.tsx ⬜
│       │       └── NavSidebar.tsx ⬜
│       ├── activities/
│       │   ├── page.tsx ⬜
│       │   ├── create/
│       │   │   └── page.tsx ⬜
│       │   ├── [id]/
│       │   │   ├── page.tsx ⬜
│       │   │   └── edit/
│       │   │       └── page.tsx ⬜
│       │   └── components/
│       │       ├── ActivityForm.tsx ⬜
│       │       ├── PhotoGalleryUpload.tsx ⬜
│       │       ├── PricingManager.tsx ⬜
│       │       ├── AvailabilityCalendar.tsx ⬜
│       │       ├── ActivityList.tsx ⬜
│       │       └── ActivityCard.tsx ⬜
│       ├── bookings/
│       │   ├── page.tsx ⬜
│       │   └── components/
│       │       ├── BookingsList.tsx ⬜
│       │       ├── BookingDetails.tsx ⬜
│       │       ├── BookingActions.tsx ⬜
│       │       └── CustomerCommunication.tsx ⬜
│       ├── analytics/
│       │   ├── page.tsx ⬜
│       │   └── components/
│       │       ├── RevenueChart.tsx ⬜
│       │       ├── BookingTrends.tsx ⬜
│       │       ├── CustomerInsights.tsx ⬜
│       │       └── PerformanceMetrics.tsx ⬜
│       ├── profile/
│       │   ├── page.tsx ⬜
│       │   └── components/
│       │       ├── BusinessProfile.tsx ⬜
│       │       ├── ContactSettings.tsx ⬜
│       │       ├── NotificationSettings.tsx ⬜
│       │       └── AccountSecurity.tsx ⬜
│       └── components/
│           ├── shared/ ⬜
│           ├── forms/ ⬜
│           └── hooks/ ⬜
├── lib/
│   ├── api/
│   │   ├── activity-owners-api.ts ⬜
│   │   ├── activities-api.ts ⬜
│   │   ├── bookings-api.ts ⬜
│   │   └── file-upload-api.ts ⬜
│   ├── utils/
│   │   ├── activity-validation.ts ⬜
│   │   ├── file-upload-utils.ts ⬜
│   │   ├── activity-formatters.ts ⬜
│   │   └── activity-constants.ts ⬜
│   └── auth/
│       └── activity-owner-auth.ts ⬜
├── types/
│   ├── activity-owner-types.ts ⬜
│   ├── activity-types.ts ⬜
│   ├── booking-types.ts ⬜
│   └── common-types.ts ⬜
├── store/
│   ├── activity-owner-store.ts ⬜
│   ├── activity-store.ts ⬜
│   └── booking-store.ts ⬜
└── styles/
    └── activity-owners.module.css ⬜
```

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup (Weeks 1-2)
**Status**: ⬜ Not Started

- [ ] Database schema design and PostgreSQL migrations
- [ ] Authentication system with JWT and RBAC
- [ ] File upload infrastructure (Cloudinary integration)
- [ ] Email/SMS verification services (Postmark/Twilio)
- [ ] Basic project structure and routing
- [ ] Core TypeScript interfaces and types

**Deliverables**:
- Database ready for activity owner data
- Authentication flow functional
- File uploads working with image optimization
- Communication services configured

### Phase 2: Registration System (Weeks 3-4)
**Status**: ⬜ Not Started

- [ ] Registration wizard UI components
- [ ] Multi-step form validation and state management
- [ ] Document upload and verification workflow
- [ ] Email/phone verification implementation
- [ ] Admin approval dashboard
- [ ] Multi-language support implementation

**Deliverables**:
- Complete registration flow
- Admin can review and approve applications
- Applicants receive status updates
- Multi-language interface functional

### Phase 3: Activity Management (Weeks 5-6)
**Status**: ⬜ Not Started

- [ ] Activity creation and editing forms
- [ ] Photo gallery management system
- [ ] Pricing and package configuration
- [ ] Availability calendar implementation
- [ ] Activity listing and search functionality
- [ ] Provider dashboard with basic features

**Deliverables**:
- Activity owners can create and manage activities
- Photo uploads and gallery management working
- Availability calendar functional
- Activities appear in traveler search

### Phase 4: Booking Integration (Weeks 7-8)
**Status**: ⬜ Not Started

- [ ] Booking request handling system
- [ ] Customer-provider communication platform
- [ ] Booking confirmation and notification flow
- [ ] Cancellation and refund processing
- [ ] Review and rating system
- [ ] Analytics and reporting dashboard

**Deliverables**:
- End-to-end booking workflow
- Communication system functional
- Analytics dashboard with key metrics
- Review system operational

## Dependencies

### Internal Dependencies
- User authentication system (extend for multi-role)
- Payment processing infrastructure
- Email/SMS notification services
- File storage and CDN setup
- Search and discovery system
- Review and rating platform

### External Dependencies
- **Cloudinary**: Image upload, optimization, and CDN
- **Google Maps API**: Location services and map integration
- **Postmark**: Email delivery for notifications
- **Twilio**: SMS verification and notifications
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage

### API Integrations
- **Google Places API**: Location autocomplete
- **Kaspi Pay**: Payment processing for bookings
- **PayPal**: International payment support
- **Google Calendar API**: Calendar integration (optional)

## Risk Assessment

### Technical Risks

**File Upload Performance and Security**
- **Impact**: High
- **Mitigation**: Implement CDN, image optimization, and virus scanning
- **Contingency**: Fallback to basic file storage with manual review

**Multi-language Complexity**
- **Impact**: Medium
- **Mitigation**: Use i18n library, implement incremental language rollout
- **Contingency**: Start with English and Russian only

**Database Scalability**
- **Impact**: Medium
- **Mitigation**: Proper indexing, caching strategy, read replicas
- **Contingency**: Horizontal scaling plan ready

**Payment Integration Complexity**
- **Impact**: High
- **Mitigation**: Use established payment providers, phased rollout
- **Contingency**: Manual payment processing initially

### Business Risks

**Provider Adoption Rate**
- **Impact**: High
- **Mitigation**: Incentive programs, reduced fees for early adopters
- **Contingency**: Direct partnership with existing tour operators

**Quality Control Challenges**
- **Impact**: Medium
- **Mitigation**: Verification process, review system, quality guidelines
- **Contingency**: Manual review and approval process

**Competition from Established Platforms**
- **Impact**: Medium
- **Mitigation**: Focus on Central Asian market, unique features
- **Contingency**: Partner with existing platforms for integration

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('RegistrationWizard', () => {
  it('should validate business information step', () => {
    const validData = { businessName: 'Test Adventure', email: 'test@example.com' };
    const result = validateBusinessInfo(validData);
    expect(result.isValid).toBe(true);
  });
  
  it('should handle file upload validation', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const isValid = validateFileType(file, ['image/jpeg', 'image/png']);
    expect(isValid).toBe(true);
  });
});

describe('useActivityForm', () => {
  it('should manage form state correctly', () => {
    const { result } = renderHook(() => useActivityForm());
    
    act(() => {
      result.current.updateField('name', 'Horse Riding Tour');
    });
    
    expect(result.current.formData.name).toBe('Horse Riding Tour');
  });
});

describe('ActivityAPI', () => {
  it('should create activity with valid data', async () => {
    const activityData: CreateActivityData = {
      name: 'Test Activity',
      category: 'adventure-sports',
      // ... other required fields
    };
    
    const response = await createActivity(activityData);
    expect(response.id).toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe('Activity Owner Registration Flow', () => {
  it('should complete full registration process', async () => {
    const { getByTestId, getByText } = render(<RegistrationWizard />);
    
    // Step 1: Business Information
    fireEvent.change(getByTestId('business-name'), { target: { value: 'Test Adventures' } });
    fireEvent.click(getByText('Continue'));
    
    // Step 2: Activity Categories
    fireEvent.click(getByTestId('category-adventure-sports'));
    fireEvent.click(getByText('Continue'));
    
    // ... continue through all steps
    
    await waitFor(() => {
      expect(getByText('Registration Complete')).toBeInTheDocument();
    });
  });
});

describe('Activity Management', () => {
  it('should create and manage activities', async () => {
    // Test activity creation, editing, and deletion
  });
});
```

### E2E Tests (Playwright)
```typescript
test.describe('Activity Owner Portal E2E', () => {
  test('complete registration and activity creation flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/activity-owners/auth/register');
    
    // Complete registration steps
    await page.fill('[data-testid=business-name]', 'Almaty Adventures');
    await page.click('[data-testid=continue-button]');
    
    // ... complete all registration steps
    
    // Verify dashboard access
    await expect(page.locator('[data-testid=dashboard-stats]')).toBeVisible();
    
    // Create first activity
    await page.click('[data-testid=create-activity-button]');
    await page.fill('[data-testid=activity-name]', 'Mountain Horse Riding');
    
    // Upload photos
    await page.setInputFiles('[data-testid=photo-upload]', ['./test-assets/horse1.jpg', './test-assets/horse2.jpg']);
    
    // Set pricing
    await page.fill('[data-testid=base-price]', '15000');
    
    // Publish activity
    await page.click('[data-testid=publish-activity]');
    
    // Verify activity appears in list
    await expect(page.locator('text=Mountain Horse Riding')).toBeVisible();
  });
  
  test('booking management workflow', async ({ page }) => {
    // Test receiving and managing booking requests
  });
});
```

## Performance Considerations

### Bundle Optimization
- **Code Splitting**: Lazy load admin/dashboard components
- **Image Optimization**: Cloudinary transforms and WebP format
- **Tree Shaking**: Remove unused dependencies
- **Chunk Optimization**: Separate vendor and app bundles

### Runtime Performance
- **Virtual Scrolling**: For large activity and booking lists
- **Debounced Search**: Reduce API calls during typing
- **Memoization**: Cache expensive calculations
- **Progressive Loading**: Load dashboard sections incrementally

### Caching Strategy
- **API Response Caching**: 5 minutes for activity data, 1 hour for analytics
- **Image Caching**: CDN caching with browser cache headers
- **Static Data**: Cache activity categories, location data
- **User Session**: Redis-based session management

### Database Performance
- **Indexing Strategy**: Composite indexes on frequently queried fields
- **Query Optimization**: Use EXPLAIN ANALYZE for query tuning
- **Connection Pooling**: Optimize database connections
- **Read Replicas**: Separate read and write operations

## Deployment Plan

### Development Phase (Weeks 1-4)
- **Environment**: Local development with mock services
- **Database**: PostgreSQL with seeded test data
- **File Storage**: Local storage for testing
- **Testing**: Unit tests with Jest, component tests with Testing Library

### Staging Phase (Weeks 5-6)
- **Environment**: Staging server with production-like setup
- **Database**: Staging PostgreSQL with production schema
- **File Storage**: Cloudinary test account
- **Testing**: Integration tests, E2E tests with Playwright
- **Performance**: Load testing with realistic data volumes

### Production Phase (Weeks 7-8)
- **Deployment**: Phased rollout starting with beta testers
- **Monitoring**: Application performance monitoring (APM)
- **Rollback**: Blue-green deployment for quick rollback
- **Analytics**: User behavior tracking and conversion analysis

### Post-Launch (Week 9+)
- **Feature Flags**: Gradual feature enablement
- **A/B Testing**: Optimize conversion funnel
- **Performance Monitoring**: Real user monitoring (RUM)
- **Feedback Collection**: User interviews and surveys

## Monitoring & Analytics

### Performance Metrics
- **Page Load Times**: < 2 seconds for critical pages
- **API Response Times**: < 500ms for dashboard APIs
- **File Upload Success Rate**: > 95%
- **Search Performance**: < 500ms response time

### Business Metrics
- **Registration Conversion**: % of visitors who complete registration
- **Activity Creation Rate**: Average activities per owner
- **Booking Conversion**: % of activity views that become bookings
- **Revenue Metrics**: GMV, commission, average booking value

### Technical Metrics
- **Error Rates**: Application and API error rates
- **Uptime**: Service availability monitoring
- **Database Performance**: Query execution times
- **CDN Performance**: Image delivery metrics

### User Behavior Analytics
- **Registration Funnel**: Drop-off points in registration flow
- **Feature Usage**: Most/least used dashboard features
- **User Journey**: Path analysis through the platform
- **Customer Support**: Common issues and resolution times

## Documentation Requirements

### Technical Documentation
- **API Documentation**: OpenAPI/Swagger specifications
- **Database Schema**: ERD diagrams and field descriptions
- **Deployment Guide**: Environment setup and configuration
- **Integration Guide**: Third-party service integrations

### User Documentation
- **Activity Owner Guide**: Step-by-step registration and management
- **FAQ**: Common questions and troubleshooting
- **Best Practices**: Guidelines for creating successful listings
- **Policy Documentation**: Terms of service, privacy policy

### Developer Documentation
- **Code Standards**: Coding conventions and patterns
- **Component Library**: Storybook documentation
- **Testing Guide**: Testing patterns and examples
- **Troubleshooting**: Common issues and solutions

## Post-Launch Review

### Success Criteria
- **50+ activity owners** registered within 3 months
- **200+ activities** listed with quality photos and descriptions
- **4.5+ average rating** across all activities
- **15% activity booking rate** among travelers
- **₸500,000+ GMV** within 6 months

### Retrospective Items
- **Registration Flow Optimization**: Analyze drop-off points and improve UX
- **Feature Usage Analysis**: Identify most valuable features for providers
- **Performance Optimization**: Address any bottlenecks discovered in production
- **Customer Support**: Evaluate support volume and common issues
- **Competitive Analysis**: Assess market position and differentiation

### Future Enhancements
- **Mobile App**: Native iOS/Android apps for activity owners
- **Advanced Analytics**: Predictive analytics and business intelligence
- **Marketing Tools**: Promotional campaigns and featured listings
- **Integration Expansion**: Connect with more booking platforms
- **AI Features**: Smart pricing recommendations, automated descriptions

---

*This implementation plan provides a comprehensive roadmap for building the Activity Owner Registration and Management system that will transform StepperGO into a complete travel ecosystem for Central Asia.*
