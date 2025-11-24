# 34 - Passenger Book Shared Ride Seat - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM  
**Infrastructure**: Vercel (hosting), PostgreSQL (Supabase/Railway), Stripe (payments)

## User Story

**As a** passenger,  
**I want** to book one or more seats on a shared ride,  
**so that** I can reduce my travel cost by sharing a cab with other passengers.

## Pre-conditions

- User must be authenticated (registered as PASSENGER role)
- Trip must exist with `status = 'PUBLISHED'` and `isShared = true`
- Trip must have available seats (`availableSeats > 0`)
- Story 33 (Private Booking) infrastructure completed
- Optimistic locking mechanism implemented for concurrency control

## Business Requirements

- **BR-1**: Enable cost-effective shared ride booking to attract budget-conscious travelers
  - Success Metric: 40% of bookings are shared rides within 3 months
  - Performance: Shared trips display prominently in search results

- **BR-2**: Prevent overbooking through robust concurrency control
  - Success Metric: 0% overbooking incidents
  - Performance: Atomic seat reservation with <1 second response

- **BR-3**: Provide transparent seat availability and pricing
  - Success Metric: <5% booking abandonment due to confusion
  - Performance: Real-time seat count updates

- **BR-4**: Implement 10-minute soft hold for seat reservation
  - Success Metric: >85% conversion from hold to payment
  - Performance: Hold expiration processing every 30 seconds

## Technical Specifications

### Integration Points
- **Authentication**: Clerk/Custom Auth (JWT with session management)
- **Database**: PostgreSQL with row-level locking and optimistic locking
- **Payments**: Stripe Checkout/Elements (Story 35)
- **Real-time Updates**: WebSockets/SSE for seat availability
- **Background Jobs**: Cron job for expired hold cleanup

### Security Requirements
- JWT authentication for all booking endpoints
- Transaction isolation level: SERIALIZABLE for seat booking
- Optimistic locking with version/timestamp columns
- Rate limiting: 10 seat booking attempts per minute per user
- Prevent seat hoarding (max 4 seats per booking)

### API Endpoints

#### GET /api/trips/shared
Lists available shared trips with real-time seat availability.

**Query Parameters:**
```typescript
interface SharedTripsQuery {
  origin?: string;
  destination?: string;
  date?: Date;
  minSeats?: number;  // Minimum available seats
  sortBy?: 'price' | 'departure' | 'availability';
}
```

**Response:**
```typescript
interface SharedTripsResponse {
  trips: SharedTripSummary[];
  pagination: PaginationInfo;
}

interface SharedTripSummary {
  id: string;
  title: string;
  originName: string;
  destName: string;
  departureTime: Date;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  pricePerSeat: number;
  currency: 'KZT';
  estimatedDuration: string;
  distance: number;
}
```

#### POST /api/bookings/shared
Creates a shared ride booking with soft hold.

**Request:**
```typescript
interface CreateSharedBookingRequest {
  tripId: string;
  seatsRequested: number;  // 1-4 seats
  passengerDetails: PassengerInfo[];
  specialRequests?: string;
}
```

**Response:**
```typescript
interface CreateSharedBookingResponse {
  bookingId: string;
  status: 'HELD';  // 10-minute soft hold
  seatsBooked: number;
  pricePerSeat: number;
  totalAmount: number;
  holdExpiresAt: Date;  // Now + 10 minutes
  paymentUrl: string;
  trip: TripSummary;
}
```

#### POST /api/bookings/shared/check-availability
Checks real-time seat availability before booking attempt.

**Request:**
```typescript
interface CheckAvailabilityRequest {
  tripId: string;
  seatsRequested: number;
}
```

**Response:**
```typescript
interface AvailabilityResponse {
  available: boolean;
  currentlyAvailable: number;
  message?: string;  // "Only 2 seats remaining"
}
```

#### POST /api/bookings/:bookingId/extend-hold
Extends hold time by 5 minutes (one-time only).

