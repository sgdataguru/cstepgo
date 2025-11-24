# 41 - Passenger Browse and Book Activities - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, Redis (caching)  
**Infrastructure**: Vercel (hosting), Stripe (payments), Redis (availability locking)

## User Story

**As a** passenger,  
**I want** to browse and book activities and events (like tours and experiences),  
**so that** I can plan my trips and make the most of my time in a destination.

## Pre-conditions

- User must be registered and logged in
- Story 40 (Activity Owner Management) completed with activities available
- Story 35 (Payment system) completed for booking payments
- Activity availability system configured
- Email notification service set up

## Business Requirements

- **BR-1**: Provide seamless activity discovery and booking experience
  - Success Metric: >30% of users browse activities section
  - Performance: Activities page loads <2 seconds

- **BR-2**: Enable easy filtering and search to find relevant activities
  - Success Metric: >60% of users apply at least one filter
  - Performance: Filter response <500ms

- **BR-3**: Prevent overbooking through real-time availability management
  - Success Metric: Zero double-booking incidents
  - Performance: Availability check <200ms

- **BR-4**: Drive conversions through clear pricing and booking flow
  - Success Metric: >15% booking conversion rate
  - Performance: Checkout completion <30 seconds

## Technical Specifications

### Integration Points
- **Payment**: Stripe integration from Story 35
- **Email**: Booking confirmation emails
- **Maps**: Google Static Maps API for location display
- **Availability**: Redis for real-time slot locking
- **Analytics**: Track booking funnel metrics
- **Reviews**: Display ratings and reviews

### Security Requirements
- Validate user authentication for booking
- Prevent race conditions with optimistic locking
- Sanitize user inputs (participant details)
- Rate limiting on booking endpoints (10 req/min per user)
- Idempotency keys for payment processing

### API Endpoints

#### GET /api/activities
Retrieves paginated list of activities with filtering.

**Query Parameters:**
```typescript
interface ActivitiesQuery {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filters
  city?: string;
  category?: ActivityCategory;
  minPrice?: number;
  maxPrice?: number;
  date?: string;  // ISO date for availability check
  participants?: number;
  
  // Search
  q?: string;  // Search query for title/description
  
  // Sorting
  sortBy?: 'popularity' | 'price' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface ActivitiesResponse {
  activities: ActivityCard[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    availableCategories: { category: string; count: number }[];
    priceRange: { min: number; max: number };
    availableCities: string[];
  };
}

interface ActivityCard {
  id: string;
  title: string;
  category: ActivityCategory;
  
  // Media
  thumbnailUrl: string;
  photoCount: number;
  
  // Location
  city: string;
  address: string;
  
  // Pricing
  pricePerPerson: number;
  currency: 'KZT';
  priceDisplay: string;  // "From ₸5,000"
  
  // Duration
  durationDisplay: string;  // "2 hours"
  
  // Stats
  rating: number;
  reviewCount: number;
  totalBookings: number;
  
  // Highlights
  highlights: string[];  // Top 3 inclusions
  
  // Availability (if date filter applied)
  availableSlots?: number;
  nextAvailableDate?: Date;
}
```

#### GET /api/activities/:id
Retrieves detailed activity information.

**Response:**
```typescript
interface ActivityDetailResponse {
  activity: ActivityDetail;
  availability: AvailabilityCalendar;
  reviews: Review[];
  similarActivities: ActivityCard[];
}

interface ActivityDetail {
  id: string;
  title: string;
  description: string;  // Rich HTML
  category: ActivityCategory;
  
  // Media
  photos: ActivityPhoto[];
  
  // Location
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    staticMapUrl: string;  // Google Static Maps
  };
  
  // Pricing
  pricePerPerson: number;
  groupPricing: GroupPricingTier[] | null;
  currency: 'KZT';
  
  // Capacity
  minParticipants: number;
  maxParticipants: number;
  
  // Duration
  durationMinutes: number;
  durationDisplay: string;
  
  // Details
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  
  // Policies
  cancellationPolicy: {
    type: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
    description: string;
    refundRules: RefundRule[];
  };
  
  advanceBookingDays: number;
  
  // Stats
  rating: number;
  reviewCount: number;
  totalBookings: number;
  
  // Owner
  owner: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: number;
    activitiesCount: number;
  };
}

interface ActivityPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
}

interface RefundRule {
  daysBeforeActivity: number;
  refundPercentage: number;
  description: string;
}
```

