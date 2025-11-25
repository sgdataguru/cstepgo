# 41 - Passenger Browse and Book Activities - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, Redis (caching)  
**Infrastructure**: Vercel (hosting), Stripe (payments), Redis (availability locking)

## User Story

**As a** passenger,  
**I want** to browse and book activities and events (like tours and experiences),  
**so that** I can plan my trips and make the most of my time in a destination.

## Pre-conditions & Dependencies

### Required Dependencies
- **Story #40 (Activity Owner Manage Activities)**: ⚠️ **STATUS: NOT YET IMPLEMENTED**
  - Required Prisma models: ActivityOwner, Activity, ActivityAvailability, ActivityBooking, ActivitySchedule, ActivityPhoto
  - Required APIs: `/api/activity-owners/me`, `/api/activities` (CRUD), `/api/activities/[id]/availability`
  - **Note**: Story #40 models and APIs must be completed before passenger-facing features can be built
  - Schema design documented in `docs/implementation-plans/40-activity-owner-manage-activities.md`
  
  **Critical Dependencies from Story #40:**
  ```typescript
  // Must be implemented first:
  
  // 1. Activity Model with required fields
  model Activity {
    id              String   @id @default(cuid())
    ownerId         String
    title           String
    description     String   @db.Text
    category        String   // TOUR, EXCURSION, ATTRACTION, etc.
    status          String   // DRAFT, PENDING_APPROVAL, ACTIVE, INACTIVE
    pricePerPerson  Int
    maxParticipants Int
    durationMinutes Int
    // ... other fields
  }
  
  // 2. Activity CRUD APIs
  POST   /api/activities              # Create activity (owner only)
  GET    /api/activities/owner        # List owner's activities
  GET    /api/activities/:id          # Get activity detail
  PUT    /api/activities/:id          # Update activity (owner only)
  DELETE /api/activities/:id          # Delete activity (owner only)
  
  // 3. Availability System
  GET    /api/activities/:id/availability  # Get available time slots
  POST   /api/activities/:id/availability  # Create/update slots (owner only)
  
  // 4. Photo Upload
  POST   /api/activities/photos/upload    # Upload activity photos
  ```
  
  **Can Be Implemented in Parallel with Story #41:**
  - Activity owner dashboard UI (not needed for passenger browsing)
  - Activity creation form (not needed for passenger browsing)
  - Owner analytics (not needed for passenger browsing)

- **Story #33 (Passenger Book Private Trip)**: ✅ **IMPLEMENTED**
  - Private trip booking flow and UI patterns available for reference
  - Booking service layer and validation patterns established

- **Story #34 (Passenger Book Shared Ride Seat)**: ✅ **IMPLEMENTED**
  - Shared ride seat selection and availability checking patterns available
  - Concurrent booking prevention mechanisms in place

- **Story #35 (Passenger Pay for Booking Online)**: ✅ **IMPLEMENTED**
  - Payment integration infrastructure ready (Stripe mock API for POC)
  - Payment flow at `/api/payments/mock-success` can be extended for activities
  - Payment method selection UI components available

- **Story #36 (Passenger Manage Upcoming Bookings)**: ✅ **IMPLEMENTED**
  - Dashboard at `/app/my-trips/page.tsx` exists for displaying bookings
  - Booking management UI patterns established
  - **Integration Required**: Need to extend to show activity bookings alongside trip bookings

### Additional Pre-conditions
- User must be registered and logged in as PASSENGER
- Activity availability system configured (Redis or PostgreSQL-based)
- Email notification service set up for booking confirmations
- Multi-tenant isolation configured in Prisma schema

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

- **BR-5**: Seamlessly integrate activity bookings with existing trip bookings dashboard
  - Success Metric: >80% of users can navigate between trip and activity bookings
  - Performance: Unified bookings view loads <2 seconds
  - UX: Consistent booking management experience across product types

## Integration with Story #36: Passenger Manage Upcoming Bookings

### Dashboard Integration Strategy