**Response:**
```typescript
interface ExtendHoldResponse {
  success: boolean;
  newExpiresAt: Date;
  message: string;
}
```

## Design Specifications

### Visual Layout & Components

**Shared Trips Listing Page**:
```
[Search Filters Bar]
├── Destination Filter
├── Date Range Filter
├── Min Seats Available Filter
└── Sort Dropdown (Price/Date/Availability)

[Trips Grid]
├── [Shared Trip Card] - Per-seat pricing badge
│   ├── Trip Image
│   ├── Origin → Destination
│   ├── Departure Date & Time
│   ├── Seat Availability Bar (visual)
│   │   ├── Booked: X seats (gray)
│   │   └── Available: Y seats (green)
│   ├── Price: ₸X,XXX per seat
│   └── "View Details" Button
└── [Load More Button]
```

**Shared Trip Detail Page**:
```
[Trip Hero Section]
├── Trip Title & Route
└── Image Gallery

[Main Content Grid]
├── [Left Column - Trip Details]
│   ├── Itinerary
│   ├── Amenities
│   └── Driver Info (when assigned)
│
└── [Right Column - Booking Card (Sticky)]
    ├── "Shared Ride" Badge
    ├── Seat Availability Visual
    │   ├── Total Seats: 8
    │   ├── Available: 3 (highlighted green)
    │   └── Booked: 5 (grayed out)
    ├── Price Section
    │   ├── Per Seat: ₸XX,XXX
    │   └── Seat Selector (1-min(4, available))
    ├── Total Price Calculator (live)
    │   └── X seats × ₸XX,XXX = ₸XXX,XXX
    ├── Passenger Details Form
    │   └── [Name inputs per seat]
    ├── "Reserve Seats" Button (primary)
    └── "Only X seats left!" Warning (if <3)
```

**Soft Hold Confirmation Screen**:
```
[Hold Status Banner]
├── Timer Icon + Countdown: "9:42 remaining"
├── "Seats Reserved!" Heading
└── "Complete payment to confirm"

[Booking Summary Card]
├── Trip Details
│   ├── Origin → Destination
│   └── Departure: Date & Time
├── Seat Information
│   ├── Seats Reserved: X
│   ├── Price per Seat: ₸XX,XXX
│   └── Total: ₸XXX,XXX (bold)
├── Passenger Names
│   └── List of X passengers
└── Hold Expiry Info
    └── "Hold expires at HH:MM"

[Action Buttons]
├── "Proceed to Payment" (primary, pulsing)
├── "Extend Hold (+5 min)" (secondary, if available)
└── "Cancel Reservation" (tertiary)

[Other Passengers Section]
└── "X other passengers have also booked this trip"
```

### Design System Compliance

**Color Palette:**
```css
/* Seat Availability States */
--seat-available: #10b981;     /* bg-emerald-500 */
--seat-booked: #9ca3af;        /* bg-gray-400 */
--seat-held: #f59e0b;          /* bg-amber-500 */
--seat-selected: #3b82f6;      /* bg-blue-500 */

/* Hold Timer States */
--hold-safe: #10b981;          /* >5 minutes */
--hold-warning: #f59e0b;       /* 2-5 minutes */
--hold-urgent: #ef4444;        /* <2 minutes */

/* Shared Ride Branding */
--shared-badge-bg: #dbeafe;    /* bg-blue-100 */
--shared-badge-text: #1e40af;  /* text-blue-800 */
```

**Seat Availability Visual:**
```css
/* Seat Indicator Bar */
.seat-bar {
  @apply h-2 w-full rounded-full overflow-hidden flex;
}

.seat-segment {
  @apply transition-all duration-300;
}

.seat-booked {
  @apply bg-gray-400;
}

.seat-available {
  @apply bg-emerald-500;
}

.seat-held {
  @apply bg-amber-500;
}
```

### Responsive Behavior

