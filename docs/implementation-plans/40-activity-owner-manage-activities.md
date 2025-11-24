# 40 - Activity Owner Manage Activities - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, Cloudinary/S3  
**Infrastructure**: Vercel (hosting), Cloudinary (images), Google Places API (locations)

## User Story

**As an** activity owner,  
**I want** to create and manage activities (tours, events, experiences),  
**so that** travellers can discover and book my offerings through StepperGO.

## Pre-conditions

- User must be registered with ACTIVITY_OWNER role
- User account must be verified/approved by admin
- Photo upload service (Cloudinary/S3) configured
- Google Places API configured for location autocomplete
- Story 35 (Payment system) completed for revenue tracking

## Business Requirements

- **BR-1**: Enable activity owners to list experiences and grow platform inventory
  - Success Metric: >100 activities created in first 3 months
  - Performance: Activity creation <30 seconds

- **BR-2**: Provide comprehensive activity management tools
  - Success Metric: >70% of owners update activities monthly
  - Performance: Dashboard loads <2 seconds

- **BR-3**: Ensure high-quality listings through validation and approval
  - Success Metric: >90% approval rate for well-formatted activities
  - Performance: Validation checks <500ms

- **BR-4**: Track activity performance with booking analytics
  - Success Metric: >60% of owners check stats weekly
  - Performance: Analytics load <1.5 seconds

## Technical Specifications

### Integration Points
- **Authentication**: Role-based access (ACTIVITY_OWNER)
- **Image Storage**: Cloudinary for photo uploads with transformations
- **Location Services**: Google Places API for location autocomplete
- **Rich Text**: TipTap or Quill for description editor
- **Date/Time**: date-fns for schedule management
- **Notifications**: Email notifications for bookings

### Security Requirements
- RBAC: Only ACTIVITY_OWNER role can create/edit activities
- Image validation: File type, size limits (5MB), virus scanning
- XSS protection: Sanitize HTML in descriptions
- Rate limiting: 100 activities per owner initial limit
- Audit logging: Track all activity modifications

### API Endpoints

#### GET /api/activities/owner
Retrieves all activities for the authenticated owner.

**Query Parameters:**
```typescript
interface OwnerActivitiesQuery {
  status?: 'ALL' | 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'bookings';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface OwnerActivitiesResponse {
  activities: ActivitySummary[];
  pagination: PaginationInfo;
  stats: {
    total: number;
    active: number;
    draft: number;
    pendingApproval: number;
  };
}

interface ActivitySummary {
  id: string;
  title: string;
  category: ActivityCategory;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE';
  
  // Basic info
  thumbnailUrl: string;
  location: {
    city: string;
    address: string;
  };
  
  // Pricing
  pricePerPerson: number;
  currency: 'KZT';
  
  // Capacity
  maxParticipants: number;
  
  // Stats
  totalBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

enum ActivityCategory {
  TOUR = 'TOUR',
  EXCURSION = 'EXCURSION',
  ATTRACTION = 'ATTRACTION',
  ADVENTURE = 'ADVENTURE',
  CULTURAL = 'CULTURAL',
  FOOD_DRINK = 'FOOD_DRINK',
  WELLNESS = 'WELLNESS',
  WORKSHOP = 'WORKSHOP',
}
```

#### GET /api/activities/owner/:id
Retrieves detailed information for a specific activity.

**Response:**
```typescript
interface ActivityDetail {
  id: string;
  title: string;
  description: string;  // Rich text HTML
  category: ActivityCategory;
  status: ActivityStatus;
  
  // Location
  location: {
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    placeId: string;  // Google Places ID
  };
  
  // Media
  photos: ActivityPhoto[];
  
  // Pricing
  pricePerPerson: number;
  groupPricing: GroupPricingTier[] | null;
  currency: 'KZT';
  
  // Capacity
  maxParticipants: number;
  minParticipants: number;
  
  // Duration
  durationMinutes: number;
  durationDisplay: string;  // "2 hours", "Half day"
  
  // Schedule
  scheduleType: 'FIXED' | 'FLEXIBLE';
  schedules: ActivitySchedule[];
  
  // Availability
  availableDays: DayOfWeek[];
  blackoutDates: Date[];
  advanceBookingDays: number;
  cancellationPolicy: CancellationPolicy;
  
  // Inclusions
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  
  // Booking stats
  bookingStats: {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

interface ActivityPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  order: number;
  width: number;
  height: number;
}

interface GroupPricingTier {
  minParticipants: number;
  maxParticipants: number;
  pricePerPerson: number;
}

interface ActivitySchedule {
  id: string;
  dayOfWeek?: DayOfWeek;
  startTime: string;  // "10:00"
  endTime: string;    // "12:00"
  isRecurring: boolean;
  specificDate?: Date;
}

enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}
```

