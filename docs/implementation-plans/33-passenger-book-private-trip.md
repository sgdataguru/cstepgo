# 33 - Passenger Book Private Trip - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM  
**Infrastructure**: Vercel (hosting), PostgreSQL (Supabase/Railway), Stripe (payments)

## User Story

**As a** passenger,  
**I want** to book a private cab for a specific origin, destination, date/time, and number of passengers,  
**so that** I can secure a dedicated ride that fits my travel needs.

## Pre-conditions

- User must be authenticated (registered as PASSENGER role)
- Trip must exist in database with `status = 'PUBLISHED'`
- Trip must have `availableSeats > 0`
- Google Places API configured for location autocomplete
- Stripe payment integration configured
- Session management active

## Business Requirements

- **BR-1**: Enable seamless private trip booking from landing page search widget
  - Success Metric: >80% booking completion rate from landing page
  - Performance: Widget loads in <500ms

- **BR-2**: Enable booking from trip detail pages
  - Success Metric: >70% booking completion from detail page
  - Performance: Booking flow <3 steps

- **BR-3**: Provide real-time fare calculation with transparency
  - Success Metric: <2% fare dispute rate
  - Performance: Calculation response <200ms

- **BR-4**: Create pending bookings that reserve trip capacity
  - Success Metric: 0% double-booking incidents
  - Performance: Atomic booking creation with row-level locks

- **BR-5**: Guide passengers through payment completion
  - Success Metric: >90% payment success rate
  - Performance: Payment redirect <1 second

## Technical Specifications

### Integration Points
- **Authentication**: Clerk/Custom Auth (JWT with session management)
- **Maps/Places**: Google Places API (autocomplete for origin/destination)
- **Payments**: Stripe Checkout/Elements (handled in Story 35)
- **Notifications**: Email (confirmation), SMS (optional)
- **Database**: PostgreSQL with Prisma ORM

### Security Requirements
- JWT authentication for all booking endpoints
- CSRF protection on booking forms
- Input sanitization for all user-provided data
- Rate limiting on booking creation (5 requests per minute)
- Atomic transaction for booking creation
- Row-level locking to prevent double-booking

### API Endpoints

#### POST /api/bookings/private
Creates a private trip booking and reserves entire vehicle capacity.

**Request:**
```typescript
interface CreatePrivateBookingRequest {
  tripId: string;
  origin: string;              // If custom (from landing page)
  destination: string;          // If custom (from landing page)
  departureDate?: Date;         // If custom (from landing page)
  passengers: number;           // Total passengers (1-8)
  notes?: string;               // Special requests
}
```

**Response:**
```typescript
interface CreatePrivateBookingResponse {
  bookingId: string;
  tripId: string;
  status: 'PENDING';
  totalAmount: number;
  currency: 'KZT';
  trip: {
    originName: string;
    destName: string;
    departureTime: Date;
    estimatedDuration: string;
    distance: number;
  };
  expiresAt: Date;  // 15 minutes to complete payment
  paymentUrl: string;  // Redirect to payment (Story 35)
}
```

#### GET /api/bookings/:bookingId
Retrieves booking details for confirmation screen.

**Response:**
```typescript
interface BookingDetailsResponse {
  id: string;
  status: BookingStatus;
  tripId: string;
  userId: string;
  seatsBooked: number;
  totalAmount: number;
  passengers: PassengerInfo[];
  trip: TripSummary;
  payment?: PaymentInfo;
  createdAt: Date;
  expiresAt?: Date;
}
```

#### POST /api/trips/calculate-fare
Calculates fare for private trip booking (may create trip on-the-fly).

**Request:**
```typescript
interface CalculateFareRequest {
  tripId?: string;  // If booking existing trip
  origin?: PlaceDetails;  // If creating new trip
  destination?: PlaceDetails;
  departureDate?: Date;
  passengers: number;
  vehicleType?: 'sedan' | 'suv' | 'van';
}
```

**Response:**
```typescript
interface FareCalculationResponse {
  totalFare: number;
  breakdown: {
    basePrice: number;
    distanceFee: number;
    timeFee: number;
    platformFee: number;
    taxes: number;
  };
  estimatedDuration: string;
  distance: number;
  currency: 'KZT';
}
```

## Design Specifications

### Visual Layout & Components

**Landing Page Search Widget**:
```
[Hero Section]
├── Heading: "Book Your Private Ride"
├── Search Widget Card (elevated, white bg)
│   ├── Location Input (Origin) with autocomplete
│   ├── Location Input (Destination) with autocomplete
│   ├── Date/Time Picker (calendar + time slots)
│   ├── Passenger Count Selector (1-8)
│   └── "Calculate Fare" Button (primary, blue-600)
└── OR
    └── "Browse Existing Trips" Link
```