#### GET /api/activities/:id/availability
Retrieves availability calendar for an activity.

**Query Parameters:**
```typescript
interface AvailabilityQuery {
  startDate: string;  // ISO date
  endDate: string;    // ISO date
  participants?: number;
}
```

**Response:**
```typescript
interface AvailabilityResponse {
  dates: DateAvailability[];
  schedules: ActivitySchedule[];
}

interface DateAvailability {
  date: string;  // "2025-02-01"
  isAvailable: boolean;
  availableSlots: TimeSlot[];
  reason?: string;  // If not available: "Fully booked", "Not operating"
}

interface TimeSlot {
  scheduleId: string;
  startTime: string;  // "10:00"
  endTime: string;    // "12:00"
  availableSpots: number;
  maxParticipants: number;
  pricePerPerson: number;
  isAvailable: boolean;
}
```

#### POST /api/activities/:id/check-availability
Checks real-time availability for specific date/time/participants.

**Request:**
```typescript
interface CheckAvailabilityRequest {
  date: string;  // "2025-02-01"
  scheduleId: string;
  participants: number;
}
```

**Response:**
```typescript
interface CheckAvailabilityResponse {
  isAvailable: boolean;
  availableSpots: number;
  message?: string;
  pricing: {
    pricePerPerson: number;
    totalAmount: number;
    currency: 'KZT';
  };
}
```

#### POST /api/activities/:id/book
Creates an activity booking.

**Request:**
```typescript
interface BookActivityRequest {
  // Booking details
  date: string;  // "2025-02-01"
  scheduleId: string;
  participants: number;
  
  // Participant details
  leadParticipant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  
  additionalParticipants?: {
    firstName: string;
    lastName: string;
    age?: number;
  }[];
  
  // Special requests
  specialRequests?: string;
  
  // Payment
  paymentMethodId: string;  // Stripe payment method
  
  // Idempotency
  idempotencyKey: string;
}
```

**Response:**
```typescript
interface BookActivityResponse {
  booking: {
    id: string;
    bookingNumber: string;
    activityId: string;
    activityTitle: string;
    
    scheduledDate: Date;
    scheduledTime: string;
    
    participants: number;
    totalAmount: number;
    
    status: 'CONFIRMED' | 'PENDING_PAYMENT';
    
    createdAt: Date;
  };
  
  payment: {
    paymentIntentId: string;
    clientSecret: string;  // For 3D Secure if needed
    status: 'SUCCEEDED' | 'REQUIRES_ACTION';
  };
  
  confirmationEmail: {
    sent: boolean;
  };
}
```

#### GET /api/activities/:id/reviews
Retrieves reviews for an activity.

**Query Parameters:**
```typescript
interface ReviewsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'helpful' | 'rating';
}
```

**Response:**
```typescript
interface ReviewsResponse {
  reviews: Review[];
  pagination: PaginationInfo;
  summary: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  photos: string[];
  
  reviewer: {
    name: string;
    avatarUrl?: string;
    reviewCount: number;
  };
  
  bookingDate: Date;
  createdAt: Date;
  
  helpful: number;  // Helpful count
  verified: boolean;  // Verified booking
}
```

## Design Specifications

### Visual Layout & Components