#### POST /api/activities
Creates a new activity.

**Request:**
```typescript
interface CreateActivityRequest {
  // Basic info
  title: string;  // 10-100 chars
  description: string;  // Rich HTML, 100-5000 chars
  category: ActivityCategory;
  
  // Location
  location: {
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
  
  // Pricing
  pricePerPerson: number;  // Min 1000 KZT
  groupPricing?: GroupPricingTier[];
  
  // Capacity
  maxParticipants: number;  // 1-100
  minParticipants: number;  // 1-maxParticipants
  
  // Duration
  durationMinutes: number;  // 30-1440 (1 day)
  
  // Schedule
  scheduleType: 'FIXED' | 'FLEXIBLE';
  schedules: ActivityScheduleInput[];
  availableDays: DayOfWeek[];
  
  // Booking settings
  advanceBookingDays: number;  // 1-365
  cancellationPolicy: CancellationPolicyInput;
  
  // Details
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  
  // Photos (uploaded separately)
  photoIds: string[];
  
  // Status
  status: 'DRAFT' | 'PENDING_APPROVAL';
}
```

**Response:**
```typescript
interface CreateActivityResponse {
  activity: ActivityDetail;
  message: string;
}
```

#### PUT /api/activities/:id
Updates an existing activity.

**Request:**
```typescript
interface UpdateActivityRequest {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  location?: LocationInput;
  pricePerPerson?: number;
  groupPricing?: GroupPricingTier[];
  maxParticipants?: number;
  minParticipants?: number;
  durationMinutes?: number;
  schedules?: ActivityScheduleInput[];
  availableDays?: DayOfWeek[];
  inclusions?: string[];
  exclusions?: string[];
  requirements?: string[];
  photoIds?: string[];
  status?: ActivityStatus;
}
```

**Response:**
```typescript
interface UpdateActivityResponse {
  activity: ActivityDetail;
  message: string;
}
```

#### DELETE /api/activities/:id
Soft deletes an activity (or hard deletes if no bookings).

**Response:**
```typescript
interface DeleteActivityResponse {
  success: boolean;
  message: string;
  deletedId: string;
}
```

#### POST /api/activities/:id/toggle-status
Activates or deactivates an activity.

**Request:**
```typescript
interface ToggleStatusRequest {
  status: 'ACTIVE' | 'INACTIVE';
}
```

**Response:**
```typescript
interface ToggleStatusResponse {
  success: boolean;
  newStatus: ActivityStatus;
  message: string;
}
```

#### POST /api/activities/photos/upload
Uploads activity photos to cloud storage.

**Request:**
```typescript
// Multipart form data
interface PhotoUploadRequest {
  files: File[];  // Max 10 images, 5MB each
  activityId?: string;  // Optional, for existing activity
}
```

**Response:**
```typescript
interface PhotoUploadResponse {
  photos: UploadedPhoto[];
  errors: UploadError[];
}

interface UploadedPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
  cloudinaryId: string;
}

interface UploadError {
  filename: string;
  error: string;
}
```

#### GET /api/activities/:id/bookings
Retrieves bookings for a specific activity.

**Query Parameters:**
```typescript
interface ActivityBookingsQuery {
  status?: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
interface ActivityBookingsResponse {
  bookings: ActivityBooking[];
  pagination: PaginationInfo;
  summary: {
    totalParticipants: number;
    totalRevenue: number;
    averageGroupSize: number;
  };
}

interface ActivityBooking {
  id: string;
  bookingNumber: string;
  scheduledDate: Date;
  scheduledTime: string;
  
  // Participants
  participants: number;
  leadPassenger: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Payment
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  
  // Status
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  
  createdAt: Date;
}
```