**Trip Detail Page Booking Section**:
```
[Trip Hero]
├── Trip Title & Destination
├── Image Gallery
└── [Booking Card - Sticky Right Sidebar]
    ├── Trip Summary
    │   ├── Origin → Destination
    │   ├── Departure: Date & Time
    │   ├── Duration: X hours
    │   └── Capacity: X passengers
    ├── Pricing Section
    │   ├── Private Trip: ₸XXX,XXX
    │   ├── Platform Fee: ₸XX,XXX
    │   └── Total: ₸XXX,XXX (bold, large)
    ├── Passenger Input (1-8 selector)
    ├── Special Requests (textarea)
    └── "Book Private Trip" Button (primary, full-width)
```

**Booking Confirmation Screen**:
```
[Confirmation Layout]
├── Success Icon (checkmark, green)
├── Heading: "Booking Reserved!"
├── Countdown Timer: "Complete payment in 14:32"
├── [Booking Summary Card]
│   ├── Trip Details
│   │   ├── Origin → Destination
│   │   ├── Departure: Date & Time
│   │   └── Booking Type: Private (whole vehicle)
│   ├── Passenger Information
│   │   └── X passengers
│   ├── Price Breakdown
│   │   ├── Base Fare: ₸XXX,XXX
│   │   ├── Platform Fee: ₸XX,XXX
│   │   └── Total: ₸XXX,XXX
│   └── Booking Reference: #BKG-XXXXX
├── "Proceed to Payment" Button (primary, pulsing)
└── "Cancel Booking" Link (secondary)
```

### Design System Compliance

**Color Palette:**
```css
/* Primary Actions */
--btn-primary: #2563eb;        /* bg-blue-600 */
--btn-primary-hover: #1d4ed8;  /* bg-blue-700 */
--btn-primary-active: #1e40af; /* bg-blue-800 */

/* Success States */
--success-bg: #d1fae5;         /* bg-emerald-100 */
--success-text: #065f46;       /* text-emerald-900 */
--success-border: #10b981;     /* border-emerald-500 */

/* Warning States (Countdown Timer) */
--warning-bg: #fef3c7;         /* bg-amber-100 */
--warning-text: #92400e;       /* text-amber-900 */
--warning-border: #f59e0b;     /* border-amber-500 */

/* Neutral UI */
--card-bg: #ffffff;
--card-border: #e5e7eb;        /* border-gray-200 */
--text-primary: #111827;       /* text-gray-900 */
--text-secondary: #6b7280;     /* text-gray-500 */
```

**Typography Scale:**
```css
/* Headings */
--h1: 2.25rem;   /* 36px - Page titles */
--h2: 1.875rem;  /* 30px - Section titles */
--h3: 1.5rem;    /* 24px - Card titles */
--h4: 1.25rem;   /* 20px - Sub-headings */

/* Body Text */
--text-base: 1rem;      /* 16px - Normal text */
--text-sm: 0.875rem;    /* 14px - Helper text */
--text-xs: 0.75rem;     /* 12px - Labels */

/* Pricing Display */
--price-large: 2rem;    /* 32px - Total price */
--price-medium: 1.5rem; /* 24px - Breakdown items */
```

### Responsive Behavior

**Breakpoints:**
```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
```

**Mobile Layout (<768px)**:
```css
.landing-widget-mobile {
  @apply flex flex-col space-y-4 px-4 py-6;
  @apply w-full max-w-md mx-auto;
}

.trip-detail-mobile {
  @apply flex flex-col space-y-6;
  /* Booking card appears below trip details */
}

.booking-card-mobile {
  @apply fixed bottom-0 left-0 right-0;
  @apply bg-white border-t-2 border-gray-200;
  @apply px-4 py-6 z-50;
  @apply shadow-2xl;
}
```

**Tablet Layout (768px - 1023px)**:
```css
.landing-widget-tablet {
  @apply grid grid-cols-2 gap-4 px-6;
  @apply max-w-4xl mx-auto;
}

.trip-detail-tablet {
  @apply grid grid-cols-3 gap-6;
  /* Booking card sticky in right column */
}
```

**Desktop Layout (1024px+)**:
```css
.landing-widget-desktop {
  @apply grid grid-cols-2 gap-6 px-8;
  @apply max-w-5xl mx-auto;
}

.trip-detail-desktop {
  @apply grid grid-cols-12 gap-8;
  /* Left: 8 cols (details), Right: 4 cols (booking card) */
}

.booking-card-desktop {
  @apply sticky top-24;
  @apply col-span-4;
}
```

### Interaction Patterns

**Button States:**
```typescript
interface ButtonStates {
  default: 'bg-blue-600 text-white hover:bg-blue-700 transition-colors';
  hover: 'bg-blue-700 transform scale-[1.02] shadow-lg';
  active: 'bg-blue-800 transform scale-[0.98]';
  loading: 'bg-blue-600 cursor-wait opacity-75';
  disabled: 'bg-gray-400 cursor-not-allowed opacity-50';
}
```