**Mobile Layout (<768px)**:
```css
.shared-trips-mobile {
  @apply flex flex-col space-y-4 px-4;
}

.trip-card-mobile {
  @apply w-full rounded-lg border border-gray-200;
  @apply p-4 space-y-3;
}

.booking-card-mobile {
  @apply fixed bottom-0 left-0 right-0;
  @apply bg-white border-t-2 border-gray-200;
  @apply px-4 py-6 z-50 shadow-2xl;
  /* Swipe up to expand */
}

.hold-timer-mobile {
  @apply fixed top-0 left-0 right-0;
  @apply bg-amber-50 border-b border-amber-200;
  @apply px-4 py-3 z-40;
}
```

**Desktop Layout (1024px+)**:
```css
.shared-trips-grid {
  @apply grid grid-cols-3 gap-6 px-8;
}

.trip-detail-layout {
  @apply grid grid-cols-12 gap-8;
}

.booking-card-desktop {
  @apply col-span-4 sticky top-24;
}

.hold-timer-desktop {
  @apply fixed top-20 right-8;
  @apply bg-white border-2 border-amber-500;
  @apply rounded-lg px-6 py-4 shadow-xl z-50;
}
```

### Interaction Patterns

**Seat Selection:**
```typescript
interface SeatSelectionStates {
  default: 'bg-white border-2 border-gray-300 cursor-pointer hover:border-blue-500';
  selected: 'bg-blue-500 border-2 border-blue-600 text-white';
  unavailable: 'bg-gray-200 border-2 border-gray-300 cursor-not-allowed opacity-50';
  held: 'bg-amber-100 border-2 border-amber-400 cursor-not-allowed';
}
```

**Hold Timer Animation:**
```typescript
const holdTimerStates = {
  safe: {
    color: 'text-emerald-600',
    background: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  warning: {
    color: 'text-amber-600',
    background: 'bg-amber-50',
    border: 'border-amber-200',
    pulse: 'animate-pulse',
  },
  urgent: {
    color: 'text-red-600',
    background: 'bg-red-50',
    border: 'border-red-200',
    pulse: 'animate-pulse',
    shake: 'animate-shake',
  },
};
```

## Technical Architecture

### Component Structure

```
src/app/
├── trips/
│   ├── shared/
│   │   ├── page.tsx                      # Shared trips listing ⬜
│   │   └── components/
│   │       ├── SharedTripCard.tsx        # Trip card with seat info ⬜
│   │       ├── SeatAvailabilityBar.tsx   # Visual seat indicator ⬜
│   │       └── SharedTripsFilters.tsx    # Filter controls ⬜
│   └── [tripId]/
│       └── components/
│           ├── SharedBookingCard.tsx     # Shared booking variant ⬜
│           ├── SeatSelector.tsx          # Seat selection UI ⬜
│           └── PassengerForm.tsx         # Per-seat passenger info ⬜
├── bookings/
│   ├── shared/
│   │   └── [tripId]/
│   │       ├── page.tsx                  # Shared booking flow ⬜
│   │       └── components/
│   │           ├── SharedBookingForm.tsx  # Main form ⬜
│   │           ├── SeatPriceCalculator.tsx # Live price calc ⬜
│   │           └── PassengerDetailsGrid.tsx # Multi-passenger input ⬜
│   └── hold/
│       └── [bookingId]/
│           ├── page.tsx                  # Soft hold screen ⬜
│           └── components/
│               ├── HoldTimer.tsx         # Countdown timer ⬜
│               ├── HoldSummary.tsx       # Hold booking summary ⬜
│               ├── ExtendHoldButton.tsx  # +5 min extension ⬜
│               └── OtherPassengers.tsx   # Co-passengers display ⬜
└── api/
    ├── trips/
    │   └── shared/
    │       └── route.ts                  # GET shared trips list ⬜
    ├── bookings/
    │   ├── shared/
    │   │   ├── route.ts                  # POST create shared booking ⬜
    │   │   └── check-availability/
    │   │       └── route.ts              # POST check availability ⬜
    │   └── [bookingId]/
    │       └── extend-hold/
    │           └── route.ts              # POST extend hold ⬜
    └── cron/
        └── expire-holds/
            └── route.ts                  # Background job ⬜
```