Story #36 implemented passenger booking management at `/app/my-trips/page.tsx`. Activity bookings must integrate seamlessly into this existing dashboard while maintaining a clear distinction between trips and activities.

#### **Option A: Unified List with Type Badges (Recommended)**

**Layout:**
```
My Bookings
├── Filters: [All] [Trips] [Activities] [Upcoming] [Past]
└── Unified Booking List
    ├── [Trip Card] 🚗 Private Trip to Almaty
    ├── [Activity Card] 🎯 Charyn Canyon Tour
    ├── [Trip Card] 👥 Shared Ride to Shymkent
    └── [Activity Card] 🎯 Silk Road Museum Visit
```

**Pros:**
- Single, simple interface
- Easy chronological sorting
- Natural booking history flow
- Less navigation complexity

**Cons:**
- May feel cluttered with many bookings
- Different card designs for trips vs activities

#### **Option B: Separate Tabs**

**Layout:**
```
My Bookings
├── Tab: Trips (12) | Activities (3)
│
└── Tab Content
    ├── [Trips Tab]
    │   └── Trip booking cards
    └── [Activities Tab]
        └── Activity booking cards
```

**Pros:**
- Clear separation of product types
- Focused experience per tab
- Easier to add product-specific filters

**Cons:**
- Requires tab switching
- Harder to see chronological history
- More complex state management

#### **Option C: Section-Based Layout**

**Layout:**
```
My Bookings
├── Upcoming Trips (2)
│   └── Trip cards
├── Upcoming Activities (1)
│   └── Activity cards
├── Past Trips (10)
│   └── Trip cards
└── Past Activities (2)
    └── Activity cards
```

**Pros:**
- Grouped by type and time
- Scannable sections
- Flexible expansion

**Cons:**
- Longer page scroll
- Harder to implement mixed sorting

#### **Recommended Approach: Option A (Unified List with Type Badges)**

**Rationale:**
1. **User Mental Model**: Users think in terms of "my bookings" not "trips vs activities"
2. **Existing Pattern**: Story #36 already uses a unified list; extending it is least disruptive
3. **Simplicity**: Single list is easier to implement and maintain
4. **Flexibility**: Filters allow users to focus on specific types when needed

**Implementation Details:**

**Unified Booking Type:**
```typescript
type BookingType = 'TRIP' | 'ACTIVITY';

interface UnifiedBooking {
  id: string;
  type: BookingType;
  bookingNumber: string;
  title: string;
  date: Date;
  time?: string; // Activities have specific times
  status: BookingStatus;
  amount: number;
  thumbnail?: string;
  
  // Trip-specific (null for activities)
  tripType?: 'PRIVATE' | 'SHARED';
  route?: { from: string; to: string };
  seatsBooked?: number;
  
  // Activity-specific (null for trips)
  participants?: number;
  location?: string;
  duration?: string;
}
```

**Service Layer:**
```typescript
// src/lib/services/unifiedBookingService.ts
export async function getPassengerBookings(
  userId: string,
  filters: {
    type?: BookingType;
    status?: BookingStatus;
    dateRange?: { start: Date; end: Date };
  } = {}
): Promise<UnifiedBooking[]> {
  const [tripBookings, activityBookings] = await Promise.all([
    filters.type === 'ACTIVITY' ? [] : fetchTripBookings(userId, filters),
    filters.type === 'TRIP' ? [] : fetchActivityBookings(userId, filters),
  ]);
  
  return mergeAndSortBookings(tripBookings, activityBookings);
}
```

**API Endpoint:**
```typescript
// GET /api/passengers/bookings?type=all|trip|activity&status=upcoming|past
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get('type') as BookingType | 'all' | null;
  const status = searchParams.get('status') as 'upcoming' | 'past' | null;
  
  const bookings = await getPassengerBookings(userId, {
    type: type === 'all' ? undefined : type,
    status: status === 'upcoming' ? 'CONFIRMED' : undefined,
  });
  
  return Response.json({ bookings });
}
```