**Form Validation:**
```typescript
interface ValidationStates {
  valid: 'border-green-500 bg-green-50 focus:ring-green-500';
  error: 'border-red-500 bg-red-50 focus:ring-red-500';
  warning: 'border-amber-500 bg-amber-50 focus:ring-amber-500';
  normal: 'border-gray-300 bg-white focus:ring-blue-500';
}
```

**Countdown Timer Animation:**
```typescript
// Progressively urgent color changes
const timerColors = {
  safe: 'text-green-600',      // >10 minutes
  warning: 'text-amber-600',   // 5-10 minutes
  urgent: 'text-red-600',      // <5 minutes
  pulsing: 'animate-pulse',    // <2 minutes
};
```

## Technical Architecture

### Component Structure

```
src/app/
├── (landing)/
│   ├── page.tsx                      # Landing page
│   └── components/
│       ├── SearchWidget.tsx          # Main booking widget ⬜
│       ├── LocationInput.tsx         # Google Places autocomplete ⬜
│       ├── DateTimePicker.tsx        # Date/time selection ⬜
│       ├── PassengerSelector.tsx     # Passenger count (1-8) ⬜
│       └── FareCalculator.tsx        # Real-time fare display ⬜
├── trips/
│   └── [tripId]/
│       ├── page.tsx                  # Trip detail page
│       └── components/
│           ├── TripHero.tsx          # Trip header with images
│           ├── TripDetails.tsx       # Itinerary, description
│           └── BookingCard.tsx       # Sticky booking card ⬜
├── bookings/
│   ├── private/
│   │   └── [tripId]/
│   │       ├── page.tsx              # Private booking flow ⬜
│   │       └── components/
│   │           ├── BookingForm.tsx   # Main booking form ⬜
│   │           ├── PassengerDetails.tsx # Passenger info ⬜
│   │           └── PriceBreakdown.tsx # Fare breakdown ⬜
│   └── confirmation/
│       └── [bookingId]/
│           ├── page.tsx              # Confirmation screen ⬜
│           └── components/
│               ├── CountdownTimer.tsx # 15-min countdown ⬜
│               ├── BookingSummary.tsx # Booking details ⬜
│               └── PaymentButton.tsx  # Payment CTA ⬜
└── api/
    ├── bookings/
    │   ├── private/
    │   │   └── route.ts              # POST create private booking ⬜
    │   └── [bookingId]/
    │       └── route.ts              # GET booking details ⬜
    └── trips/
        └── calculate-fare/
            └── route.ts              # POST fare calculation ⬜
```

### State Management Architecture

**Global State (Zustand):**
```typescript
interface BookingStore {
  // Search State (Landing Page)
  searchParams: {
    origin: PlaceDetails | null;
    destination: PlaceDetails | null;
    departureDate: Date | null;
    passengers: number;
  };
  
  // Current Booking
  currentBooking: {
    bookingId: string | null;
    tripId: string | null;
    status: BookingStatus | null;
    expiresAt: Date | null;
  };
  
  // UI State
  isCalculatingFare: boolean;
  fareEstimate: FareCalculationResponse | null;
  
  // Actions
  setSearchParams: (params: Partial<SearchParams>) => void;
  calculateFare: (params: CalculateFareRequest) => Promise<FareCalculationResponse>;
  createPrivateBooking: (request: CreatePrivateBookingRequest) => Promise<CreatePrivateBookingResponse>;
  clearBooking: () => void;
}
```

**Local Component State:**
```typescript
// SearchWidget.tsx
interface SearchWidgetState {
  origin: PlaceDetails | null;
  destination: PlaceDetails | null;
  departureDate: Date | null;
  passengers: number;
  isLoadingFare: boolean;
  fareEstimate: FareCalculationResponse | null;
  validationErrors: Record<string, string>;
}

// BookingForm.tsx
interface BookingFormState {
  formData: {
    passengers: number;
    specialRequests: string;
    passengerDetails: PassengerInfo[];
  };
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

// CountdownTimer.tsx
interface CountdownState {
  timeRemaining: number; // milliseconds
  isExpired: boolean;
  urgencyLevel: 'safe' | 'warning' | 'urgent';
}
```

### API Integration Schema