**Activities Listing Page:**
```
[Hero Section]
├── Background: Activity collage
├── Heading: "Discover Amazing Experiences"
├── Subheading: "Tours, attractions, and activities"
└── [Search Bar]
    ├── Location input (with autocomplete)
    ├── Date picker
    ├── Participants selector
    └── [Search] Button

[Filter & Sort Bar]
├── [Left Side]
│   ├── Active Filters: Badges × N
│   │   └── "Almaty" ✕ | "Tours" ✕
│   ├── [Filters] Button (mobile)
│   └── Results count: "48 activities found"
│
└── [Right Side]
    └── Sort: Dropdown
        ├── ○ Most Popular (default)
        ├── ○ Price: Low to High
        ├── ○ Price: High to Low
        ├── ○ Highest Rated
        └── ○ Newest First

[Content Layout]
├── [Left Sidebar - Filters] (desktop only)
│   ├── [Location Filter]
│   │   ├── "Location"
│   │   └── Checkbox list
│   │       ├── ☑ Almaty (32)
│   │       ├── ☐ Nur-Sultan (16)
│   │       └── ☐ Shymkent (8)
│   │
│   ├── [Category Filter]
│   │   ├── "Category"
│   │   └── Checkbox list
│   │       ├── ☑ Tours (20)
│   │       ├── ☐ Adventures (12)
│   │       ├── ☐ Cultural (10)
│   │       └── ☐ Food & Drink (6)
│   │
│   ├── [Price Range Filter]
│   │   ├── "Price Range"
│   │   ├── Dual range slider
│   │   │   └── ₸1,000 - ₸50,000
│   │   └── Min/Max inputs
│   │
│   ├── [Duration Filter]
│   │   ├── "Duration"
│   │   └── Checkboxes
│   │       ├── ☐ < 2 hours
│   │       ├── ☐ 2-4 hours
│   │       ├── ☐ 4-8 hours
│   │       └── ☐ Full day
│   │
│   └── [Rating Filter]
│       ├── "Minimum Rating"
│       └── Star selector
│           ├── ☐ 5 stars
│           ├── ☑ 4+ stars
│           ├── ☐ 3+ stars
│           └── ☐ Any rating
│
└── [Main Content - Activities Grid]
    ├── [Activity Card] × N
    │   ├── [Image Container]
    │   │   ├── Hero image (16:9)
    │   │   ├── Category badge (top-left)
    │   │   ├── "Bestseller" badge (top-right)
    │   │   └── Wishlist heart icon (top-right)
    │   │
    │   ├── [Content]
    │   │   ├── Title (2 lines max)
    │   │   ├── Location: 📍 Almaty
    │   │   ├── Rating: ⭐ 4.8 (156 reviews)
    │   │   ├── Duration: ⏱ 2 hours
    │   │   └── Highlights
    │   │       ├── ✓ Hotel pickup
    │   │       ├── ✓ Expert guide
    │   │       └── ✓ Small groups
    │   │
    │   └── [Footer]
    │       ├── Price: From ₸5,000/person
    │       └── [View Details] Button
    │
    └── [Pagination]
        ├── ← Previous
        ├── 1 [2] 3 ... 10
        └── Next →

[Mobile Filter Drawer]
├── Slide-up from bottom
├── All filters in scrollable list
├── [Apply Filters] Button (sticky bottom)
└── [Clear All] Link
```