**UI Component Modifications:**
```typescript
// src/app/my-trips/page.tsx (extend existing)
export default function MyBookingsPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'trip' | 'activity'>('all');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'past'>('upcoming');
  
  return (
    <div>
      {/* Filter Bar */}
      <div className="flex gap-2 mb-6">
        <FilterButton active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
          All
        </FilterButton>
        <FilterButton active={typeFilter === 'trip'} onClick={() => setTypeFilter('trip')}>
          🚗 Trips
        </FilterButton>
        <FilterButton active={typeFilter === 'activity'} onClick={() => setTypeFilter('activity')}>
          🎯 Activities
        </FilterButton>
      </div>
      
      {/* Unified Booking List */}
      <div className="space-y-4">
        {bookings.map(booking => (
          booking.type === 'TRIP' 
            ? <TripBookingCard key={booking.id} booking={booking} />
            : <ActivityBookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}
```

**Visual Distinction:**
- **Trip Cards**: Blue accent, 🚗 icon, route display
- **Activity Cards**: Purple accent, 🎯 icon, location + duration display
- **Consistent Actions**: Both support "View Details", "Cancel", "Contact Provider"

## Technical Specifications

### Integration Points
- **Payment**: Stripe integration from Story 35
- **Email**: Booking confirmation emails
- **Maps**: Google Static Maps API for location display
- **Availability**: Redis for real-time slot locking
- **Analytics**: Track booking funnel metrics
- **Reviews**: Display ratings and reviews

### Security Requirements & Multi-Tenant Considerations

#### Authentication & Authorization
- **Passenger Authentication**: All booking endpoints require valid session token
- **Role-Based Access Control (RBAC)**: 
  - Only users with PASSENGER or ADMIN role can book activities
  - ACTIVITY_OWNER role cannot book their own activities (conflict of interest)
- **Session Validation**: Verify session hasn't expired before allowing booking

#### Multi-Tenant Data Isolation

**Activity Visibility Rules:**
1. **Public Endpoints** (`/api/activities`, `/api/activities/:id`):
   - ✅ Show only activities with `status = 'ACTIVE'` or `status = 'PUBLISHED'`
   - ❌ Hide activities with `status = 'DRAFT'`, `'PENDING_APPROVAL'`, `'INACTIVE'`, `'REJECTED'`
   - ✅ Include activities from all tenants (cross-tenant discovery)
   - ❌ Never expose `ownerId`, owner email, or owner phone in public responses

2. **Tenant Context**:
   - Activities should include `tenantId` field to support multi-tenant deployments
   - Bookings inherit `tenantId` from the activity
   - Revenue and analytics aggregated per tenant

3. **Data Minimization**:
   - **Passenger → Owner**: Owners see booking participant names, count, and contact info only
   - **Owner → Passenger**: Passengers see owner business name and public profile only
   - **PII Protection**: Never expose full passenger lists to other passengers

**Schema Additions for Multi-Tenancy:**
```prisma
model Activity {
  // ... existing fields
  tenantId      String?  // Optional tenant isolation
  status        String   // DRAFT, PENDING_APPROVAL, ACTIVE, INACTIVE, REJECTED
  isPublished   Boolean  @default(false)
  publishedAt   DateTime?
  approvedBy    String?  // Admin user ID who approved
  
  @@index([tenantId, status, isPublished])
}

model ActivityBooking {
  // ... existing fields
  tenantId      String?  // Inherited from activity
  
  @@index([tenantId, passengerId])
}
```