**Type Definitions:**
```typescript
// Booking Types
enum BookingStatus {
  PENDING = 'PENDING',           // Created, awaiting payment
  CONFIRMED = 'CONFIRMED',       // Payment successful
  IN_PROGRESS = 'IN_PROGRESS',   // Trip started
  COMPLETED = 'COMPLETED',       // Trip finished
  CANCELLED = 'CANCELLED',       // User/admin cancelled
  EXPIRED = 'EXPIRED'            // Payment timeout
}

interface PassengerInfo {
  name: string;
  age?: number;
  email?: string;
  phone?: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// API Request/Response Types
interface CreatePrivateBookingDto {
  tripId: string;
  passengers: number;
  specialRequests?: string;
  origin?: PlaceDetails;      // For on-the-fly trips
  destination?: PlaceDetails;
  departureDate?: Date;
}

interface BookingResponseDto {
  bookingId: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  expiresAt: Date;
  paymentUrl: string;
  trip: TripSummaryDto;
}

interface TripSummaryDto {
  id: string;
  title: string;
  originName: string;
  destName: string;
  departureTime: Date;
  returnTime?: Date;
  totalSeats: number;
  basePrice: number;
  platformFee: number;
}
```

## Implementation Requirements

### Core Components

#### 1. SearchWidget.tsx ⬜
**Purpose**: Landing page search widget for initiating private bookings

**Features**:
- Location autocomplete (Google Places API)
- Date/time picker with validation
- Passenger count selector (1-8)
- Real-time fare calculation
- Responsive design (mobile-first)

**Props**:
```typescript
interface SearchWidgetProps {
  initialValues?: Partial<SearchParams>;
  onSubmit: (params: SearchParams) => void;
  className?: string;
}
```

#### 2. BookingCard.tsx ⬜
**Purpose**: Sticky booking card on trip detail pages

**Features**:
- Trip summary display
- Price breakdown
- Passenger selector
- Special requests textarea
- "Book Private Trip" CTA
- Loading/disabled states

**Props**:
```typescript
interface BookingCardProps {
  trip: TripDetails;
  onBook: (data: BookingFormData) => Promise<void>;
  isLoading?: boolean;
}
```

#### 3. BookingForm.tsx ⬜
**Purpose**: Main form for collecting booking details

**Features**:
- Form validation
- Passenger details collection
- Special requests
- Terms acceptance
- Error handling

#### 4. BookingSummary.tsx ⬜
**Purpose**: Confirmation screen booking summary

**Features**:
- Trip details display
- Price breakdown
- Booking reference
- Passenger list
- Payment CTA

#### 5. CountdownTimer.tsx ⬜
**Purpose**: 15-minute countdown for payment completion

**Features**:
- Live countdown display
- Color changes based on urgency
- Expiration warning
- Auto-redirect on expiration

### Custom Hooks

#### useBookingFlow() ⬜
**Purpose**: Manage entire booking flow state

```typescript
interface UseBookingFlowReturn {
  // State
  searchParams: SearchParams;
  fareEstimate: FareCalculationResponse | null;
  currentBooking: BookingResponseDto | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateSearchParams: (params: Partial<SearchParams>) => void;
  calculateFare: () => Promise<void>;
  createBooking: (data: BookingFormData) => Promise<void>;
  cancelBooking: () => Promise<void>;
  resetFlow: () => void;
}
```

#### useFareCalculation() ⬜
**Purpose**: Real-time fare calculation

```typescript
interface UseFareCalculationReturn {
  fareEstimate: FareCalculationResponse | null;
  isCalculating: boolean;
  error: string | null;
  calculate: (params: CalculateFareRequest) => Promise<void>;
}
```

#### useCountdown() ⬜
**Purpose**: Countdown timer logic

```typescript
interface UseCountdownReturn {
  timeRemaining: number;
  formattedTime: string;
  isExpired: boolean;
  urgencyLevel: 'safe' | 'warning' | 'urgent';
  restart: (duration: number) => void;
}
```

### Utility Functions

#### src/lib/booking/validators.ts ⬜
```typescript
export function validateBookingForm(data: BookingFormData): ValidationResult;
export function validateSearchParams(params: SearchParams): ValidationResult;
export function validatePassengerCount(count: number, maxSeats: number): boolean;
```

#### src/lib/booking/formatters.ts ⬜
```typescript
export function formatCurrency(amount: number, currency: string): string;
export function formatDuration(minutes: number): string;
export function formatBookingReference(bookingId: string): string;
export function formatCountdown(milliseconds: number): string;
```

#### src/lib/booking/calculations.ts ⬜
```typescript
export function calculateTotalFare(basePrice: number, platformFee: number): number;
export function calculatePlatformFee(basePrice: number, feePercentage: number): number;
export function calculateExpiryTime(createdAt: Date, minutes: number): Date;
```

## Acceptance Criteria

### Functional Requirements