**Activity Detail Page:**
```
[Page Header]
├── [Back to Activities] Link
└── Share & Wishlist icons

[Hero Gallery]
├── Main image (large, clickable)
├── Thumbnail grid (4 images)
│   └── "+20 photos" overlay on last
└── [View All Photos] opens lightbox

[Content Layout]
├── [Left Column - Main Content]
│   ├── [Activity Header]
│   │   ├── Category badge
│   │   ├── Title (H1)
│   │   ├── Rating: ⭐ 4.8/5.0 (156 reviews)
│   │   ├── Location: 📍 Almaty, Kazakhstan
│   │   └── Duration: ⏱ 2 hours
│   │
│   ├── [Description Section]
│   │   ├── "About This Experience"
│   │   └── Rich text content
│   │
│   ├── [Highlights Section]
│   │   ├── "What's Included"
│   │   └── Checklist
│   │       ├── ✓ Hotel pickup & drop-off
│   │       ├── ✓ Professional guide
│   │       ├── ✓ Entrance fees
│   │       └── ✓ Snacks & water
│   │
│   ├── [Exclusions Section]
│   │   ├── "What's Not Included"
│   │   └── List
│   │       ├── ✗ Personal expenses
│   │       └── ✗ Tips (optional)
│   │
│   ├── [Requirements Section]
│   │   ├── "Important Information"
│   │   └── List
│   │       ├── ⓘ Moderate fitness required
│   │       └── ⓘ Not wheelchair accessible
│   │
│   ├── [Map Section]
│   │   ├── "Meeting Point"
│   │   ├── Static map image
│   │   └── Full address
│   │
│   ├── [Cancellation Policy]
│   │   ├── "Cancellation Policy"
│   │   ├── Badge: Flexible / Moderate / Strict
│   │   └── Policy details
│   │       ├── • Full refund: 24+ hours before
│   │       ├── • 50% refund: 12-24 hours
│   │       └── • No refund: < 12 hours
│   │
│   └── [Reviews Section]
│       ├── "Reviews (156)"
│       ├── Rating summary
│       │   ├── Overall: 4.8/5.0
│       │   └── Rating bars
│       │       ├── 5★ ████████████ 78%
│       │       ├── 4★ ████░░░░░░░░ 15%
│       │       ├── 3★ ██░░░░░░░░░░ 5%
│       │       ├── 2★ ░░░░░░░░░░░░ 1%
│       │       └── 1★ ░░░░░░░░░░░░ 1%
│       │
│       └── [Review Cards] × 5
│           ├── Reviewer info
│           ├── ⭐⭐⭐⭐⭐
│           ├── Review text
│           ├── Review photos
│           ├── Date: January 2025
│           └── Verified badge
│
└── [Right Column - Booking Widget]
    ├── [Sticky Booking Card]
    │   ├── Price Display
    │   │   ├── From ₸5,000/person
    │   │   └── "Group discounts available"
    │   │
    │   ├── [Date Picker]
    │   │   ├── Label: "Select Date"
    │   │   └── Calendar dropdown
    │   │       ├── Available dates: ●
    │   │       ├── Unavailable: ○
    │   │       └── Selected: ◉
    │   │
    │   ├── [Time Slot Selector]
    │   │   ├── Label: "Select Time"
    │   │   └── Button grid
    │   │       ├── [10:00 AM] (12 spots)
    │   │       ├── [2:00 PM] (8 spots) ✓
    │   │       └── [6:00 PM] (Sold out)
    │   │
    │   ├── [Participants Counter]
    │   │   ├── Label: "Participants"
    │   │   └── Counter: [-] 2 [+]
    │   │       └── "Max 15 per booking"
    │   │
    │   ├── [Price Breakdown]
    │   │   ├── 2 × ₸5,000 = ₸10,000
    │   │   ├── Taxes & fees: ₸500
    │   │   └── Total: ₸10,500
    │   │
    │   └── [Book Now] Button (primary, large)
    │       └── "Free cancellation up to 24h"
    │
    ├── [Activity Owner Card]
    │   ├── Avatar + Name
    │   ├── ⭐ 4.9 (50+ activities)
    │   └── [View Profile] Link
    │
    └── [Safety Badge]
        ├── Icon: ✓
        ├── "COVID-19 Safety"
        └── "Enhanced cleaning"

[Booking Modal]
├── Modal overlay
├── [Booking Details Summary]
│   ├── Activity title
│   ├── Date & time
│   ├── Participants: X people
│   └── Total: ₸XX,XXX
│
├── [Lead Participant Form]
│   ├── First Name *
│   ├── Last Name *
│   ├── Email *
│   ├── Phone *
│   └── "Booking confirmation will be sent here"
│
├── [Additional Participants] (if > 1)
│   ├── "Participant 2"
│   │   ├── First Name
│   │   ├── Last Name
│   │   └── Age (optional)
│   └── [+ Add Participant] if < selected count
│
├── [Special Requests]
│   └── Textarea (optional)
│       └── "Any dietary restrictions or requests?"
│
├── [Payment Method]
│   ├── Stripe card element
│   └── "Your payment is secure"
│
├── [Terms Checkbox]
│   └── ☐ I agree to cancellation policy
│
└── [Actions]
    ├── [Cancel] Button
    └── [Confirm & Pay ₸XX,XXX] Button (primary)
```