## Design Specifications

### Visual Layout & Components

**Activity Owner Dashboard:**
```
[Dashboard Header]
├── "My Activities" Title
├── Search Bar (search by title)
└── [Create Activity] Button (primary, blue)

[Stats Overview Cards]
├── [Total Activities]
│   ├── Icon: 🎯
│   ├── Count: XX activities
│   └── Active: XX | Draft: XX
│
├── [Total Bookings]
│   ├── Icon: 📅
│   ├── Count: XXX bookings
│   └── This month: +XX
│
├── [Total Revenue]
│   ├── Icon: 💰
│   ├── Amount: ₸XX,XXX
│   └── This month: +₸X,XXX
│
└── [Avg Rating]
    ├── Icon: ⭐
    ├── Rating: 4.8/5.0
    └── XXX reviews

[Filter & Sort Bar]
├── Status Filter: All | Active | Draft | Inactive
├── Category Filter: Dropdown
└── Sort: Recent | A-Z | Most Booked

[Activities Grid]
├── [Activity Card] × N
│   ├── [Hero Image]
│   │   ├── Status Badge (Active/Draft/Inactive)
│   │   └── Quick Actions Menu (•••)
│   │
│   ├── [Content]
│   │   ├── Category Badge
│   │   ├── Title (truncated)
│   │   ├── Location: 📍 City
│   │   ├── Price: ₸XX,XXX/person
│   │   └── Duration: X hours
│   │
│   └── [Stats Footer]
│       ├── 📅 XX bookings
│       ├── ⭐ 4.8 (XX reviews)
│       └── [Edit] [View] Buttons
│
└── [Pagination]

[Empty State]
├── Illustration: 🎨
├── "No activities yet"
├── "Create your first activity to start receiving bookings"
└── [Create Activity] Button
```

**Create/Edit Activity Form:**
```
[Multi-Step Form]
├── Progress Indicator
│   ├── 1. Basic Info ✓
│   ├── 2. Location & Photos (active)
│   ├── 3. Pricing & Schedule
│   └── 4. Details & Review

[Step 1: Basic Information]
├── Activity Title *
│   └── Input (10-100 chars)
├── Category *
│   └── Select: Tour, Excursion, Attraction, etc.
├── Description *
│   └── Rich Text Editor (Quill/TipTap)
│       ├── Toolbar: Bold, Italic, Lists, Links
│       └── Character count: XXX/5000
└── Duration *
    ├── Hours: [0-24] dropdown
    └── Minutes: [0, 15, 30, 45] dropdown

[Step 2: Location & Photos]
├── Location *
│   ├── Address Autocomplete (Google Places)
│   │   └── Suggestions dropdown
│   ├── Map Preview
│   │   └── Marker at selected location
│   └── City: Auto-filled
│
└── Photos *
    ├── Upload Zone (drag & drop)
    │   ├── "Drag photos here or click to browse"
    │   ├── Max 10 images, 5MB each
    │   └── Accepted: JPG, PNG, WebP
    │
    └── Photo Gallery
        ├── [Photo Thumbnail] × N
        │   ├── Image preview
        │   ├── Reorder handle (⋮⋮)
        │   ├── Set as cover checkbox
        │   ├── Caption input
        │   └── [Delete] icon
        └── Upload progress bars

[Step 3: Pricing & Schedule]
├── Pricing
│   ├── Price per Person * (₸)
│   │   └── Number input (min 1000)
│   │
│   └── Group Pricing (optional)
│       ├── [Enable Group Discounts] Toggle
│       └── Tier Table
│           ├── 1-5 people: ₸XX,XXX/person
│           ├── 6-10 people: ₸XX,XXX/person
│           └── [Add Tier] Button
│
├── Capacity
│   ├── Min Participants: [1-100]
│   └── Max Participants: [1-100]
│
├── Schedule Type
│   ├── ○ Fixed Schedule (specific times)
│   └── ○ Flexible (book anytime)
│
└── Fixed Schedule (if selected)
    ├── Available Days
    │   └── [M] [T] [W] [T] [F] [S] [S] (toggles)
    │
    └── Time Slots
        ├── [Time Slot] × N
        │   ├── Day: Monday dropdown
        │   ├── Start: 10:00 time picker
        │   ├── End: 12:00 time picker
        │   └── [Remove] icon
        └── [Add Time Slot] Button

[Step 4: Details & Review]
├── What's Included
│   ├── [Inclusion Item] × N
│   │   ├── ✓ Input field
│   │   └── [Remove] icon
│   └── [Add Item] Button
│
├── What's Excluded
│   └── (Same as inclusions)
│
├── Requirements
│   ├── "What should participants know?"
│   └── (Same as inclusions)
│
├── Booking Settings
│   ├── Advance Booking: [1-365] days
│   │   └── "Participants must book X days in advance"
│   │
│   └── Cancellation Policy
│       ├── ○ Flexible (Full refund 24h before)
│       ├── ○ Moderate (Full refund 3 days before)
│       └── ○ Strict (50% refund 7 days before)
│
└── Review Summary
    ├── Activity preview card
    ├── All form values displayed
    └── [Save as Draft] [Submit for Approval] Buttons

[Form Actions]
├── [Back] Button (ghost)
├── [Save Draft] Button (secondary)
└── [Continue] or [Submit] Button (primary)
```