#### 1. Landing Page Search Widget ⬜
- [x] Widget displays prominently on landing page above the fold
- [x] Origin/destination inputs use Google Places autocomplete
- [x] Only valid locations (with coordinates) can be selected
- [x] Date/time picker allows future dates only (min: today, max: +90 days)
- [x] Passenger selector shows 1-8 options with clear labels
- [x] "Calculate Fare" button triggers real-time calculation
- [x] Fare display shows breakdown (base + platform fee + total)
- [x] Error messages appear for invalid/incomplete inputs
- [x] Mobile responsive with single-column layout

#### 2. Trip Detail Page Booking ⬜
- [x] Booking card displays on right sidebar (desktop) or bottom (mobile)
- [x] Trip summary shows origin, destination, date, time
- [x] Price breakdown visible before booking
- [x] Passenger selector defaults to 1, max = trip capacity
- [x] Special requests textarea optional (max 500 chars)
- [x] "Book Private Trip" button prominent and clickable
- [x] Loading state during booking creation
- [x] Validation errors displayed inline

#### 3. Booking Creation ⬜
- [x] Authenticated users only can create bookings
- [x] System validates trip is bookable (status = PUBLISHED, seats available)
- [x] Booking reserves entire trip capacity (all seats)
- [x] Database transaction is atomic (prevents double-booking)
- [x] Booking enters PENDING status immediately
- [x] Expiry time set to 15 minutes from creation
- [x] Response includes booking ID and payment URL

#### 4. Confirmation Screen ⬜
- [x] Displays immediately after booking creation
- [x] Shows 15-minute countdown timer
- [x] Timer changes color: green (>10 min) → amber (5-10) → red (<5)
- [x] Booking summary includes all trip details
- [x] Price breakdown visible
- [x] Booking reference displayed prominently
- [x] "Proceed to Payment" button enabled and pulsing
- [x] "Cancel Booking" option available
- [x] Auto-redirect to home if timer expires

### Non-Functional Requirements

#### Performance ⬜
- [x] Search widget loads in <500ms
- [x] Fare calculation response <200ms
- [x] Booking creation response <1 second
- [x] Confirmation screen renders in <300ms
- [x] Countdown timer updates every second without lag

#### Accessibility ⬜
- [x] WCAG 2.1 AA compliance
- [x] All form inputs have labels
- [x] Error messages associated with inputs (aria-describedby)
- [x] Keyboard navigation fully functional
- [x] Screen reader announces countdown timer updates
- [x] Color contrast ratios meet 4.5:1 minimum

#### Security ⬜
- [x] All API endpoints require authentication
- [x] CSRF tokens on all forms
- [x] Input sanitization for special requests
- [x] SQL injection prevention (Prisma ORM)
- [x] Rate limiting (5 bookings per minute per user)

## Modified Files