**Enforcement in API:**
```typescript
// GET /api/activities - Public listing
export async function GET(request: NextRequest) {
  const activities = await prisma.activity.findMany({
    where: {
      status: 'ACTIVE',
      isPublished: true,
      // Optional: filter by tenant if multi-tenant deployment
      // tenantId: getTenantFromRequest(request)
    },
    select: {
      // Public fields only
      id: true,
      title: true,
      category: true,
      thumbnailUrl: true,
      // Exclude: ownerId, owner email, draft fields, etc.
    }
  });
  
  return Response.json({ activities });
}

// GET /api/activities/:id - Public detail
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const activity = await prisma.activity.findFirst({
    where: {
      id: params.id,
      status: 'ACTIVE',
      isPublished: true,
    },
    include: {
      owner: {
        select: {
          // Only public owner info
          name: true,
          avatar: true,
          // Exclude: email, phone, address, etc.
        }
      }
    }
  });
  
  if (!activity) {
    return Response.json({ error: 'Activity not found' }, { status: 404 });
  }
  
  return Response.json({ activity });
}

// POST /api/activities/:id/book - Booking creation
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const user = await getUserWithRole(userId);
  
  // Verify user can book
  if (!['PASSENGER', 'ADMIN'].includes(user.role)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const activity = await prisma.activity.findFirst({
    where: {
      id: params.id,
      status: 'ACTIVE',
      isPublished: true,
    }
  });
  
  if (!activity) {
    return Response.json({ error: 'Activity not available' }, { status: 404 });
  }
  
  // Prevent owners from booking their own activities
  if (activity.ownerId === userId) {
    return Response.json({ error: 'Cannot book your own activity' }, { status: 403 });
  }
  
  // Create booking with tenant context
  const booking = await prisma.activityBooking.create({
    data: {
      // ... booking data
      tenantId: activity.tenantId,
    }
  });
  
  return Response.json({ booking });
}
```

#### Additional Security Measures
- **Input Validation**: Sanitize all user inputs (participant names, special requests) using Zod schemas
- **Rate Limiting**: 
  - Browse endpoints: 100 requests/min per IP
  - Booking endpoints: 10 requests/min per authenticated user
  - Availability checks: 30 requests/min per user
- **Idempotency**: Booking creation accepts idempotency key to prevent duplicate bookings
- **Optimistic Locking**: Use Redis locks or database transactions for availability checks
- **XSS Protection**: Sanitize activity descriptions (already HTML from owner, but re-sanitize on display)
- **SQL Injection**: Use Prisma's parameterized queries (automatic protection)
- **CSRF Protection**: Next.js API routes include CSRF tokens

#### Privacy Compliance
- **GDPR/Data Protection**: 
  - Passenger can request deletion of booking history
  - Owner cannot access passenger data after booking is completed/cancelled (except for tax records)
  - Anonymize passenger data after 7 years
- **Consent**: Passengers agree to share contact info with activity owner when booking
- **Data Retention**: Activity bookings retained for accounting purposes per legal requirements

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

### Database Schema Strategy: Booking Model vs ActivityBooking Model

#### Decision Analysis

**Option 1: Reuse Existing Booking Model**
**Pros:**
- ✅ Single unified booking table for all booking types (trips + activities)
- ✅ Simplified queries for passenger's "My Bookings" dashboard
- ✅ Consistent booking number generation across platform
- ✅ Unified payment tracking and reconciliation
- ✅ Single source of truth for booking status and cancellations
- ✅ Easier cross-platform analytics (e.g., "total bookings across trips and activities")
- ✅ Reduced code duplication for common booking operations

**Cons:**
- ❌ Requires nullable fields for trip-specific vs activity-specific data
- ❌ More complex validation logic (must check booking type)
- ❌ Risk of data model bloat as new booking types are added
- ❌ Harder to enforce type-specific constraints at database level
- ❌ May require discriminator pattern or type field to distinguish booking types

**Option 2: Separate ActivityBooking Model**
**Pros:**
- ✅ Clean separation of concerns (trips vs activities)
- ✅ Type-specific fields with no nullable compromises
- ✅ Easier to add activity-specific features (e.g., participant details, time slots)
- ✅ Independent schema evolution for each booking type
- ✅ Simpler validation (no type checking needed)
- ✅ Better matches domain model (activities ≠ trips)
- ✅ Clearer relationships in Prisma schema

**Cons:**
- ❌ Duplicate logic for common booking operations (status, payment, cancellation)
- ❌ More complex queries for unified "My Bookings" view
- ❌ Separate booking number sequences (may confuse users)
- ❌ Harder to maintain consistency across booking types
- ❌ More API endpoints and service methods

#### **Recommended Approach: Separate ActivityBooking Model**