**Activity Detail View:**
```
[Page Header]
├── [Back to Dashboard] Link
├── Activity Title
├── Status Badge: Active ✓ / Draft 📝 / Inactive ⏸
└── Action Buttons
    ├── [Edit Activity] (primary)
    ├── [Toggle Active/Inactive] (secondary)
    └── More Actions (•••)
        ├── Duplicate Activity
        ├── Download Report
        └── Delete Activity

[Content Tabs]
├── Tab 1: Overview (active)
├── Tab 2: Bookings
├── Tab 3: Analytics
└── Tab 4: Reviews

[Overview Tab]
├── [Photo Gallery Carousel]
│   ├── Large image display
│   ├── Thumbnails below
│   └── Navigation arrows
│
├── [Details Grid]
│   ├── [Left Column]
│   │   ├── Description (rich HTML)
│   │   ├── Duration: X hours
│   │   ├── Category badge
│   │   ├── Max Participants: XX
│   │   ├── What's Included (✓ list)
│   │   ├── What's Excluded (✗ list)
│   │   └── Requirements (ⓘ list)
│   │
│   └── [Right Sidebar]
│       ├── [Pricing Card]
│       │   ├── ₸XX,XXX per person
│       │   └── Group pricing tiers
│       │
│       ├── [Location Card]
│       │   ├── 📍 Address
│       │   └── Static map
│       │
│       ├── [Schedule Card]
│       │   ├── Available days
│       │   ├── Time slots list
│       │   └── Advance booking: X days
│       │
│       └── [Stats Card]
│           ├── Total bookings: XXX
│           ├── Revenue: ₸XX,XXX
│           ├── Rating: ⭐ 4.8
│           └── Reviews: XXX

[Bookings Tab]
├── Date Range Filter
├── Status Filter
└── Bookings Table
    ├── Date | Time | Participants | Customer | Amount | Status
    └── [View Details] action per row

[Analytics Tab]
├── [Chart: Bookings Over Time]
│   ├── Line chart
│   └── Date range selector
│
├── [Chart: Revenue Trend]
│   └── Bar chart
│
└── [Performance Metrics]
    ├── Average group size
    ├── Booking conversion rate
    ├── Cancellation rate
    └── Average booking value
```

**Photo Upload Component:**
```
[Upload Zone]
├── Drag & Drop Area
│   ├── Icon: 📷
│   ├── "Drag photos here"
│   ├── "or click to browse"
│   └── "Max 10 images, 5MB each"
│
├── [Upload Progress] (when uploading)
│   ├── Filename
│   ├── Progress bar
│   └── Cancel button
│
└── [Photo Grid] (after upload)
    ├── [Photo Card] × N
    │   ├── Thumbnail
    │   ├── Drag handle (⋮⋮)
    │   ├── [Set as Cover] checkbox
    │   ├── Caption: Input field
    │   ├── Size: XXX KB
    │   └── Actions
    │       ├── [Preview] 👁
    │       └── [Delete] 🗑
    └── [Add More] Button
```