```
src/
├── app/
│   ├── (landing)/
│   │   ├── page.tsx                                  ⬜
│   │   └── components/
│   │       ├── SearchWidget.tsx                      ⬜
│   │       ├── LocationInput.tsx                     ⬜
│   │       ├── DateTimePicker.tsx                    ⬜
│   │       ├── PassengerSelector.tsx                 ⬜
│   │       └── FareCalculator.tsx                    ⬜
│   ├── trips/
│   │   └── [tripId]/
│   │       ├── page.tsx                              ⬜
│   │       └── components/
│   │           └── BookingCard.tsx                   ⬜
│   ├── bookings/
│   │   ├── private/
│   │   │   └── [tripId]/
│   │   │       ├── page.tsx                          ⬜
│   │   │       └── components/
│   │   │           ├── BookingForm.tsx               ⬜
│   │   │           ├── PassengerDetails.tsx          ⬜
│   │   │           └── PriceBreakdown.tsx            ⬜
│   │   └── confirmation/
│   │       └── [bookingId]/
│   │           ├── page.tsx                          ⬜
│   │           └── components/
│   │               ├── CountdownTimer.tsx            ⬜
│   │               ├── BookingSummary.tsx            ⬜
│   │               └── PaymentButton.tsx             ⬜
│   └── api/
│       ├── bookings/
│       │   ├── private/
│       │   │   └── route.ts                          ⬜
│       │   └── [bookingId]/
│       │       └── route.ts                          ⬜
│       └── trips/
│           └── calculate-fare/
│               └── route.ts                          ⬜
├── lib/
│   ├── booking/
│   │   ├── validators.ts                             ⬜
│   │   ├── formatters.ts                             ⬜
│   │   ├── calculations.ts                           ⬜
│   │   └── api.ts                                    ⬜
│   └── hooks/
│       ├── useBookingFlow.ts                         ⬜
│       ├── useFareCalculation.ts                     ⬜
│       └── useCountdown.ts                           ⬜
├── types/
│   └── booking.ts                                    ⬜
└── store/
    └── booking-store.ts                              ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Foundation & Setup ⬜

#### 1.1 Type Definitions ⬜
- [ ] Create booking.ts with all interfaces
- [ ] Create API request/response types
- [ ] Create form data types
- [ ] Export types from central index

#### 1.2 Utility Functions ⬜
- [ ] Implement validators.ts
- [ ] Implement formatters.ts
- [ ] Implement calculations.ts
- [ ] Add unit tests for utilities

#### 1.3 API Routes Setup ⬜
- [ ] Implement POST /api/bookings/private
- [ ] Implement GET /api/bookings/[bookingId]
- [ ] Implement POST /api/trips/calculate-fare
- [ ] Add API error handling
- [ ] Add rate limiting middleware

### Phase 2: Core Components ⬜

#### 2.1 Landing Page Search ⬜
- [ ] Build SearchWidget.tsx
- [ ] Build LocationInput.tsx with Google Places
- [ ] Build DateTimePicker.tsx
- [ ] Build PassengerSelector.tsx
- [ ] Build FareCalculator.tsx
- [ ] Integrate with landing page

#### 2.2 Trip Detail Booking ⬜
- [ ] Build BookingCard.tsx
- [ ] Add to trip detail page
- [ ] Implement sticky behavior
- [ ] Add mobile bottom sheet variant

#### 2.3 Booking Flow ⬜
- [ ] Build BookingForm.tsx
- [ ] Build PassengerDetails.tsx
- [ ] Build PriceBreakdown.tsx
- [ ] Create booking flow page

### Phase 3: Confirmation & Payment ⬜

#### 3.1 Confirmation Screen ⬜
- [ ] Build BookingSummary.tsx
- [ ] Build CountdownTimer.tsx
- [ ] Build PaymentButton.tsx
- [ ] Create confirmation page
- [ ] Add expiration handling

#### 3.2 State Management ⬜
- [ ] Implement booking-store.ts (Zustand)
- [ ] Create useBookingFlow() hook
- [ ] Create useFareCalculation() hook
- [ ] Create useCountdown() hook

### Phase 4: Integration & Testing ⬜

#### 4.1 Database Integration ⬜
- [ ] Verify Booking model in Prisma schema
- [ ] Add database indexes for performance
- [ ] Test transaction atomicity
- [ ] Test row-level locking

#### 4.2 Google Places Integration ⬜
- [ ] Configure Google Places API key
- [ ] Implement autocomplete service
- [ ] Handle rate limits
- [ ] Add fallback for API failures

#### 4.3 End-to-End Testing ⬜
- [ ] Test landing page booking flow
- [ ] Test trip detail page booking
- [ ] Test on-the-fly trip creation
- [ ] Test countdown expiration
- [ ] Test mobile responsive design

## Dependencies

### Internal Dependencies
- **Authentication System**: Required for user identification
- **Trip Model**: Must have PUBLISHED trips available
- **Google Places API**: For location autocomplete
- **Design System**: shadcn/ui components

### External Dependencies
- **Google Places API**: Location search and autocomplete
- **Stripe**: Payment processing (Story 35 integration)
- **PostgreSQL**: Database with row-level locking support
- **Prisma ORM**: Database client

### Feature Dependencies
- **Story 35 (Payment)**: Payment completion after booking
- **Story 36 (Manage Bookings)**: View/cancel created bookings
- **Story 20-22 (Driver Portal)**: Driver acceptance after payment

## Risk Assessment

### Technical Risks

#### Risk 1: Google Places API Quota/Cost
- **Impact**: High (breaks autocomplete)
- **Likelihood**: Medium
- **Mitigation**: 
  - Implement request caching
  - Add manual address entry fallback
  - Set up quota monitoring
- **Contingency**: Allow manual text entry without autocomplete

#### Risk 2: Race Conditions in Booking Creation
- **Impact**: High (double-booking)
- **Likelihood**: Low (with proper locking)
- **Mitigation**:
  - Use database transactions with FOR UPDATE
  - Implement optimistic locking
  - Add booking creation tests
- **Contingency**: Cancel conflicting bookings with full refund

#### Risk 3: Countdown Timer Accuracy
- **Impact**: Medium (payment deadline issues)
- **Likelihood**: Low
- **Mitigation**:
  - Server-side expiration check
  - Client timer synchronized with server time
  - Grace period for payment completion
- **Contingency**: Manual admin review for edge cases

### Business Risks

#### Risk 1: Low Booking Conversion
- **Impact**: High (revenue impact)
- **Likelihood**: Medium
- **Mitigation**:
  - A/B test different CTA placements
  - Simplify booking steps
  - Add progress indicators
- **Contingency**: Implement abandoned booking recovery emails

#### Risk 2: Payment Integration Delays
- **Impact**: High (blocks feature launch)
- **Likelihood**: Low
- **Mitigation**:
  - Parallel development with Story 35
  - Mock payment flow for testing
  - Clear API contract definition
- **Contingency**: Launch with "Request Quote" flow initially

## Testing Strategy

### Unit Tests (Jest) ⬜

```typescript
describe('Booking Validators', () => {
  it('should validate complete booking form data', () => {
    const validData = {
      tripId: 'trip-123',
      passengers: 4,
      specialRequests: 'Need child seat'
    };
    expect(validateBookingForm(validData)).toEqual({ valid: true });
  });
  
  it('should reject passengers exceeding trip capacity', () => {
    const invalidData = { passengers: 10 };
    const result = validateBookingForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.passengers).toBeDefined();
  });
});