**Justification:**
1. **Domain Clarity**: Activities and trips are fundamentally different products with distinct characteristics (time slots vs routes, participant lists vs seat selection, etc.)
2. **Future Scalability**: As the platform grows, activities may need features like recurring bookings, group discounts, equipment rental add-ons, etc., which don't apply to trips
3. **Type Safety**: Separate models provide better type safety and validation without complex conditional logic
4. **Existing Pattern**: Story #40 already defines ActivityBooking in the schema, maintaining consistency
5. **Integration Strategy**: Use a unified booking service layer that abstracts over both types for the passenger dashboard

**Integration Pattern for "My Bookings" Dashboard:**
```typescript
// Unified booking service
interface UnifiedBooking {
  id: string;
  bookingNumber: string;
  type: 'TRIP' | 'ACTIVITY';
  title: string;
  date: Date;
  status: BookingStatus;
  amount: number;
  // ... common fields
}

async function getPassengerBookings(userId: string): Promise<UnifiedBooking[]> {
  const [tripBookings, activityBookings] = await Promise.all([
    prisma.booking.findMany({ where: { userId } }),
    prisma.activityBooking.findMany({ where: { passengerId: userId } })
  ]);
  
  return [
    ...tripBookings.map(b => ({ ...b, type: 'TRIP' as const })),
    ...activityBookings.map(b => ({ ...b, type: 'ACTIVITY' as const }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
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

## Document Summary & Key Decisions

### Implementation Approach Summary

1. **Database Strategy**: Use separate `ActivityBooking` model (not reuse `Booking`)
   - Rationale: Better domain separation, type safety, and future scalability
   - Trade-off: More complex unified booking queries, but cleaner schema

2. **Dashboard Integration**: Unified list with type badges (Option A)
   - Extend `/app/my-trips/page.tsx` to show both trips and activities
   - Implement filter buttons: All | 🚗 Trips | 🎯 Activities
   - Use visual badges and icons to distinguish booking types

3. **Multi-Tenant Security**: Strict visibility rules for activities
   - Only `status='ACTIVE'` and `isPublished=true` activities visible to passengers
   - No exposure of draft/pending/rejected activities
   - Minimal owner PII in public responses (business name only)

4. **Story #40 Dependencies**: Critical blockers identified
   - Must implement Activity model, ActivitySchedule, ActivityPhoto models first
   - Must implement activity CRUD APIs and availability endpoints
   - Can implement in parallel: Owner dashboard UI (not needed for passenger browsing)

5. **Payment Integration**: Extend existing Story #35 infrastructure
   - Use same mock payment API pattern for POC
   - Same Stripe integration points for production
   - Consistent payment flow UX

### Development Phases

**Phase 1** (Week 1): Complete Story #40 Dependencies
- Implement Activity models and migrations
- Build activity CRUD APIs
- Create availability system

**Phase 2** (Week 2): Activity Discovery & Browsing
- Build `/activities` listing page
- Implement filtering and search
- Create activity detail page

**Phase 3** (Week 2-3): Booking Flow
- Build booking widget and modal
- Implement availability checking
- Integrate payment system

**Phase 4** (Week 3): Dashboard Integration
- Extend "My Bookings" dashboard
- Add unified booking service
- Implement activity booking cards

### Critical Success Factors

✅ **Must Have:**
- Zero double-booking incidents (availability locking)
- >95% payment success rate
- Seamless integration with existing booking dashboard
- Strict multi-tenant data isolation

⚠️ **Important:**
- >15% booking conversion rate
- <2 second page load times
- Mobile-responsive design
- Email confirmations

📊 **Nice to Have:**
- Activity recommendations
- Review system integration
- Social sharing features

---

**Document Version:** 2.0  
**Last Updated:** November 25, 2025  
**Status:** Enhanced Implementation Plan Ready for Development  
**Estimated Effort:** 3 weeks (1 developer, assumes Story #40 complete)  
**Dependencies:** Story #40 must be implemented first (adds 1-2 weeks)  
**Total Timeline:** 4-5 weeks including dependencies