### State Management Architecture

**Global State (Zustand):**
```typescript
interface SharedBookingStore {
  // Current Shared Booking Flow
  selectedTrip: SharedTripDetails | null;
  seatsSelected: number;
  passengers: PassengerInfo[];
  
  // Soft Hold State
  currentHold: {
    bookingId: string | null;
    expiresAt: Date | null;
    canExtend: boolean;
  } | null;
  
  // Real-time Availability
  availabilityCache: Map<string, AvailabilityInfo>;
  
  // Actions
  selectSeats: (tripId: string, count: number) => void;
  updatePassengers: (passengers: PassengerInfo[]) => void;
  createHold: (request: CreateSharedBookingRequest) => Promise<CreateSharedBookingResponse>;
  extendHold: (bookingId: string) => Promise<boolean>;
  checkAvailability: (tripId: string, seats: number) => Promise<boolean>;
  releaseHold: (bookingId: string) => Promise<void>;
}
```

**Local Component State:**
```typescript
// SharedBookingCard.tsx
interface SharedBookingState {
  seatsSelected: number;
  passengers: PassengerInfo[];
  pricePerSeat: number;
  totalPrice: number;
  isCheckingAvailability: boolean;
  isCreatingHold: boolean;
  availabilityError: string | null;
}

// HoldTimer.tsx
interface HoldTimerState {
  timeRemaining: number;  // milliseconds
  formattedTime: string;  // "09:42"
  isExpired: boolean;
  urgencyLevel: 'safe' | 'warning' | 'urgent';
  hasExtended: boolean;
}

// SeatSelector.tsx
interface SeatSelectorState {
  selectedCount: number;
  maxSelectable: number;
  availableSeats: number;
}
```

### Database Schema Updates

```prisma
model Booking {
  // ... existing fields
  
  // Shared Booking Fields
  holdExpiresAt  DateTime?  // NULL for private, NOW() + 10min for shared
  holdExtended   Boolean    @default(false)  // One-time extension flag
  
  @@index([holdExpiresAt])  // For expired hold cleanup job
}

// Optimistic Locking
model Trip {
  // ... existing fields
  
  version        Int        @default(1)  // Increment on seat booking
  
  @@index([version])
}
```

### API Integration Schema

**Type Definitions:**
```typescript
// Shared Booking Types
interface PassengerInfo {
  seatNumber: number;  // 1-based
  name: string;
  age?: number;
  email?: string;
  phone?: string;
}

interface SharedTripDetails {
  id: string;
  title: string;
  originName: string;
  destName: string;
  departureTime: Date;
  returnTime?: Date;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  pricePerSeat: number;
  currency: 'KZT';
  platformFee: number;
  estimatedDuration: string;
  distance: number;
}

interface CreateSharedBookingDto {
  tripId: string;
  seatsRequested: number;  // 1-4
  passengers: PassengerInfo[];
  specialRequests?: string;
}

interface HoldBookingResponse {
  bookingId: string;
  status: 'HELD';
  seatsBooked: number;
  holdExpiresAt: Date;
  canExtend: boolean;
  paymentUrl: string;
}
```

## Implementation Requirements

### Core Components

#### 1. SharedTripCard.tsx ⬜
**Purpose**: Display shared trip with seat availability

**Features**:
- Visual seat availability bar
- Per-seat pricing display
- "Shared Ride" badge
- Availability warnings (<3 seats)
- Quick book CTA

#### 2. SeatSelector.tsx ⬜
**Purpose**: Interactive seat count selector

**Features**:
- Increment/decrement buttons
- Max limit based on availability
- Live price calculation
- Validation feedback

#### 3. PassengerForm.tsx ⬜
**Purpose**: Collect info for each passenger

**Features**:
- Dynamic form fields per seat
- Name validation (required)
- Optional: age, email, phone
- Accessibility for screen readers

#### 4. HoldTimer.tsx ⬜
**Purpose**: Visual countdown for soft hold