describe('Fare Calculations', () => {
  it('should calculate total fare correctly', () => {
    const basePrice = 100000;
    const platformFee = 10000;
    expect(calculateTotalFare(basePrice, platformFee)).toBe(110000);
  });
  
  it('should calculate platform fee percentage', () => {
    const basePrice = 100000;
    const feePercentage = 10;
    expect(calculatePlatformFee(basePrice, feePercentage)).toBe(10000);
  });
});
```

### Integration Tests (React Testing Library) ⬜

```typescript
describe('SearchWidget Integration', () => {
  it('should calculate fare when all fields valid', async () => {
    render(<SearchWidget onSubmit={jest.fn()} />);
    
    // Fill origin
    const originInput = screen.getByLabelText(/origin/i);
    userEvent.type(originInput, 'Almaty');
    await waitFor(() => {
      userEvent.click(screen.getByText(/almaty international/i));
    });
    
    // Fill destination
    const destInput = screen.getByLabelText(/destination/i);
    userEvent.type(destInput, 'Charyn');
    await waitFor(() => {
      userEvent.click(screen.getByText(/charyn canyon/i));
    });
    
    // Select date
    const dateInput = screen.getByLabelText(/departure date/i);
    userEvent.click(dateInput);
    // Select tomorrow's date
    
    // Select passengers
    const passengerSelect = screen.getByLabelText(/passengers/i);
    userEvent.selectOptions(passengerSelect, '4');
    
    // Calculate
    const calculateBtn = screen.getByRole('button', { name: /calculate fare/i });
    userEvent.click(calculateBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/total fare/i)).toBeInTheDocument();
      expect(screen.getByText(/₸/)).toBeInTheDocument();
    });
  });
});