### Design System Compliance

**Color Palette:**
```css
/* Activity Status Colors */
--status-active: #10b981;       /* bg-emerald-500 */
--status-draft: #6b7280;        /* bg-gray-500 */
--status-inactive: #f59e0b;     /* bg-amber-500 */
--status-pending: #3b82f6;      /* bg-blue-500 */

/* Category Colors */
--category-tour: #8b5cf6;       /* bg-violet-500 */
--category-adventure: #ef4444;  /* bg-red-500 */
--category-cultural: #f59e0b;   /* bg-amber-500 */
--category-food: #ec4899;       /* bg-pink-500 */
```

**Typography:**
```css
/* Activity Cards */
.activity-title {
  @apply text-lg font-semibold text-gray-900 line-clamp-2;
}

.activity-description {
  @apply text-sm text-gray-600 line-clamp-3;
}

/* Form Labels */
.form-label {
  @apply text-sm font-medium text-gray-700 mb-1;
}

.form-required::after {
  content: ' *';
  @apply text-red-500;
}
```

### Responsive Behavior

**Mobile (<768px)**:
```css
.dashboard-mobile {
  @apply flex flex-col space-y-4 px-4;
}

.stats-cards-mobile {
  @apply grid grid-cols-2 gap-3;
}

.activities-grid-mobile {
  @apply flex flex-col space-y-4;
}

.activity-card-mobile {
  @apply w-full;
}

.form-step-mobile {
  @apply flex flex-col space-y-4;
}
```

**Desktop (1024px+)**:
```css
.dashboard-desktop {
  @apply max-w-7xl mx-auto px-8 py-8;
}

.stats-cards-desktop {
  @apply grid grid-cols-4 gap-6;
}

.activities-grid-desktop {
  @apply grid grid-cols-3 gap-6;
}

.form-layout-desktop {
  @apply grid grid-cols-3 gap-8;
  /* 2/3 form, 1/3 preview */
}
```

## Technical Architecture

### Component Structure

```
src/app/
├── activity-owner/
│   ├── dashboard/
│   │   ├── page.tsx                          # Owner dashboard ⬜
│   │   ├── loading.tsx                       # Loading state ⬜
│   │   └── components/
│   │       ├── DashboardStats.tsx            # Stats cards ⬜
│   │       ├── ActivitiesGrid.tsx            # Activity grid ⬜
│   │       ├── ActivityCard.tsx              # Activity card ⬜
│   │       ├── FilterBar.tsx                 # Filters ⬜
│   │       └── EmptyState.tsx                # No activities ⬜
│   │
│   └── activities/
│       ├── new/
│       │   ├── page.tsx                      # Create activity ⬜
│       │   └── components/
│       │       ├── ActivityForm.tsx          # Multi-step form ⬜
│       │       ├── BasicInfoStep.tsx         # Step 1 ⬜
│       │       ├── LocationPhotosStep.tsx    # Step 2 ⬜
│       │       ├── PricingScheduleStep.tsx   # Step 3 ⬜
│       │       ├── DetailsReviewStep.tsx     # Step 4 ⬜
│       │       ├── RichTextEditor.tsx        # Description editor ⬜
│       │       ├── PhotoUploader.tsx         # Photo upload ⬜
│       │       ├── LocationPicker.tsx        # Map/autocomplete ⬜
│       │       ├── ScheduleBuilder.tsx       # Schedule config ⬜
│       │       └── FormPreview.tsx           # Review summary ⬜
│       │
│       └── [id]/
│           ├── page.tsx                      # Activity detail ⬜
│           ├── edit/
│           │   └── page.tsx                  # Edit activity ⬜
│           └── components/
│               ├── ActivityOverview.tsx      # Overview tab ⬜
│               ├── ActivityBookings.tsx      # Bookings tab ⬜
│               ├── ActivityAnalytics.tsx     # Analytics tab ⬜
│               ├── PhotoGallery.tsx          # Photo carousel ⬜
│               ├── ScheduleDisplay.tsx       # Schedule view ⬜
│               └── BookingsTable.tsx         # Bookings table ⬜
│
└── api/
    └── activities/
        ├── route.ts                          # POST create ⬜
        ├── owner/
        │   └── route.ts                      # GET owner activities ⬜
        ├── [id]/
        │   ├── route.ts                      # GET/PUT/DELETE ⬜
        │   ├── toggle-status/
        │   │   └── route.ts                  # POST toggle ⬜
        │   └── bookings/
        │       └── route.ts                  # GET bookings ⬜
        └── photos/
            └── upload/
                └── route.ts                  # POST upload ⬜
```