**Features**:
- Real-time countdown (updates every second)
- Progressive urgency states
- Extend hold button (if eligible)
- Auto-expire handling

#### 5. SharedBookingForm.tsx ⬜
**Purpose**: Complete shared booking flow

**Features**:
- Seat selection
- Passenger details collection
- Real-time availability check
- Hold creation
- Error handling

### Custom Hooks

#### useSharedBooking() ⬜
```typescript
interface UseSharedBookingReturn {
  selectedSeats: number;
  passengers: PassengerInfo[];
  availability: AvailabilityInfo | null;
  isLoading: boolean;
  error: string | null;
  
  selectSeats: (count: number) => void;
  updatePassenger: (index: number, info: PassengerInfo) => void;
  checkAvailability: () => Promise<boolean>;
  createHold: () => Promise<HoldBookingResponse>;
}
```

#### useHoldTimer() ⬜
```typescript
interface UseHoldTimerReturn {
  timeRemaining: number;
  formattedTime: string;
  isExpired: boolean;
  urgencyLevel: 'safe' | 'warning' | 'urgent';
  canExtend: boolean;
  extendHold: () => Promise<boolean>;
  onExpire: () => void;
}
```

#### useSeatAvailability() ⬜
```typescript
interface UseSeatAvailabilityReturn {
  available: number;
  booked: number;
  held: number;
  total: number;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  checkAvailability: (seats: number) => Promise<boolean>;
}
```

### Utility Functions

#### src/lib/booking/shared-booking-utils.ts ⬜
```typescript
export function calculateSharedBookingPrice(
  pricePerSeat: number,
  seats: number,
  platformFeePercent: number
): PriceBreakdown;

export function validateSeatAvailability(
  requested: number,
  available: number
): ValidationResult;

export function calculateHoldExpiry(createdAt: Date): Date;

export function canExtendHold(
  holdCreatedAt: Date,
  hasExtended: boolean
): boolean;
```

## Acceptance Criteria

### Functional Requirements

#### 1. Shared Trips Listing ⬜
- [x] Shared trips clearly marked with badge/icon
- [x] Per-seat pricing prominently displayed
- [x] Visual seat availability indicator
- [x] Filter by minimum available seats
- [x] Sort by price, date, availability
- [x] Real-time seat count updates

#### 2. Seat Selection ⬜
- [x] Passenger can select 1-4 seats
- [x] Maximum limited by available seats
- [x] Live price calculation per seat added
- [x] Warning when <3 seats remain
- [x] Error if selecting more than available

#### 3. Passenger Details ⬜
- [x] One form section per seat selected
- [x] Name required for each passenger
- [x] Optional: age, email, phone
- [x] Validation before proceeding
- [x] Clear labels: "Passenger 1", "Passenger 2", etc.

#### 4. Soft Hold Creation ⬜
- [x] Real-time availability check before hold
- [x] Database transaction with optimistic locking
- [x] Hold expires in exactly 10 minutes
- [x] Seats temporarily removed from availability
- [x] Hold ID returned for payment flow

#### 5. Hold Timer Display ⬜
- [x] Countdown displays minutes:seconds
- [x] Timer updates every second
- [x] Color changes: green → amber → red
- [x] Pulsing animation when <2 minutes
- [x] Auto-redirect on expiration

#### 6. Extend Hold Feature ⬜
- [x] "Extend +5 min" button available once
- [x] Button disabled after one extension
- [x] New expiry time displayed
- [x] Confirmation message shown

#### 7. Concurrent Booking Prevention ⬜
- [x] Optimistic locking with version field
- [x] Transaction isolation: SERIALIZABLE
- [x] Clear error if seats just booked
- [x] Suggest alternative trips
- [x] Auto-refresh availability

### Non-Functional Requirements

#### Performance ⬜
- [x] Availability check response <300ms
- [x] Hold creation response <1 second
- [x] Real-time seat updates <500ms latency
- [x] Timer updates smooth (60 FPS)