**Booking Confirmation Page:**
```
[Success Header]
├── Icon: ✓ (large, green)
├── "Booking Confirmed!"
└── Booking #ACT-XXXXX

[Booking Summary Card]
├── Activity title
├── Owner info with avatar
├── Date & Time: February 1, 2025 at 10:00 AM
├── Duration: 2 hours
├── Participants: 2 people
├── Meeting Point: [Address]
└── Total Paid: ₸10,500

[What's Next Section]
├── "📧 Confirmation email sent"
├── "📱 Add to calendar"
└── "📍 Save meeting point"

[Important Information]
├── Check-in: Arrive 15 min early
├── Bring: ID, comfortable shoes
└── Contact: Owner phone number

[Actions]
├── [Download Receipt] Button
├── [View My Bookings] Button
└── [Browse More Activities] Link
```

### Design System Compliance

**Color Palette:**
```css
/* Activity Category Colors */
--category-tour: #8b5cf6;       /* bg-violet-500 */
--category-adventure: #ef4444;  /* bg-red-500 */
--category-cultural: #f59e0b;   /* bg-amber-500 */
--category-food: #ec4899;       /* bg-pink-500 */
--category-wellness: #10b981;   /* bg-emerald-500 */

/* Availability Status */
--available: #10b981;           /* bg-emerald-500 */
--limited: #f59e0b;             /* bg-amber-500 */
--sold-out: #ef4444;            /* bg-red-500 */
```

**Typography:**
```css
/* Activity Cards */
.activity-title {
  @apply text-lg font-semibold text-gray-900 line-clamp-2;
}

.activity-price {
  @apply text-xl font-bold text-blue-600;
}

/* Detail Page */
.detail-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.section-heading {
  @apply text-xl font-semibold text-gray-900 mb-4;
}
```

### Responsive Behavior

**Mobile (<768px)**:
```css
.activities-page-mobile {
  @apply flex flex-col space-y-4 px-4;
}

.activities-grid-mobile {
  @apply flex flex-col space-y-4;
}

.booking-widget-mobile {
  @apply fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg p-4;
}

.filter-drawer-mobile {
  @apply fixed inset-0 z-50 bg-white;
}
```

**Desktop (1024px+)**:
```css
.activities-page-desktop {
  @apply max-w-7xl mx-auto px-8 py-8;
}

.activities-grid-desktop {
  @apply grid grid-cols-3 gap-6;
}

.detail-layout-desktop {
  @apply grid grid-cols-3 gap-8;
  /* 2/3 content, 1/3 booking widget */
}
```

## Technical Architecture

### Component Structure

```
src/app/
├── activities/
│   ├── page.tsx                              # Activities listing ⬜
│   ├── loading.tsx                           # Loading skeleton ⬜
│   ├── components/
│   │   ├── ActivitiesList.tsx                # Main listing ⬜
│   │   ├── ActivityCard.tsx                  # Activity card ⬜
│   │   ├── FilterSidebar.tsx                 # Filters (desktop) ⬜
│   │   ├── FilterDrawer.tsx                  # Filters (mobile) ⬜
│   │   ├── SearchBar.tsx                     # Hero search ⬜
│   │   ├── SortDropdown.tsx                  # Sorting ⬜
│   │   ├── PriceRangeSlider.tsx              # Price filter ⬜
│   │   └── EmptyState.tsx                    # No results ⬜
│   │
│   └── [id]/
│       ├── page.tsx                          # Activity detail ⬜
│       ├── loading.tsx                       # Loading state ⬜
│       └── components/
│           ├── ActivityDetail.tsx            # Main detail ⬜
│           ├── PhotoGallery.tsx              # Photo carousel ⬜
│           ├── BookingWidget.tsx             # Sticky booking ⬜
│           ├── DatePicker.tsx                # Date selection ⬜
│           ├── TimeSlotSelector.tsx          # Time slots ⬜
│           ├── ParticipantCounter.tsx        # Counter widget ⬜
│           ├── PriceBreakdown.tsx            # Price display ⬜
│           ├── BookingModal.tsx              # Booking form ⬜
│           ├── ParticipantForm.tsx           # Participant info ⬜
│           ├── ReviewsList.tsx               # Reviews ⬜
│           ├── ReviewCard.tsx                # Single review ⬜
│           ├── RatingDistribution.tsx        # Rating chart ⬜
│           ├── MapDisplay.tsx                # Static map ⬜
│           └── SimilarActivities.tsx         # Recommendations ⬜
│
├── bookings/
│   └── [id]/
│       └── confirmation/
│           └── page.tsx                      # Confirmation page ⬜
│
└── api/
    └── activities/
        ├── route.ts                          # GET list ⬜
        └── [id]/
            ├── route.ts                      # GET detail ⬜
            ├── availability/
            │   └── route.ts                  # GET availability ⬜
            ├── check-availability/
            │   └── route.ts                  # POST check ⬜
            ├── book/
            │   └── route.ts                  # POST booking ⬜
            └── reviews/
                └── route.ts                  # GET reviews ⬜
```