### State Management Architecture

**Activity Form State:**
```typescript
interface ActivityFormState {
  // Current step
  currentStep: number;
  completedSteps: number[];
  
  // Form data
  formData: {
    basicInfo: BasicInfoData;
    locationPhotos: LocationPhotosData;
    pricingSchedule: PricingScheduleData;
    details: DetailsData;
  };
  
  // Validation
  validationErrors: Record<string, string[]>;
  isValid: boolean;
  
  // UI state
  isDirty: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  
  // Actions
  updateStep: (step: number) => void;
  updateFormData: (step: string, data: Partial<any>) => void;
  validateStep: (step: number) => boolean;
  saveAsDraft: () => Promise<void>;
  submitForApproval: () => Promise<void>;
}

interface BasicInfoData {
  title: string;
  description: string;
  category: ActivityCategory;
  durationMinutes: number;
}

interface LocationPhotosData {
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
  photos: UploadedPhoto[];
}

interface PricingScheduleData {
  pricePerPerson: number;
  groupPricing: GroupPricingTier[];
  minParticipants: number;
  maxParticipants: number;
  scheduleType: 'FIXED' | 'FLEXIBLE';
  schedules: ActivitySchedule[];
  availableDays: DayOfWeek[];
}

interface DetailsData {
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  advanceBookingDays: number;
  cancellationPolicy: CancellationPolicy;
}
```

### Database Schema Updates

```prisma
model User {
  // ... existing fields
  
  activities Activity[]
}

model Activity {
  id              String   @id @default(cuid())
  ownerId         String
  owner           User     @relation(fields: [ownerId], references: [id])
  
  // Basic info
  title           String
  description     String   @db.Text
  category        String   // TOUR, EXCURSION, ATTRACTION, etc.
  status          String   @default("DRAFT")  // DRAFT, PENDING_APPROVAL, ACTIVE, INACTIVE
  
  // Location
  address         String
  city            String
  country         String   @default("Kazakhstan")
  latitude        Float
  longitude       Float
  placeId         String?  // Google Places ID
  
  // Pricing
  pricePerPerson  Int
  currency        String   @default("KZT")
  groupPricing    Json?    // GroupPricingTier[]
  
  // Capacity
  minParticipants Int      @default(1)
  maxParticipants Int
  
  // Duration
  durationMinutes Int
  
  // Schedule
  scheduleType    String   // FIXED, FLEXIBLE
  schedules       ActivitySchedule[]
  availableDays   String[] // Array of day names
  blackoutDates   DateTime[] // Dates not available
  
  // Booking settings
  advanceBookingDays Int   @default(1)
  cancellationPolicy Json  // CancellationPolicy object
  
  // Details
  inclusions      String[]
  exclusions      String[]
  requirements    String[]
  
  // Media
  photos          ActivityPhoto[]
  
  // Stats (denormalized for performance)
  totalBookings   Int      @default(0)
  totalRevenue    Int      @default(0)
  averageRating   Float?
  reviewCount     Int      @default(0)
  
  // Approval
  publishedAt     DateTime?
  approvedAt      DateTime?
  approvedBy      String?
  rejectionReason String?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  bookings        ActivityBooking[]
  reviews         ActivityReview[]
  
  @@index([ownerId, status])
  @@index([city, category])
  @@index([status, publishedAt])
}

model ActivityPhoto {
  id              String   @id @default(cuid())
  activityId      String
  activity        Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  url             String
  thumbnailUrl    String
  cloudinaryId    String   @unique
  
  width           Int
  height          Int
  size            Int      // Bytes
  format          String   // jpg, png, webp
  
  caption         String?
  order           Int      @default(0)
  isCover         Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  
  @@index([activityId, order])
}

model ActivitySchedule {
  id              String   @id @default(cuid())
  activityId      String
  activity        Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  dayOfWeek       String?  // MONDAY, TUESDAY, etc. (null for flexible)
  startTime       String   // "10:00"
  endTime         String   // "12:00"
  
  isRecurring     Boolean  @default(true)
  specificDate    DateTime?  // For one-time events
  
  @@index([activityId, dayOfWeek])
}

model ActivityBooking {
  id              String   @id @default(cuid())
  bookingNumber   String   @unique
  activityId      String
  activity        Activity @relation(fields: [activityId], references: [id])
  
  passengerId     String
  passenger       User     @relation(fields: [passengerId], references: [id])
  
  // Scheduled time
  scheduledDate   DateTime
  scheduledTime   String   // "10:00"
  
  // Participants
  participants    Int
  participantDetails Json  // Array of participant info
  
  // Pricing
  pricePerPerson  Int
  totalAmount     Int
  currency        String   @default("KZT")
  
  // Payment
  paymentId       String?
  paymentStatus   String   // PENDING, PAID, REFUNDED
  
  // Status
  status          String   @default("CONFIRMED")  // CONFIRMED, COMPLETED, CANCELLED
  
  // Cancellation
  cancelledAt     DateTime?
  cancellationReason String?
  refundAmount    Int?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([activityId, scheduledDate])
  @@index([passengerId])
}

model ActivityReview {
  id              String   @id @default(cuid())
  activityId      String
  activity        Activity @relation(fields: [activityId], references: [id])
  
  bookingId       String   @unique
  passengerId     String
  passenger       User     @relation(fields: [passengerId], references: [id])
  
  rating          Int      // 1-5
  comment         String?  @db.Text
  
  photos          String[] // Review photo URLs
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([activityId, rating])
}
```