#### Security ⬜
- [x] Prevent seat hoarding (max 4 seats)
- [x] Rate limiting per user
- [x] Transaction atomicity guaranteed
- [x] Hold expiry enforced server-side

#### Accessibility ⬜
- [x] Screen reader announces seat selection
- [x] Keyboard navigation for seat selector
- [x] Timer countdown announced periodically
- [x] Form validation errors clear

## Modified Files

```
src/app/
├── trips/shared/
│   ├── page.tsx                                      ⬜
│   └── components/
│       ├── SharedTripCard.tsx                        ⬜
│       ├── SeatAvailabilityBar.tsx                   ⬜
│       └── SharedTripsFilters.tsx                    ⬜
├── bookings/
│   ├── shared/[tripId]/
│   │   ├── page.tsx                                  ⬜
│   │   └── components/
│   │       ├── SharedBookingForm.tsx                 ⬜
│   │       ├── SeatSelector.tsx                      ⬜
│   │       ├── PassengerForm.tsx                     ⬜
│   │       └── SeatPriceCalculator.tsx               ⬜
│   └── hold/[bookingId]/
│       ├── page.tsx                                  ⬜
│       └── components/
│           ├── HoldTimer.tsx                         ⬜
│           ├── HoldSummary.tsx                       ⬜
│           └── ExtendHoldButton.tsx                  ⬜
├── api/
│   ├── trips/shared/route.ts                         ⬜
│   ├── bookings/shared/
│   │   ├── route.ts                                  ⬜
│   │   └── check-availability/route.ts               ⬜
│   └── cron/expire-holds/route.ts                    ⬜
├── lib/
│   ├── booking/shared-booking-utils.ts               ⬜
│   └── hooks/
│       ├── useSharedBooking.ts                       ⬜
│       ├── useHoldTimer.ts                           ⬜
│       └── useSeatAvailability.ts                    ⬜
└── types/shared-booking.ts                           ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Foundation (Week 1) ⬜
- [ ] Database schema updates (holdExpiresAt, version)
- [ ] Type definitions for shared bookings
- [ ] Utility functions for pricing/validation
- [ ] API route stubs

### Phase 2: Listing & Discovery (Week 1-2) ⬜
- [ ] Shared trips listing page
- [ ] SharedTripCard component
- [ ] SeatAvailabilityBar component
- [ ] Filter and sort functionality

### Phase 3: Booking Flow (Week 2-3) ⬜
- [ ] SeatSelector component
- [ ] PassengerForm component
- [ ] Availability checking
- [ ] Hold creation logic

### Phase 4: Hold Management (Week 3) ⬜
- [ ] HoldTimer component
- [ ] Hold summary page
- [ ] Extend hold feature
- [ ] Expiration handling

### Phase 5: Testing & Optimization (Week 4) ⬜
- [ ] Concurrent booking tests
- [ ] Hold expiry tests
- [ ] Performance optimization
- [ ] E2E testing

## Dependencies

- **Story 33**: Private booking infrastructure
- **Story 35**: Payment integration
- **Database**: Optimistic locking support
- **Background Jobs**: Cron for hold expiry

## Risk Assessment

### Technical Risks

#### Risk 1: Race Conditions in Seat Booking
- **Impact**: Critical (overbooking)
- **Mitigation**: Optimistic locking + SERIALIZABLE transactions
- **Contingency**: Manual reconciliation + customer support

#### Risk 2: Hold Timer Drift
- **Impact**: Medium (UX issues)
- **Mitigation**: Server-side expiry check
- **Contingency**: Grace period for edge cases

## Testing Strategy

```typescript
describe('Shared Booking Concurrency', () => {
  it('prevents double booking when 2 users select last seat', async () => {
    // Simulate concurrent requests
  });
  
  it('handles optimistic lock failures gracefully', async () => {
    // Test version mismatch handling
  });
});

describe('Hold Expiry', () => {
  it('releases seats after 10 minutes', async () => {
    // Test automatic cleanup
  });
  
  it('allows one-time hold extension', async () => {
    // Test +5 min extension
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 3-4 weeks (1 developer)