describe('Booking Flow Integration', () => {
  it('should create booking and show confirmation', async () => {
    const mockTrip = {
      id: 'trip-123',
      title: 'Almaty to Charyn',
      basePrice: 100000
    };
    
    render(<BookingCard trip={mockTrip} onBook={jest.fn()} />);
    
    // Fill form
    const passengersSelect = screen.getByLabelText(/passengers/i);
    userEvent.selectOptions(passengersSelect, '3');
    
    const specialRequests = screen.getByLabelText(/special requests/i);
    userEvent.type(specialRequests, 'Need baby seat');
    
    // Submit
    const bookButton = screen.getByRole('button', { name: /book private trip/i });
    userEvent.click(bookButton);
    
    await waitFor(() => {
      expect(screen.getByText(/booking reserved/i)).toBeInTheDocument();
      expect(screen.getByText(/complete payment/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Playwright) ⬜

```typescript
test.describe('Private Booking E2E', () => {
  test('complete booking flow from landing page', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
    
    // Fill search widget
    await page.fill('[data-testid="origin-input"]', 'Almaty Airport');
    await page.click('[data-testid="place-Almaty-Airport"]');
    
    await page.fill('[data-testid="destination-input"]', 'Charyn Canyon');
    await page.click('[data-testid="place-Charyn-Canyon"]');
    
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-testid="date-tomorrow"]');
    
    await page.selectOption('[data-testid="passengers-select"]', '4');
    
    // Calculate fare
    await page.click('[data-testid="calculate-fare-btn"]');
    
    // Wait for fare calculation
    await expect(page.locator('[data-testid="fare-total"]')).toBeVisible();
    
    // Proceed to booking
    await page.click('[data-testid="book-now-btn"]');
    
    // Confirm booking
    await page.fill('[data-testid="special-requests"]', 'Window seats preferred');
    await page.click('[data-testid="confirm-booking-btn"]');
    
    // Verify confirmation page
    await expect(page.locator('[data-testid="booking-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="countdown-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toBeVisible();
  });
  
  test('booking from trip detail page', async ({ page }) => {
    await page.goto('/trips/trip-available-123');
    
    // Wait for booking card
    await expect(page.locator('[data-testid="booking-card"]')).toBeVisible();
    
    // Select passengers
    await page.selectOption('[data-testid="passengers-select"]', '2');
    
    // Add special request
    await page.fill('[data-testid="special-requests"]', 'Extra luggage');
    
    // Book
    await page.click('[data-testid="book-private-btn"]');
    
    // Verify confirmation
    await expect(page.locator('[data-testid="booking-confirmed"]')).toBeVisible();
    await expect(page).toHaveURL(/\/bookings\/confirmation\/bkg-/);
  });
  
  test('countdown timer expires and redirects', async ({ page }) => {
    // Create booking
    await page.goto('/bookings/confirmation/bkg-expired-test');
    
    // Mock server time to make booking expired
    await page.route('**/api/bookings/*', (route) => {
      route.fulfill({
        json: {
          ...mockBooking,
          expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
        }
      });
    });
    
    await page.reload();
    
    // Should show expiration message
    await expect(page.locator('[data-testid="booking-expired"]')).toBeVisible();
    
    // Should redirect after 5 seconds
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL('/');
  });
});
```

## Performance Considerations

### Bundle Optimization ⬜
- [ ] Code split booking flow components
- [ ] Lazy load Google Places API
- [ ] Optimize countdown timer re-renders
- [ ] Tree shake unused lodash utilities

### Runtime Performance ⬜
- [ ] Memoize fare calculations with useMemo
- [ ] Debounce location autocomplete (300ms)
- [ ] Virtualize passenger list if >10 passengers
- [ ] Optimize countdown updates (1 second interval)

### Caching Strategy ⬜
- [ ] Cache Google Places responses (1 hour)
- [ ] Cache trip details on client (5 minutes)
- [ ] Use SWR for booking status checks
- [ ] Implement optimistic UI updates

### Database Optimization ⬜
- [ ] Add index on `bookings.userId`
- [ ] Add index on `bookings.tripId`
- [ ] Add index on `bookings.status`
- [ ] Add index on `bookings.expiresAt` for cleanup jobs

## Deployment Plan

### Development Phase ⬜
- [ ] Feature flag: `ENABLE_PRIVATE_BOOKING` = false
- [ ] Test in development environment
- [ ] Internal team testing
- [ ] Fix critical bugs

### Staging Phase ⬜
- [ ] Deploy to staging environment
- [ ] Feature flag: `ENABLE_PRIVATE_BOOKING` = true (staging only)
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security audit

### Production Phase ⬜
- [ ] Deploy to production (feature flag OFF)
- [ ] Canary release: Enable for 5% of users
- [ ] Monitor metrics for 24 hours
- [ ] Gradual rollout: 25% → 50% → 100%
- [ ] Full release after 3 days

## Monitoring & Analytics

### Performance Metrics ⬜
- [ ] Track search widget load time (target: <500ms)
- [ ] Track fare calculation time (target: <200ms)
- [ ] Track booking creation time (target: <1s)
- [ ] Track countdown timer accuracy

### Business Metrics ⬜
- [ ] Booking initiated count
- [ ] Booking completion rate (target: >80%)
- [ ] Payment completion rate (from Story 35)
- [ ] Average booking value
- [ ] Time to booking completion

### Technical Metrics ⬜
- [ ] API error rates (target: <1%)
- [ ] Database query performance
- [ ] Double-booking incidents (target: 0)
- [ ] Timeout expiration rate

### Analytics Events ⬜
```typescript
// PostHog/Amplitude Events
trackEvent('booking_search_started', {
  origin: string,
  destination: string,
  passengers: number
});

trackEvent('fare_calculated', {
  baseFare: number,
  totalFare: number,
  passengers: number
});

trackEvent('booking_created', {
  bookingId: string,
  tripId: string,
  totalAmount: number,
  passengers: number
});

trackEvent('booking_confirmed', {
  bookingId: string,
  timeToComplete: number // milliseconds
});

trackEvent('booking_expired', {
  bookingId: string,
  timeRemaining: number
});
```

## Documentation Requirements

### Technical Documentation ⬜
- [ ] API endpoint documentation (Swagger/OpenAPI)
- [ ] Component usage examples (Storybook)
- [ ] Database schema updates
- [ ] Troubleshooting guide

### User Documentation ⬜
- [ ] "How to book a private trip" guide
- [ ] FAQ section
- [ ] Video tutorial (2-3 minutes)
- [ ] Email templates for notifications

## Post-Launch Review

### Success Criteria ⬜
- [ ] Booking completion rate >80%
- [ ] Payment success rate >90% (Story 35)
- [ ] Double-booking incidents = 0
- [ ] Average booking time <3 minutes
- [ ] User satisfaction score >4.5/5

### Retrospective Items ⬜
- [ ] What worked well?
- [ ] What can be improved?
- [ ] Technical debt identified
- [ ] Process improvements for Story 34

### Next Steps ⬜
- [ ] Implement Story 34 (Shared Ride Booking)
- [ ] Implement Story 35 (Payment Integration)
- [ ] Add booking analytics dashboard
- [ ] Optimize conversion funnel

---

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 2-3 weeks (1 developer)