### API Integration Schema

**Cloudinary Image Upload:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadActivityPhoto(
  file: File,
  activityId: string
): Promise<UploadedPhoto> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;
  
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `activities/${activityId}`,
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
    ],
    eager: [
      { width: 400, height: 300, crop: 'fill' },  // Thumbnail
    ],
  });
  
  return {
    id: cuid(),
    url: result.secure_url,
    thumbnailUrl: result.eager[0].secure_url,
    cloudinaryId: result.public_id,
    width: result.width,
    height: result.height,
    size: result.bytes,
    format: result.format,
  };
}
```

**Form Validation Schema (Zod):**
```typescript
import { z } from 'zod';

const activitySchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(100).max(5000),
  category: z.enum(['TOUR', 'EXCURSION', 'ATTRACTION', 'ADVENTURE', 'CULTURAL', 'FOOD_DRINK', 'WELLNESS', 'WORKSHOP']),
  
  location: z.object({
    address: z.string().min(5),
    city: z.string().min(2),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    placeId: z.string(),
  }),
  
  pricePerPerson: z.number().min(1000).max(1000000),
  groupPricing: z.array(z.object({
    minParticipants: z.number().min(1),
    maxParticipants: z.number().min(1),
    pricePerPerson: z.number().min(1000),
  })).optional(),
  
  minParticipants: z.number().min(1).max(100),
  maxParticipants: z.number().min(1).max(100),
  
  durationMinutes: z.number().min(30).max(1440),
  
  scheduleType: z.enum(['FIXED', 'FLEXIBLE']),
  schedules: z.array(z.object({
    dayOfWeek: z.string().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })),
  
  advanceBookingDays: z.number().min(1).max(365),
  
  inclusions: z.array(z.string()).min(1),
  exclusions: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  
  photoIds: z.array(z.string()).min(3).max(10),
});
```

## Implementation Requirements

### Core Components

#### 1. ActivityForm.tsx ⬜
**Purpose**: Multi-step activity creation

**Features**:
- 4-step wizard
- Progress indicator
- Form validation
- Auto-save draft

#### 2. PhotoUploader.tsx ⬜
**Purpose**: Photo upload management

**Features**:
- Drag & drop
- Multiple files
- Preview & reorder
- Validation

#### 3. LocationPicker.tsx ⬜
**Purpose**: Location selection

**Features**:
- Google Places autocomplete
- Map preview
- Pin placement

#### 4. ScheduleBuilder.tsx ⬜
**Purpose**: Schedule configuration

**Features**:
- Time slot management
- Day selection
- Recurring patterns

### Custom Hooks

#### useActivityForm() ⬜
```typescript
interface UseActivityFormReturn {
  formData: ActivityFormData;
  currentStep: number;
  errors: ValidationErrors;
  
