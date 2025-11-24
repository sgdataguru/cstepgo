# 36 - Passenger Manage Upcoming Bookings - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, Stripe (refunds)  
**Infrastructure**: Vercel (hosting), PostgreSQL (Supabase/Railway), Email (Postmark/SendGrid)

## User Story

**As a** passenger,  
**I want** to view and manage my upcoming bookings (including cancellation),  
**so that** I stay in control of my travel plans and can adjust them when needed.

## Pre-conditions

- User must be authenticated (registered as PASSENGER role)
- User must have at least one booking in the system
- Story 33/34 (Booking system) completed
- Story 35 (Payment system) completed with refund capability
- Email notification service configured

## Business Requirements

- **BR-1**: Enable passengers to access and manage their bookings easily
  - Success Metric: >85% of users can find their bookings without support
  - Performance: My Trips page loads <1.5 seconds

- **BR-2**: Provide transparent cancellation policies and refund information
  - Success Metric: <10% cancellation-related support tickets
  - Performance: Cancellation policy displayed within 300ms

- **BR-3**: Automate refund processing to reduce operational overhead
  - Success Metric: 95% of refunds processed automatically within 5-7 business days
  - Performance: Refund initiation <2 seconds

- **BR-4**: Maintain accurate seat availability for shared rides after cancellations
  - Success Metric: 100% accuracy in seat availability updates
  - Performance: Seat release within 1 second of cancellation

## Technical Specifications

### Integration Points
- **Authentication**: Clerk/Custom Auth (user ownership validation)
- **Database**: PostgreSQL with transaction support for seat release
- **Payments**: Stripe Refunds API for automated refund processing
- **Notifications**: Email (booking cancellation confirmation, refund status)
- **Real-time Updates**: WebSocket/polling for booking status changes

### Security Requirements
- User can only view/manage their own bookings (RBAC)
- Cancellation requires confirmation (prevent accidental cancellations)
- Rate limiting: 10 cancellation attempts per hour per user
- Audit logging for all cancellation events
- Idempotency keys for refund operations

### API Endpoints

#### GET /api/bookings/my-trips
Retrieves user's bookings with filtering and pagination.

**Query Parameters:**
```typescript
interface MyTripsQuery {
  status?: 'upcoming' | 'past' | 'cancelled' | 'all';
  tripType?: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'created' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface MyTripsResponse {
  bookings: BookingSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    upcoming: number;
    past: number;
    cancelled: number;
  };
}

interface BookingSummary {
  id: string;
  tripId: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  tripType: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  
  // Trip Details
  trip: {
    title: string;
    originName: string;
    destName: string;
    departureTime: Date;
    returnTime?: Date;
  };
  
  // Booking Details
  seatsBooked: number;
  totalAmount: number;
  currency: 'KZT';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  
  // Cancellation Info
  isCancellable: boolean;
  cancellationDeadline?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### GET /api/bookings/:bookingId
Retrieves detailed booking information.

**Response:**
```typescript
interface BookingDetailResponse {
  id: string;
  status: BookingStatus;
  
  // Trip Information
  trip: {
    id: string;
    title: string;
    description: string;
    originName: string;
    destName: string;
    departureTime: Date;
    returnTime?: Date;
    estimatedDuration: string;
    distance: number;
  };
  