### State Management Architecture

**Activity Booking State:**
```typescript
interface ActivityBookingState {
  // Selected activity
  activity: ActivityDetail | null;
  
  // Booking form
  booking: {
    date: Date | null;
    scheduleId: string | null;
    timeSlot: TimeSlot | null;
    participants: number;
    
    leadParticipant: LeadParticipantData | null;
    additionalParticipants: ParticipantData[];
    
    specialRequests: string;
  };
  
  // Availability
  availability: {
    calendar: DateAvailability[];
    selectedDate: DateAvailability | null;
    isLoading: boolean;
  };
  
  // Pricing
  pricing: {
    pricePerPerson: number;
    totalAmount: number;
    breakdown: PriceBreakdown;
  };
  
  // UI state
  ui: {
    isBookingModalOpen: boolean;
    isSubmitting: boolean;
    error: string | null;
  };
  
  // Actions
  selectDate: (date: Date) => void;
  selectTimeSlot: (slot: TimeSlot) => void;
  updateParticipants: (count: number) => void;
  updateLeadParticipant: (data: LeadParticipantData) => void;
  submitBooking: () => Promise<BookingResult>;
}

interface LeadParticipantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ParticipantData {
  firstName: string;
  lastName: string;
  age?: number;
}

interface PriceBreakdown {
  basePrice: number;
  taxesAndFees: number;
  discount?: number;
  total: number;
}
```

**Filter State:**
```typescript
interface ActivityFiltersState {
  // Applied filters
  filters: {
    cities: string[];
    categories: ActivityCategory[];
    priceRange: { min: number; max: number };
    rating: number | null;
    duration: DurationRange[];
    date: Date | null;
    participants: number | null;
  };
  
  // Search
  searchQuery: string;
  
  // Sorting
  sortBy: 'popularity' | 'price' | 'rating' | 'newest';
  sortOrder: 'asc' | 'desc';
  
  // UI state
  isFilterDrawerOpen: boolean;
  
  // Actions
  updateFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  applyFilters: () => void;
}
```

### Database Schema Updates

```prisma
// Already defined in Story 40, adding booking-specific fields

model ActivityBooking {
  // ... existing fields from Story 40
  
  // Availability lock
  holdExpiresAt    DateTime?
  isHeld           Boolean   @default(false)
  
  // Participant details
  participantDetails Json    // Array of participant info
  specialRequests    String?  @db.Text
  
  // Notifications
  confirmationEmailSent Boolean @default(false)
  reminderEmailSent     Boolean @default(false)
  
  @@index([scheduledDate, status])
  @@index([holdExpiresAt])
}

model ActivityAvailability {
  id              String   @id @default(cuid())
  activityId      String
  activity        Activity @relation(fields: [activityId], references: [id])
  
  scheduleId      String
  schedule        ActivitySchedule @relation(fields: [scheduleId], references: [id])
  
  date            DateTime
  
  bookedSpots     Int      @default(0)
  heldSpots       Int      @default(0)
  availableSpots  Int      // maxParticipants - bookedSpots - heldSpots
  
  updatedAt       DateTime @updatedAt
  
  @@unique([activityId, scheduleId, date])
  @@index([date, activityId])
}
```

### API Integration Schema

**Availability Locking with Redis:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