  updateField: (field: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveAsDraft: () => Promise<void>;
  submit: () => Promise<void>;
}
```

#### usePhotoUpload() ⬜
```typescript
interface UsePhotoUploadReturn {
  photos: UploadedPhoto[];
  isUploading: boolean;
  progress: number;
  
  uploadPhotos: (files: File[]) => Promise<void>;
  removePhoto: (photoId: string) => void;
  reorderPhotos: (photos: UploadedPhoto[]) => void;
}
```

## Acceptance Criteria

### Functional Requirements

#### 1. Activity Creation ⬜
- [x] Owner can create new activity
- [x] All required fields validated
- [x] 3-10 photos required
- [x] Location autocomplete works
- [x] Schedule builder functional
- [x] Save as draft works
- [x] Submit for approval works

#### 2. Activity Management ⬜
- [x] Owner sees all activities
- [x] Can edit existing activity
- [x] Can toggle active/inactive
- [x] Can delete draft activities
- [x] Stats displayed correctly

#### 3. Photo Upload ⬜
- [x] Drag & drop works
- [x] Multiple upload supported
- [x] Image validation (type, size)
- [x] Reorder photos works
- [x] Set cover photo works

### Non-Functional Requirements

#### Performance ⬜
- [x] Dashboard loads <2 seconds
- [x] Photo upload <5 seconds per image
- [x] Form submission <3 seconds

#### Security ⬜
- [x] Role-based access enforced
- [x] Image validation comprehensive
- [x] XSS protection enabled

## Modified Files

```
src/app/activity-owner/
├── dashboard/
│   ├── page.tsx                              ⬜
│   └── components/                           ⬜ (6 files)
└── activities/
    ├── new/
    │   ├── page.tsx                          ⬜
    │   └── components/                       ⬜ (9 files)
    └── [id]/
        ├── page.tsx                          ⬜
        ├── edit/page.tsx                     ⬜
        └── components/                       ⬜ (6 files)

src/app/api/activities/
├── route.ts                                  ⬜
├── owner/route.ts                            ⬜
├── [id]/                                     ⬜ (4 endpoints)
└── photos/upload/route.ts                    ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Dashboard (Week 1) ⬜
- [ ] Owner dashboard UI
- [ ] Activity grid/cards
- [ ] Stats overview
- [ ] Filter/sort functionality

### Phase 2: Activity Creation (Week 2-3) ⬜
- [ ] Multi-step form
- [ ] Basic info step
- [ ] Location picker
- [ ] Photo uploader
- [ ] Pricing/schedule step
- [ ] Details/review step

### Phase 3: Activity Management (Week 3-4) ⬜
- [ ] Activity detail view
- [ ] Edit functionality
- [ ] Status toggle
- [ ] Bookings view
- [ ] Analytics dashboard

### Phase 4: Testing (Week 4) ⬜
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E testing
- [ ] Performance optimization

## Dependencies

- **Cloudinary**: Image hosting
- **Google Places API**: Location services
- **TipTap/Quill**: Rich text editor
- **Story 35**: Payment integration

## Risk Assessment

### Technical Risks

#### Risk 1: Photo Upload Performance
- **Impact**: High (user experience)
- **Mitigation**: Compress before upload
- **Contingency**: Queue uploads

#### Risk 2: Complex Form State
- **Impact**: Medium (bugs)
- **Mitigation**: Comprehensive validation
- **Contingency**: Simplified flow

## Testing Strategy

```typescript
describe('Activity Management', () => {
  it('creates activity successfully', async () => {
    // Test creation flow
  });
  
  it('uploads photos correctly', async () => {
    // Test photo upload
  });
  
  it('validates form data', () => {
    // Test validation
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 4 weeks (1 developer)