  // Driver Information (when assigned)
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicleInfo: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
    rating: number;
    totalTrips: number;
  };
  
  // Booking Details
  seatsBooked: number;
  passengers: PassengerInfo[];
  specialRequests?: string;
  
  // Payment Information
  payment: {
    totalAmount: number;
    baseAmount: number;
    platformFee: number;
    taxes: number;
    currency: 'KZT';
    paymentStatus: string;
    paymentMethod: string;
    paidAt?: Date;
  };
  
  // Cancellation Information
  cancellationPolicy: CancellationPolicy;
  isCancellable: boolean;
  cancellationDeadline?: Date;
  
  // If cancelled
  cancelledAt?: Date;
  cancellationReason?: string;
  refund?: {
    amount: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    processedAt?: Date;
    estimatedArrival?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### GET /api/bookings/:bookingId/cancellation-policy
Retrieves cancellation policy and potential refund amount.

**Response:**
```typescript
interface CancellationPolicyResponse {
  isCancellable: boolean;
  cancellationDeadline?: Date;
  hoursUntilTrip: number;
  
  policy: {
    rules: CancellationRule[];
    termsUrl: string;
  };
  
  refundCalculation: {
    totalPaid: number;
    refundAmount: number;
    refundPercentage: number;
    platformFeeRefundable: boolean;
    processingFee: number;
    netRefund: number;
    currency: 'KZT';
  };
  
  warnings: string[];
  message: string;
}

interface CancellationRule {
  timeframe: string;  // "More than 24 hours before departure"
  refundPercentage: number;
  description: string;
}
```

#### POST /api/bookings/:bookingId/cancel
Cancels a booking and initiates refund process.

**Request:**
```typescript
interface CancelBookingRequest {
  reason?: string;  // Optional cancellation reason
  confirmPolicy: boolean;  // Must be true
}
```

**Response:**
```typescript
interface CancelBookingResponse {
  success: boolean;
  bookingId: string;
  status: 'CANCELLED';
  
  cancellation: {
    cancelledAt: Date;
    reason?: string;
  };
  
  refund: {
    amount: number;
    status: 'PENDING' | 'PROCESSING';
    estimatedArrival: Date;
    refundMethod: string;  // "Original payment method"
    refundId: string;  // Stripe refund ID
  };
  
  seatReleased: boolean;  // For shared rides
  
  message: string;
  confirmationEmail: boolean;
}
```

#### PUT /api/bookings/:bookingId/modify
Modifies booking details (future enhancement).

**Request:**
```typescript
interface ModifyBookingRequest {
  newDepartureTime?: Date;
  seatsBooked?: number;
  passengers?: PassengerInfo[];
  specialRequests?: string;
}
```

**Response:**
```typescript
interface ModifyBookingResponse {
  success: boolean;
  booking: BookingDetailResponse;
  additionalCharge?: number;
  refundAmount?: number;
}
```

## Design Specifications

### Visual Layout & Components

**My Trips Page Layout:**
```
[Page Header]
├── "My Trips" Title
├── Booking Summary Cards (Upcoming: X, Past: Y, Cancelled: Z)
└── Create New Booking CTA

[Filter & Sort Bar]
├── Status Filter Tabs
│   ├── All
│   ├── Upcoming (default)
│   ├── Past
│   └── Cancelled
├── Trip Type Filter Dropdown
├── Sort Dropdown (Date/Created/Status)
└── Search Input (booking ID or destination)

[Bookings List/Grid]
├── [Booking Card] × N
│   ├── Trip Type Badge (Private/Shared/Activity)
│   ├── Status Badge (Confirmed/Pending/Cancelled)
│   ├── Trip Image/Icon
│   ├── Origin → Destination
│   ├── Date & Time
│   ├── Price
│   ├── Seats (if shared)
│   ├── Quick Actions
│   │   ├── "View Details" Button
│   │   └── "Cancel" Button (if eligible)
│   └── Cancellation Warning (if near deadline)
└── [Pagination Controls]

[Empty State]
└── "No bookings found" with "Book a Trip" CTA
```

**Booking Detail Page Layout:**
```
[Breadcrumb]
My Trips > Booking #XXXXX

[Status Banner]
├── Status Icon + Label
├── Payment Status
└── Action Buttons (Cancel/Modify/Contact Support)

[Main Content - Two Column]
├── [Left Column - Trip & Booking Details]
│   ├── Trip Information Card
│   │   ├── Title & Description
│   │   ├── Route Map (static image)
│   │   ├── Date & Time
│   │   ├── Duration & Distance
│   │   └── Itinerary (if multi-stop)
│   │
│   ├── Driver Information Card (when assigned)
│   │   ├── Driver Photo
│   │   ├── Name & Rating
│   │   ├── Contact Button
│   │   ├── Vehicle Details
│   │   └── Total Trips Badge
│   │
│   ├── Passenger Details Card
│   │   ├── Number of Seats
│   │   ├── Passenger Names
│   │   └── Special Requests
│   │
│   └── Cancellation Policy Card
│       ├── Policy Rules Timeline
│       ├── Current Refund Amount
│       ├── Deadline Countdown (if applicable)
│       └── "View Full Policy" Link
│
└── [Right Column - Payment & Actions (Sticky)]
    ├── Payment Summary Card
    │   ├── Price Breakdown
    │   │   ├── Base Fare
    │   │   ├── Platform Fee
    │   │   └── Taxes
    │   ├── Total Paid
    │   ├── Payment Method
    │   └── Receipt Download Button
    │
    ├── Booking Actions Card
    │   ├── "Cancel Booking" Button (destructive)
    │   ├── "Modify Booking" Button (secondary)
    │   ├── "Contact Support" Button (tertiary)
    │   └── "Share Trip Details" Button
    │
    └── Status Timeline
        ├── Booking Created ✓
        ├── Payment Confirmed ✓
        ├── Driver Assigned (pending/✓)
        └── Trip Completed (pending)
```

**Cancellation Modal:**
```
[Modal Overlay]
└── [Confirmation Dialog]
    ├── ⚠️ Warning Icon
    ├── "Cancel Booking?" Heading
    ├── Trip Summary
    │   ├── Destination
    │   └── Date & Time
    ├── Refund Information Card
    │   ├── Original Amount: ₸XX,XXX
    │   ├── Processing Fee: ₸XXX
    │   ├── Refund Amount: ₸XX,XXX (highlighted)
    │   └── Estimated Arrival: X-X business days
    ├── Cancellation Policy Summary
    │   └── Key policy points (bullets)
    ├── Optional: Cancellation Reason
    │   └── Textarea input
    ├── Confirmation Checkbox
    │   └── "I understand the cancellation policy"
    ├── Action Buttons
    │   ├── "Cancel Booking" (destructive, disabled until checkbox)
    │   └── "Keep Booking" (secondary)
    └── "Need help? Contact support" Link
```

**Cancellation Success Screen:**
```
[Success Overlay]
├── Checkmark Animation (with fade)
├── "Booking Cancelled" Heading
├── Refund Details Card
│   ├── Refund Amount: ₸XX,XXX
│   ├── Refund Method: Original payment method
│   ├── Expected Arrival: X-X business days
│   └── Refund ID: ref_XXXXXXXX
├── "Confirmation sent to your email"
├── Next Steps
│   ├── "You'll receive a refund confirmation email"
│   └── "Seats have been released for other passengers"
├── Action Buttons
│   ├── "View My Trips" (primary)
│   ├── "Book Another Trip" (secondary)
│   └── "Contact Support" (tertiary)
└── Booking Reference: #XXXXX
```

### Design System Compliance

**Color Palette:**
```css
/* Booking Status Colors */
--status-pending: #f59e0b;      /* bg-amber-500 */
--status-confirmed: #10b981;    /* bg-emerald-500 */
--status-completed: #6366f1;    /* bg-indigo-500 */
--status-cancelled: #ef4444;    /* bg-red-500 */

/* Payment Status Colors */
--payment-pending: #f59e0b;     /* bg-amber-500 */
--payment-paid: #10b981;        /* bg-emerald-500 */
--payment-refunded: #8b5cf6;    /* bg-violet-500 */

/* Cancellation Colors */
--cancel-warning: #f59e0b;      /* bg-amber-500 */
--cancel-danger: #ef4444;       /* bg-red-500 */
--cancel-button: #dc2626;       /* bg-red-600 */

/* Refund Colors */
--refund-processing: #3b82f6;   /* bg-blue-500 */
--refund-completed: #10b981;    /* bg-emerald-500 */
```

**Typography Scale:**
```css
/* My Trips Page */
.page-title {
  @apply text-3xl font-bold text-gray-900;
}

.section-title {
  @apply text-xl font-semibold text-gray-800;
}

.booking-destination {
  @apply text-lg font-medium text-gray-900;
}

.booking-details {
  @apply text-sm text-gray-600;
}

/* Cancellation Modal */
.modal-title {
  @apply text-2xl font-bold text-gray-900;
}

.refund-amount {
  @apply text-3xl font-bold text-emerald-600;
}

.policy-text {
  @apply text-sm text-gray-700 leading-relaxed;
}
```

### Responsive Behavior

**Mobile Layout (<768px)**:
```css
.my-trips-mobile {
  @apply flex flex-col space-y-4 px-4 pb-20;
}

.booking-card-mobile {
  @apply w-full rounded-lg border-2 border-gray-200;
  @apply p-4 space-y-3;
  @apply shadow-sm hover:shadow-md transition-shadow;
}

.filter-bar-mobile {
  @apply flex flex-col space-y-2 px-4 py-3;
  @apply bg-white sticky top-14 z-30;
  @apply border-b border-gray-200;
}

.booking-detail-mobile {
  @apply flex flex-col space-y-4 px-4;
}

.cancel-button-mobile {
  @apply fixed bottom-0 left-0 right-0;
  @apply bg-white border-t-2 border-red-200;
  @apply px-4 py-6 z-50 shadow-2xl;
}

.cancellation-modal-mobile {
  @apply fixed inset-0 z-50;
  @apply bg-white overflow-y-auto;
  /* Full-screen on mobile */
}
```

**Tablet Layout (768px - 1023px)**:
```css
.my-trips-tablet {
  @apply grid grid-cols-2 gap-4 px-6;
}

.booking-card-tablet {
  @apply col-span-1;
}

.booking-detail-tablet {
  @apply grid grid-cols-2 gap-6 px-6;
}
```

**Desktop Layout (1024px+)**:
```css
.my-trips-desktop {
  @apply grid grid-cols-3 gap-6 px-8 max-w-7xl mx-auto;
}

.booking-detail-desktop {
  @apply grid grid-cols-12 gap-8 px-8 max-w-7xl mx-auto;
}

.trip-details-column {
  @apply col-span-8;
}

.payment-actions-column {
  @apply col-span-4 sticky top-24 h-fit;
}

.cancellation-modal-desktop {
  @apply max-w-2xl mx-auto my-20;
  @apply bg-white rounded-xl shadow-2xl;
  @apply p-8;
}
```

### Interaction Patterns

**Booking Card Hover:**
```typescript
interface BookingCardStates {
  default: 'border-gray-200 shadow-sm';
  hover: 'border-blue-300 shadow-md transform -translate-y-1';
  cancelled: 'border-red-200 bg-red-50 opacity-75';
  pending: 'border-amber-200 bg-amber-50';
}
```

**Cancel Button States:**
```typescript
interface CancelButtonStates {
  enabled: {
    bg: 'bg-red-600 hover:bg-red-700',
    text: 'Cancel Booking',
    cursor: 'cursor-pointer',
  };
  disabled: {
    bg: 'bg-gray-300',
    text: 'Cannot Cancel',
    cursor: 'cursor-not-allowed',
    tooltip: 'Cancellation deadline passed',
  };
  processing: {
    bg: 'bg-red-600',
    text: 'Cancelling...',
    cursor: 'cursor-wait',
    spinner: true,
  };
}
```

**Status Badge Variants:**
```typescript
const statusBadgeClasses = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};
```

## Technical Architecture

### Component Structure

```
src/app/
├── bookings/
│   ├── my-trips/
│   │   ├── page.tsx                          # My Trips listing page ⬜
│   │   ├── loading.tsx                       # Loading skeleton ⬜
│   │   └── components/
│   │       ├── BookingsList.tsx              # Main bookings list ⬜
│   │       ├── BookingCard.tsx               # Individual booking card ⬜
│   │       ├── BookingSummaryCards.tsx       # Summary stats cards ⬜
│   │       ├── BookingsFilters.tsx           # Filter & sort controls ⬜
│   │       ├── BookingsEmptyState.tsx        # No bookings message ⬜
│   │       └── StatusBadge.tsx               # Status indicator ⬜
│   ├── [bookingId]/
│   │   ├── page.tsx                          # Booking detail page ⬜
│   │   ├── loading.tsx                       # Detail loading state ⬜
│   │   └── components/
│   │       ├── BookingDetailView.tsx         # Main detail layout ⬜
│   │       ├── TripInfoCard.tsx              # Trip information ⬜
│   │       ├── DriverInfoCard.tsx            # Driver details ⬜
│   │       ├── PassengerDetailsCard.tsx      # Passenger info ⬜
│   │       ├── PaymentSummaryCard.tsx        # Payment details ⬜
│   │       ├── CancellationPolicyCard.tsx    # Policy display ⬜
│   │       ├── StatusTimeline.tsx            # Booking progress ⬜
│   │       ├── CancelBookingButton.tsx       # Cancel action ⬜
│   │       └── BookingActions.tsx            # Action buttons ⬜
│   └── cancel/
│       └── [bookingId]/
│           └── components/
│               ├── CancellationModal.tsx     # Cancel confirmation ⬜
│               ├── RefundCalculator.tsx      # Refund amount display ⬜
│               ├── PolicySummary.tsx         # Policy highlights ⬜
│               ├── CancellationSuccess.tsx   # Success screen ⬜
│               └── CancellationReason.tsx    # Reason input ⬜
└── api/
    └── bookings/
        ├── my-trips/
        │   └── route.ts                      # GET user bookings ⬜
        ├── [bookingId]/
        │   ├── route.ts                      # GET booking details ⬜
        │   ├── cancel/
        │   │   └── route.ts                  # POST cancel booking ⬜
        │   ├── cancellation-policy/
        │   │   └── route.ts                  # GET policy & refund calc ⬜
        │   └── modify/
        │       └── route.ts                  # PUT modify booking ⬜
        └── refund-status/
            └── route.ts                      # GET refund status ⬜
```

### State Management Architecture

**Global State (Zustand):**
```typescript
interface BookingsStore {
  // User Bookings State
  myBookings: {
    items: BookingSummary[];
    isLoading: boolean;
    error: string | null;
    filters: BookingFilters;
    pagination: PaginationState;
  };
  
  // Selected Booking
  selectedBooking: BookingDetailResponse | null;
  isLoadingDetails: boolean;
  
  // Cancellation State
  cancellationInProgress: {
    bookingId: string | null;
    isProcessing: boolean;
    error: string | null;
  };
  
  // Actions
  loadMyBookings: (filters?: BookingFilters) => Promise<void>;
  loadBookingDetails: (bookingId: string) => Promise<BookingDetailResponse>;
  updateFilters: (filters: Partial<BookingFilters>) => void;
  refreshBooking: (bookingId: string) => Promise<void>;
  
  // Cancellation Actions
  loadCancellationPolicy: (bookingId: string) => Promise<CancellationPolicyResponse>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<CancelBookingResponse>;
  clearCancellationState: () => void;
}

interface BookingFilters {
  status: 'upcoming' | 'past' | 'cancelled' | 'all';
  tripType?: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  sortBy: 'date' | 'created' | 'status';
  sortOrder: 'asc' | 'desc';
  searchQuery?: string;
}
```

**Local Component State:**
```typescript
// CancellationModal.tsx
interface CancellationModalState {
  isOpen: boolean;
  cancellationPolicy: CancellationPolicyResponse | null;
  cancellationReason: string;
  confirmPolicy: boolean;
  isSubmitting: boolean;
  error: string | null;
}

// BookingsList.tsx
interface BookingsListState {
  displayMode: 'grid' | 'list';
  selectedBookings: string[];  // For bulk actions (future)
  hoveredBookingId: string | null;
}

// BookingDetailView.tsx
interface BookingDetailState {
  activeTab: 'details' | 'payment' | 'timeline';
  showCancelModal: boolean;
  showModifyModal: boolean;
}
```

### Database Schema Updates

```prisma
model Booking {
  // ... existing fields
  
  // Management Fields
  isCancellable     Boolean   @default(true)
  cancellationDeadline DateTime?
  
  // Cancellation Info
  cancelledAt       DateTime?
  cancellationReason String?
  cancelledBy       String?   // User ID who cancelled
  
  // Refund Info
  refundAmount      Int?      // Amount in smallest currency unit
  refundStatus      String?   // PENDING, PROCESSING, COMPLETED, FAILED
  refundId          String?   // Stripe refund ID
  refundProcessedAt DateTime?
  
  @@index([userId, status])
  @@index([cancelledAt])
}

model CancellationPolicy {
  id                String   @id @default(cuid())
  tripId            String
  trip              Trip     @relation(fields: [tripId], references: [id])
  
  rules             Json     // Array of CancellationRule
  platformFeeRefundable Boolean @default(false)
  processingFeePercentage Float @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([tripId])
}

model RefundTransaction {
  id                String   @id @default(cuid())
  bookingId         String
  booking           Booking  @relation(fields: [bookingId], references: [id])
  
  stripeRefundId    String   @unique
  amount            Int      // Amount refunded
  status            String   // pending, succeeded, failed, canceled
  reason            String?
  
  initiatedAt       DateTime @default(now())
  completedAt       DateTime?
  
  metadata          Json?
  
  @@index([bookingId])
  @@index([stripeRefundId])
}
```

### API Integration Schema

**Stripe Refund Creation:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function createRefund(
  booking: Booking,
  refundAmount: number,
  reason?: string
) {
  const refund = await stripe.refunds.create({
    payment_intent: booking.stripePaymentIntentId!,
    amount: refundAmount,
    reason: 'requested_by_customer',
    metadata: {
      bookingId: booking.id,
      userId: booking.userId,
      cancellationReason: reason || 'Not provided',
    },
  });
  
  return refund;
}
```

**Cancellation Policy Calculation:**
```typescript
function calculateRefund(
  booking: Booking,
  cancellationPolicy: CancellationPolicy
): RefundCalculation {
  const now = new Date();
  const tripDate = booking.trip.departureTime;
  const hoursUntilTrip = differenceInHours(tripDate, now);
  
  // Find applicable rule
  const applicableRule = cancellationPolicy.rules.find(rule => 
    hoursUntilTrip >= rule.minHours
  );
  
  if (!applicableRule) {
    return { refundAmount: 0, refundPercentage: 0 };
  }
  
  const baseRefund = booking.totalAmount * (applicableRule.refundPercentage / 100);
  const processingFee = booking.totalAmount * (cancellationPolicy.processingFeePercentage / 100);
  const netRefund = Math.max(0, baseRefund - processingFee);
  
  return {
    refundAmount: netRefund,
    refundPercentage: applicableRule.refundPercentage,
    processingFee,
    rule: applicableRule,
  };
}
```

## Implementation Requirements

### Core Components

#### 1. BookingsList.tsx ⬜
**Purpose**: Main bookings list with filtering

**Features**:
- Grid/list view toggle
- Status filtering
- Date sorting
- Search functionality
- Pagination

#### 2. BookingCard.tsx ⬜
**Purpose**: Individual booking display card

**Features**:
- Trip summary display
- Status badges
- Quick actions (view, cancel)
- Cancellation deadline warning
- Hover effects

#### 3. BookingDetailView.tsx ⬜
**Purpose**: Comprehensive booking details page

**Features**:
- Trip information display
- Driver details (when assigned)
- Payment summary
- Cancellation policy
- Action buttons

#### 4. CancellationModal.tsx ⬜
**Purpose**: Cancellation confirmation dialog

**Features**:
- Policy display
- Refund calculation
- Confirmation checkbox
- Reason input
- Two-step confirmation

#### 5. RefundCalculator.tsx ⬜
**Purpose**: Real-time refund amount calculation

**Features**:
- Policy-based calculation
- Processing fee display
- Net refund highlighting
- Timeline-based adjustments

### Custom Hooks

#### useMyBookings() ⬜
```typescript
interface UseMyBookingsReturn {
  bookings: BookingSummary[];
  isLoading: boolean;
  error: string | null;
  filters: BookingFilters;
  pagination: PaginationState;
  
  updateFilters: (filters: Partial<BookingFilters>) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

#### useBookingCancellation() ⬜
```typescript
interface UseBookingCancellationReturn {
  policy: CancellationPolicyResponse | null;
  isLoading: boolean;
  error: string | null;
  
  loadPolicy: (bookingId: string) => Promise<void>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<CancelBookingResponse>;
  calculateRefund: (hoursUntilTrip: number) => RefundCalculation;
}
```

#### useBookingDetail() ⬜
```typescript
interface UseBookingDetailReturn {
  booking: BookingDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  
  loadBooking: (bookingId: string) => Promise<void>;
  refresh: () => Promise<void>;
  isCancellable: boolean;
  timeUntilCancellationDeadline: number | null;
}
```

### Utility Functions

#### src/lib/bookings/cancellation-utils.ts ⬜
```typescript
export function calculateRefundAmount(
  booking: Booking,
  policy: CancellationPolicy,
  cancellationTime: Date
): RefundCalculation;

export function isCancellable(
  booking: Booking,
  currentTime: Date
): boolean;

export function getCancellationDeadline(
  booking: Booking
): Date | null;

export function formatRefundTimeline(
  refundDate: Date
): string;
```

#### src/lib/bookings/booking-filters.ts ⬜
```typescript
export function filterBookings(
  bookings: Booking[],
  filters: BookingFilters
): Booking[];

export function sortBookings(
  bookings: Booking[],
  sortBy: SortField,
  sortOrder: SortOrder
): Booking[];

export function searchBookings(
  bookings: Booking[],
  query: string
): Booking[];
```

## Acceptance Criteria

### Functional Requirements

#### 1. My Trips Page ⬜
- [x] Displays all user bookings with pagination
- [x] Status filter works (Upcoming/Past/Cancelled/All)
- [x] Trip type filter works (Private/Shared/Activity)
- [x] Date sorting (ascending/descending)
- [x] Search by booking ID or destination
- [x] Summary cards show correct counts

#### 2. Booking Details ⬜
- [x] Shows complete trip information
- [x] Displays driver details when assigned
- [x] Shows payment breakdown
- [x] Displays cancellation policy
- [x] Shows booking timeline/status
- [x] Receipt download available

#### 3. Cancellation Flow ⬜
- [x] Cancel button only visible for cancellable bookings
- [x] Confirmation modal shows refund calculation
- [x] Policy rules displayed clearly
- [x] Requires explicit confirmation
- [x] Optional cancellation reason captured

#### 4. Refund Processing ⬜
- [x] Refund amount calculated correctly based on policy
- [x] Stripe refund initiated automatically
- [x] Refund status tracked in database
- [x] User notified of refund status
- [x] Refund appears in payment history

#### 5. Seat Release (Shared Rides) ⬜
- [x] Cancelled seats released immediately
- [x] Trip availability updated
- [x] Other passengers notified if applicable
- [x] Seat count decremented correctly

### Non-Functional Requirements

#### Performance ⬜
- [x] My Trips page loads <1.5 seconds
- [x] Booking details loads <1 second
- [x] Cancellation processing <2 seconds
- [x] Refund initiation <3 seconds

#### Security ⬜
- [x] User can only view own bookings
- [x] User can only cancel own bookings
- [x] Audit log for all cancellations
- [x] Idempotency for refund operations

#### Accessibility ⬜
- [x] Keyboard navigation support
- [x] Screen reader compatibility
- [x] Clear focus indicators
- [x] ARIA labels for interactive elements

## Modified Files

```
src/app/
├── bookings/
│   ├── my-trips/
│   │   ├── page.tsx                                  ⬜
│   │   ├── loading.tsx                               ⬜
│   │   └── components/
│   │       ├── BookingsList.tsx                      ⬜
│   │       ├── BookingCard.tsx                       ⬜
│   │       ├── BookingSummaryCards.tsx               ⬜
│   │       ├── BookingsFilters.tsx                   ⬜
│   │       ├── BookingsEmptyState.tsx                ⬜
│   │       └── StatusBadge.tsx                       ⬜
│   ├── [bookingId]/
│   │   ├── page.tsx                                  ⬜
│   │   ├── loading.tsx                               ⬜
│   │   └── components/
│   │       ├── BookingDetailView.tsx                 ⬜
│   │       ├── TripInfoCard.tsx                      ⬜
│   │       ├── DriverInfoCard.tsx                    ⬜
│   │       ├── PassengerDetailsCard.tsx              ⬜
│   │       ├── PaymentSummaryCard.tsx                ⬜
│   │       ├── CancellationPolicyCard.tsx            ⬜
│   │       ├── StatusTimeline.tsx                    ⬜
│   │       └── BookingActions.tsx                    ⬜
│   └── cancel/
│       └── [bookingId]/
│           └── components/
│               ├── CancellationModal.tsx             ⬜
│               ├── RefundCalculator.tsx              ⬜
│               ├── PolicySummary.tsx                 ⬜
│               ├── CancellationSuccess.tsx           ⬜
│               └── CancellationReason.tsx            ⬜
├── api/
│   └── bookings/
│       ├── my-trips/route.ts                         ⬜
│       └── [bookingId]/
│           ├── route.ts                              ⬜
│           ├── cancel/route.ts                       ⬜
│           ├── cancellation-policy/route.ts          ⬜
│           └── modify/route.ts                       ⬜
├── lib/
│   ├── bookings/
│   │   ├── cancellation-utils.ts                     ⬜
│   │   ├── booking-filters.ts                        ⬜
│   │   └── refund-processor.ts                       ⬜
│   └── hooks/
│       ├── useMyBookings.ts                          ⬜
│       ├── useBookingCancellation.ts                 ⬜
│       └── useBookingDetail.ts                       ⬜
└── types/
    └── booking-management.ts                         ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Foundation (Week 1) ⬜
- [ ] Database schema updates (cancellation fields)
- [ ] Type definitions for booking management
- [ ] API route stubs
- [ ] Utility functions for refund calculation

### Phase 2: My Trips Page (Week 1-2) ⬜
- [ ] BookingsList component
- [ ] BookingCard component
- [ ] Filtering and sorting
- [ ] Pagination
- [ ] Empty states

### Phase 3: Booking Details (Week 2) ⬜
- [ ] BookingDetailView component
- [ ] Trip/Driver/Payment cards
- [ ] Cancellation policy display
- [ ] Status timeline

### Phase 4: Cancellation Flow (Week 2-3) ⬜
- [ ] CancellationModal component
- [ ] Refund calculation logic
- [ ] Stripe refund integration
- [ ] Success/error handling

### Phase 5: Testing & Polish (Week 3) ⬜
- [ ] Unit tests for cancellation logic
- [ ] Integration tests for refund flow
- [ ] E2E tests for complete user journey
- [ ] Performance optimization

## Dependencies

- **Story 33/34**: Booking infrastructure
- **Story 35**: Payment and refund capabilities
- **Stripe**: Refunds API
- **Email Service**: Cancellation notifications

## Risk Assessment

### Technical Risks

#### Risk 1: Stripe Refund Failures
- **Impact**: Critical (money not returned)
- **Mitigation**: Retry logic + manual reconciliation
- **Contingency**: Support team intervention

#### Risk 2: Race Conditions in Seat Release
- **Impact**: Medium (incorrect availability)
- **Mitigation**: Database transactions
- **Contingency**: Nightly reconciliation job

#### Risk 3: Refund Calculation Errors
- **Impact**: High (customer disputes)
- **Mitigation**: Extensive testing + audit logs
- **Contingency**: Manual refund adjustments

## Testing Strategy

```typescript
describe('Booking Management', () => {
  describe('Cancellation Flow', () => {
    it('calculates refund correctly based on policy', () => {
      // Test refund calculation
    });
    
    it('prevents cancellation past deadline', () => {
      // Test deadline enforcement
    });
    
    it('releases seats for shared rides', async () => {
      // Test seat release
    });
    
    it('processes Stripe refund successfully', async () => {
      // Test refund integration
    });
  });
  
  describe('Booking Filters', () => {
    it('filters bookings by status', () => {
      // Test filtering
    });
    
    it('sorts bookings by date', () => {
      // Test sorting
    });
  });
});
```

## Monitoring & Analytics

**Key Metrics:**
- Cancellation rate by time before trip
- Average refund amount
- Refund processing time
- Failed refund count
- Support tickets related to cancellations

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 2-3 weeks (1 developer)