// Acquire lock on time slot
async function acquireAvailabilityLock(
  activityId: string,
  date: string,
  scheduleId: string,
  participants: number,
  ttl: number = 600  // 10 minutes
): Promise<string | null> {
  const lockKey = `activity:${activityId}:${date}:${scheduleId}`;
  const lockValue = `${Date.now()}-${Math.random()}`;
  
  // Check availability first
  const availability = await checkAvailability(activityId, date, scheduleId);
  if (availability.availableSpots < participants) {
    return null;
  }
  
  // Acquire lock
  const acquired = await redis.set(
    lockKey,
    lockValue,
    'EX',
    ttl,
    'NX'
  );
  
  if (acquired) {
    // Increment held spots
    await prisma.activityAvailability.update({
      where: {
        activityId_scheduleId_date: {
          activityId,
          scheduleId,
          date: new Date(date),
        },
      },
      data: {
        heldSpots: { increment: participants },
      },
    });
    
    return lockValue;
  }
  
  return null;
}

// Release lock
async function releaseAvailabilityLock(
  activityId: string,
  date: string,
  scheduleId: string,
  lockValue: string,
  participants: number
): Promise<void> {
  const lockKey = `activity:${activityId}:${date}:${scheduleId}`;
  
  // Verify lock ownership
  const currentValue = await redis.get(lockKey);
  if (currentValue === lockValue) {
    await redis.del(lockKey);
    
    // Decrement held spots
    await prisma.activityAvailability.update({
      where: {
        activityId_scheduleId_date: {
          activityId,
          scheduleId,
          date: new Date(date),
        },
      },
      data: {
        heldSpots: { decrement: participants },
      },
    });
  }
}
```

**Booking Creation Flow:**
```typescript
async function createActivityBooking(
  request: BookActivityRequest,
  userId: string
): Promise<BookActivityResponse> {
  // 1. Acquire availability lock
  const lockValue = await acquireAvailabilityLock(
    request.activityId,
    request.date,
    request.scheduleId,
    request.participants
  );
  
  if (!lockValue) {
    throw new Error('Activity no longer available');
  }
  
  try {
    // 2. Create booking in database
    const booking = await prisma.activityBooking.create({
      data: {
        bookingNumber: generateBookingNumber('ACT'),
        activityId: request.activityId,
        passengerId: userId,
        scheduledDate: new Date(request.date),
        scheduledTime: request.timeSlot.startTime,
        participants: request.participants,
        participantDetails: {
          lead: request.leadParticipant,
          additional: request.additionalParticipants,
        },
        specialRequests: request.specialRequests,
        pricePerPerson: calculatePricePerPerson(),
        totalAmount: calculateTotalAmount(),
        status: 'PENDING_PAYMENT',
        isHeld: true,
        holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    
    // 3. Process payment
    const payment = await processPayment({
      amount: booking.totalAmount,
      paymentMethodId: request.paymentMethodId,
      metadata: {
        bookingId: booking.id,
        type: 'ACTIVITY',
      },
    });
    
    // 4. Confirm booking if payment succeeded
    if (payment.status === 'SUCCEEDED') {
      await confirmActivityBooking(booking.id);
      
      // Send confirmation email
      await sendBookingConfirmationEmail(booking);
    }
    
    // 5. Release lock (convert hold to confirmed)
    await releaseAvailabilityLock(
      request.activityId,
      request.date,
      request.scheduleId,
      lockValue,
      request.participants
    );
    
    // Update booked spots
    await prisma.activityAvailability.update({
      where: {
        activityId_scheduleId_date: {
          activityId: request.activityId,
          scheduleId: request.scheduleId,
          date: new Date(request.date),
        },
      },
      data: {
        bookedSpots: { increment: request.participants },
        heldSpots: { decrement: request.participants },
      },
    });
    
    return {
      booking,
      payment,
      confirmationEmail: { sent: true },
    };
  } catch (error) {
    // Release lock on error
    await releaseAvailabilityLock(
      request.activityId,
      request.date,
      request.scheduleId,
      lockValue,
      request.participants
    );
    throw error;
  }
}
```

## Implementation Requirements

### Core Components

#### 1. ActivitiesList.tsx ⬜
**Purpose**: Main activities listing

**Features**:
- Grid/list view toggle
- Pagination
- Filter integration
- Empty state

#### 2. BookingWidget.tsx ⬜
**Purpose**: Sticky booking form

**Features**:
- Date picker
- Time slot selection
- Participant counter
- Price calculation
- Real-time availability

#### 3. BookingModal.tsx ⬜
**Purpose**: Booking checkout

**Features**:
- Participant forms
- Payment integration
- Validation
- Submit handling

#### 4. PhotoGallery.tsx ⬜
**Purpose**: Activity photos

**Features**:
- Carousel display
- Lightbox view
- Thumbnail navigation

### Custom Hooks

#### useActivityBooking() ⬜
```typescript
interface UseActivityBookingReturn {
  booking: BookingState;
  availability: AvailabilityState;
  pricing: PricingState;
  
  selectDate: (date: Date) => Promise<void>;
  selectTimeSlot: (slot: TimeSlot) => void;
  updateParticipants: (count: number) => void;
  submitBooking: () => Promise<BookingResult>;
}
```

#### useActivityFilters() ⬜
```typescript
interface UseActivityFiltersReturn {
  filters: FilterState;
  activities: ActivityCard[];
  isLoading: boolean;
  
  updateFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  applyFilters: () => Promise<void>;
}
```

## Acceptance Criteria

### Functional Requirements

#### 1. Activity Discovery ⬜
- [x] Browse all activities
- [x] Apply filters (location, category, price)
- [x] Search by keyword
- [x] Sort by popularity/price/rating
- [x] View activity details

#### 2. Booking Flow ⬜
- [x] Select date/time
- [x] Choose participants
- [x] View real-time availability
- [x] Enter participant details
- [x] Complete payment
- [x] Receive confirmation

#### 3. Availability Management ⬜
- [x] Show available dates
- [x] Display spots remaining
- [x] Prevent overbooking
- [x] Handle concurrent bookings

### Non-Functional Requirements

#### Performance ⬜
- [x] Listing loads <2 seconds
- [x] Availability check <200ms
- [x] Booking completion <30 seconds

#### Security ⬜
- [x] Validate user authentication
- [x] Prevent race conditions
- [x] Secure payment processing

## Modified Files

```
src/app/activities/
├── page.tsx                                  ⬜
├── [id]/page.tsx                             ⬜
└── components/                               ⬜ (24 files)

src/app/api/activities/
├── route.ts                                  ⬜
└── [id]/                                     ⬜ (5 endpoints)
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Activity Listing (Week 1) ⬜
- [ ] Activities page
- [ ] Activity cards
- [ ] Filter sidebar
- [ ] Sort/search functionality

### Phase 2: Activity Detail (Week 2) ⬜
- [ ] Detail page layout
- [ ] Photo gallery
- [ ] Reviews section
- [ ] Booking widget

### Phase 3: Booking Flow (Week 2-3) ⬜
- [ ] Date/time selection
- [ ] Availability system
- [ ] Booking modal
- [ ] Payment integration

### Phase 4: Testing (Week 3) ⬜
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E booking flow
- [ ] Performance optimization

## Dependencies

- **Story 40**: Activity data
- **Story 35**: Payment system
- **Redis**: Availability locking
- **Email Service**: Confirmations

## Risk Assessment

### Technical Risks

#### Risk 1: Concurrent Booking Race Conditions
- **Impact**: Critical (double bookings)
- **Mitigation**: Redis locks + optimistic locking
- **Contingency**: Manual resolution

#### Risk 2: Payment Integration Failures
- **Impact**: High (lost bookings)
- **Mitigation**: Retry logic + webhooks
- **Contingency**: Manual processing

## Testing Strategy

```typescript
describe('Activity Booking', () => {
  it('displays available activities', () => {
    // Test listing
  });
  
  it('prevents overbooking', async () => {
    // Test concurrent booking prevention
  });
  
  it('completes booking successfully', async () => {
    // Test full booking flow
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 3 weeks (1 developer)
