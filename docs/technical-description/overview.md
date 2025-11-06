# StepperGO Technical Description

## Application Overview
StepperGO is a dual-booking city-to-city ride and tour platform for Central Asia (Kazakhstan & Kyrgyzstan) built with modern web technologies. The platform enables travelers to book either private (whole vehicle) or shared (per-seat) trips with professional drivers, while providing a comprehensive admin console for trip approval and driver management.

**Core Innovation:** Private vs Shared Booking Model
- **Private Booking:** Entire vehicle reservation with seat locking
- **Shared Booking:** Per-seat booking with 10-minute soft hold and capacity enforcement
- **Lean Authentication:** OTP-based (SMS/Email) registration without passwords
- **Driver Portal:** Atomic booking acceptance with geofilter (50km radius)
- **Admin Approval:** All trips require admin approval before going live
- **Analytics:** PostHog funnel tracking for conversion optimization

**Key Features:**
- ✅ Real-time trip urgency tracking with color-coded countdown badges
- ✅ Comprehensive trip itinerary builder with day-by-day activities
- ✅ Location search with 40+ famous Kazakhstan/Kyrgyzstan locations
- ✅ Dynamic per-seat pricing with occupancy-based discounts
- ✅ Stripe Checkout integration with 3D Secure (SCA compliant)
- ✅ Platform fee system (15% default, admin-configurable)
- ✅ OTP verification (60s delivery SLA, 3-attempt throttle)
- ✅ Atomic concurrency locking (prevents double-booking)
- ✅ PostGIS geofilter for drivers (50km default radius)
- ✅ Driver document management with expiry alerts
- ✅ Cancellation policies with automated Stripe refunds

## Technology Stack

### Frontend
- **Framework**: Next.js 14.2.33 (App Router, Server Components)
- **Language**: TypeScript 5.6 (strict mode)
- **UI Libraries**: 
  - React 18
  - TailwindCSS 3.4
  - shadcn/ui (Radix UI primitives)
  - Lucide React (icons)
- **State Management**: 
  - React Query (@tanstack/react-query) for server state
  - Zustand for client state
- **Form Management**: 
  - React Hook Form 7.x
  - Zod 3.x for schema validation
- **Data Fetching**: Next.js Server Components + API Routes
- **PWA**: 
  - next-pwa 5.6.0
  - Service Worker for offline support
  - Web Push API for notifications
  - Background Sync API

### Backend & Database
- **Database**: Supabase PostgreSQL (Asia Pacific - Singapore)
- **ORM**: Prisma 6.18.0
- **Extensions**: PostGIS (for geofilter queries)
- **Authentication**: JWT tokens (24-hour expiry)
- **API Style**: RESTful (Next.js API Routes)

### External Services
- **Payments**: Stripe Checkout + Webhooks (14.x)
- **SMS OTP**: Twilio
- **Email OTP**: Resend
- **Analytics**: PostHog (client + server-side tracking)
- **Geocoding**: Mapbox API
- **File Storage**: Supabase Storage (driver documents)

### Infrastructure
- **Hosting**: Vercel (frontend + API routes)
- **Database**: Supabase managed PostgreSQL
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + PostHog
- **Error Tracking**: TBD (Sentry recommended)

## Project Folder Structure

```
STEPPERGO/
├── src/
│   ├── app/                    # Next.js 14 app directory
│   │   ├── (public)/          # Public routes (no auth)
│   │   │   ├── trips/         # Trip browsing & details
│   │   │   │   ├── components/
│   │   │   │   │   ├── TripCard.tsx
│   │   │   │   │   ├── CountdownBadge.tsx
│   │   │   │   │   ├── pricing/
│   │   │   │   │   │   ├── PricingDisplay.tsx
│   │   │   │   │   │   ├── PriceBadge.tsx
│   │   │   │   │   │   ├── SavingsIndicator.tsx
│   │   │   │   │   │   └── PricingBreakdownModal.tsx
│   │   │   │   ├── [id]/     # Trip detail page
│   │   │   │   └── page.tsx  # Trip listing (Epic A.1)
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── verify/        # OTP verification (Epic B.1)
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   │       ├── OTPInput.tsx
│   │   │   │       ├── ContactInput.tsx
│   │   │   │       └── ResendTimer.tsx
│   │   │   └── driver-login/  # Driver authentication (Epic D.1)
│   │   ├── bookings/          # Booking flows
│   │   │   ├── private/       # Private booking (Epic B.2)
│   │   │   │   └── [tripId]/page.tsx
│   │   │   └── shared/        # Shared booking (Epic B.3)
│   │   │       └── [tripId]/
│   │   │           ├── page.tsx
│   │   │           └── components/
│   │   │               ├── SeatSelector.tsx
│   │   │               ├── SoftHoldTimer.tsx
│   │   │               └── CapacityIndicator.tsx
│   │   ├── checkout/          # Stripe Checkout (Epic C.1)
│   │   │   └── [bookingId]/
│   │   │       ├── page.tsx
│   │   │       ├── success/page.tsx
│   │   │       └── cancelled/page.tsx
│   │   ├── driver/            # Driver Portal
│   │   │   ├── dashboard/     # Driver queue (Epic D.2)
│   │   │   ├── trips/         # Geofiltered trips (Epic D.4)
│   │   │   └── complete/      # Mark complete (Epic D.3)
│   │   ├── admin/             # Admin Console
│   │   │   ├── trips/         # Trip approval (Epic E.1)
│   │   │   ├── drivers/       # Driver management (Epic E.2)
│   │   │   ├── create-trip/   # Create trip (Epic E.3)
│   │   │   ├── payments/      # Platform fees (Epic C.2)
│   │   │   └── analytics/     # Funnel dashboard (Epic F.2)
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   │   ├── send-otp/route.ts
│   │   │   │   ├── verify-otp/route.ts
│   │   │   │   └── driver-login/route.ts
│   │   │   ├── bookings/
│   │   │   │   ├── private/route.ts
│   │   │   │   ├── shared/route.ts
│   │   │   │   └── cancel/route.ts
│   │   │   ├── checkout/
│   │   │   │   └── create-session/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/route.ts
│   │   │   ├── driver/
│   │   │   │   ├── accept-booking/route.ts
│   │   │   │   ├── decline-booking/route.ts
│   │   │   │   ├── complete-trip/route.ts
│   │   │   │   └── trips/route.ts
│   │   │   └── admin/
│   │   │       ├── trips/approve/route.ts
│   │   │       ├── drivers/create/route.ts
│   │   │       └── settings/fees/route.ts
│   │   ├── components/        # Shared components
│   │   ├── lib/              # Utility functions
│   │   │   ├── otp-service.ts
│   │   │   ├── stripe-service.ts
│   │   │   ├── prisma.ts
│   │   │   ├── posthog.ts
│   │   │   ├── locations/
│   │   │   │   └── famous-locations.ts  # 40+ locations
│   │   │   └── pricing/
│   │   │       ├── calculations.ts
│   │   │       └── formatters.ts
│   │   └── styles/           # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── common/           # Basic UI elements (shadcn/ui)
│   │   ├── forms/            # Form-related components
│   │   └── layouts/          # Layout components
│   ├── hooks/                # Custom React hooks
│   │   └── useCountdown.ts
│   ├── types/                # TypeScript type definitions
│   │   └── pricing-types.ts
│   └── utils/                # Utility functions
│       └── time-formatters.ts
├── prisma/
│   ├── schema.prisma         # Complete database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts              # Seed data script
├── tests/                    # Test files
│   ├── unit/                # Unit tests (Vitest)
│   ├── integration/         # Integration tests
│   └── e2e/                 # E2E tests (Playwright)
├── docs/
│   ├── stories/             # User stories (22+ files)
│   ├── implementation-plans/ # Technical specs
│   └── technical-description/ # This document
└── public/                   # Static assets
    ├── images/
    └── fonts/
```

## Data Models

### User Model (UPDATED - Epic B.1, D.1)
```prisma
model User {
  id              String    @id @default(uuid())
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  // Profile
  name            String
  email           String?   @unique
  phone           String?   @unique
  
  // Role-based access
  role            Role      @default(TRAVELLER)
  
  // OTP Authentication (Epic B.1)
  otp_code        String?
  otp_expires_at  DateTime?
  otp_verified_at DateTime?
  otp_attempts    Int       @default(0)
  otp_locked_until DateTime?
  
  // Driver Authentication (Epic D.1)
  password_hash   String?
  force_password_change Boolean @default(false)
  
  // Account Status
  status          UserStatus @default(ACTIVE)
  
  // Relations
  bookings        Booking[]
  driver_profile  Driver?
  
  @@index([email])
  @@index([phone])
  @@index([role])
}

enum Role {
  TRAVELLER  // Can browse & book trips
  DRIVER     // Can accept/decline bookings
  ADMIN      // Full access (trip approval, driver mgmt)
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

### Driver Model (NEW - Epic D)
```prisma
model Driver {
  id                String   @id @default(uuid())
  user_id           String   @unique
  user              User     @relation(fields: [user_id], references: [id])
  
  // Vehicle Information
  vehicle_type      VehicleType
  vehicle_make      String
  vehicle_model     String
  vehicle_year      Int
  license_plate     String   @unique
  seat_capacity     Int
  
  // Documents (stored in Supabase Storage)
  license_no        String   @unique
  license_expiry    DateTime
  license_doc_url   String?
  insurance_doc_url String?
  vehicle_reg_url   String?
  
  // Geofilter (Epic D.4)
  home_location     Unsupported("geography(Point,4326)")?
  home_city         String
  default_radius_km Int      @default(50)
  
  // Status
  status            DriverStatus @default(PENDING)
  approved_at       DateTime?
  approved_by       String?
  rejection_reason  String?
  
  // Performance
  rating            Decimal  @default(0) @db.Decimal(3, 2)
  completed_trips   Int      @default(0)
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  // Relations
  assignments       DriverAssignment[]
  
  @@index([status])
  @@index([home_city])
}

enum DriverStatus {
  PENDING    // Awaiting admin approval
  APPROVED   // Active driver
  SUSPENDED  // Temporarily suspended
  REJECTED   // Application rejected
}

enum VehicleType {
  SEDAN      // 4 seats
  SUV        // 6-7 seats
  VAN        // 8-12 seats
  BUS        // 13+ seats
}
```

### Trip Model (UPDATED - Epic A, E)
```prisma
model Trip {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Basic Info
  title           String
  description     String
  departure_time  DateTime
  return_time     DateTime?
  timezone        String   @default("Asia/Almaty")
  
  // Locations (PostGIS for geofilter)
  origin_city     String
  origin_location Unsupported("geography(Point,4326)")
  destination_city String
  destination_location Unsupported("geography(Point,4326)")
  distance_km     Int
  
  // Trip Type (Epic B.2, B.3)
  is_private      Boolean  @default(false)
  
  // Capacity
  total_seats     Int
  occupied_seats  Int      @default(0)
  
  // Pricing (Epic G.2)
  base_price_per_seat Decimal @db.Decimal(10, 2)
  currency        String   @default("KZT")
  
  // Itinerary
  itinerary       Json?    // ItineraryDay[]
  
  // Status Workflow (Epic E.1)
  status          TripStatus @default(DRAFT)
  reviewed_by     String?
  reviewed_at     DateTime?
  rejection_reason String?
  published_at    DateTime?
  
  // Relations
  bookings        Booking[]
  driver_assignment DriverAssignment?
  audit_logs      TripAuditLog[]
  
  @@index([status])
  @@index([departure_time])
  @@index([origin_city, destination_city])
  @@index([is_private])
}

enum TripStatus {
  DRAFT      // Created by admin, not yet submitted
  PENDING    // Awaiting admin approval
  APPROVED   // Approved, live for booking
  REJECTED   // Admin rejected
  LIVE       // Currently accepting bookings
  COMPLETED  // Trip finished
  CANCELLED  // Trip cancelled
}

interface ItineraryDay {
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
}

interface Activity {
  id: string;
  startTime: string;
  endTime?: string;
  location: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  type: 'TRANSPORT' | 'ACCOMMODATION' | 'ACTIVITY' | 'MEAL' | 'FREE_TIME';
  description: string;
  notes?: string;
}
```

### Booking Model (UPDATED - Epic B, C, G)
```prisma
model Booking {
  id              String   @id @default(uuid())
  trip_id         String
  trip            Trip     @relation(fields: [trip_id], references: [id])
  user_id         String
  user            User     @relation(fields: [user_id], references: [id])
  
  // Booking Type (Epic B.2, B.3)
  type            BookingType
  seats_booked    Int
  
  // Soft Hold (Epic B.3)
  hold_expires_at DateTime?
  
  // Pricing
  price_per_seat  Decimal  @db.Decimal(10, 2)
  total_amount    Decimal  @db.Decimal(10, 2)
  platform_fee_pct Decimal @db.Decimal(5, 2)
  platform_fee_amount Decimal @db.Decimal(10, 2)
  driver_payout   Decimal  @db.Decimal(10, 2)
  currency        String   @default("KZT")
  
  // Status
  status          BookingStatus @default(PENDING)
  
  // Payment (Epic C.1)
  payment_id      String?
  payment         Payment?
  
  // Cancellation (Epic G.1)
  cancelled_at    DateTime?
  cancellation_reason String?
  refund_amount   Decimal? @db.Decimal(10, 2)
  refund_processed_at DateTime?
  
  // Metadata
  notes           String?
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@index([trip_id])
  @@index([user_id])
  @@index([status])
  @@index([hold_expires_at])
}

enum BookingType {
  PRIVATE  // Whole vehicle (Epic B.2)
  SHARED   // Per-seat (Epic B.3)
}

enum BookingStatus {
  PENDING           // Created, awaiting payment
  HELD              // Soft hold (10 min) for shared booking
  PAID              // Payment successful, awaiting driver
  DRIVER_ACCEPTED   // Driver accepted (Epic D.2)
  DRIVER_DECLINED   // Driver declined
  COMPLETED         // Trip completed (Epic D.3)
  CANCELLED         // User cancelled (Epic G.1)
  EXPIRED           // Hold expired
  REFUNDED          // Payment refunded
}
```

### Payment Model (NEW - Epic C)
```prisma
model Payment {
  id              String   @id @default(uuid())
  booking_id      String   @unique
  booking         Booking  @relation(fields: [booking_id], references: [id])
  
  // Stripe Integration
  stripe_payment_intent_id String @unique
  stripe_session_id String?
  
  // Amounts
  amount          Decimal  @db.Decimal(10, 2)
  currency        String
  platform_fee_pct Decimal @db.Decimal(5, 2)
  platform_fee_amount Decimal @db.Decimal(10, 2)
  driver_payout   Decimal  @db.Decimal(10, 2)
  
  // Status
  status          PaymentStatus @default(PENDING)
  
  // Refund (Epic G.1)
  refunded_amount Decimal? @db.Decimal(10, 2)
  refunded_at     DateTime?
  stripe_refund_id String?
  
  // Metadata
  payment_method  String?
  receipt_url     String?
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@index([stripe_payment_intent_id])
  @@index([status])
}

enum PaymentStatus {
  PENDING    // Awaiting payment
  COMPLETED  // Successfully paid
  FAILED     // Payment failed
  REFUNDED   // Fully refunded
  PARTIALLY_REFUNDED // Partial refund (cancellation fees)
}
```

### DriverAssignment Model (NEW - Epic D.2)
```prisma
model DriverAssignment {
  id              String   @id @default(uuid())
  trip_id         String   @unique
  trip            Trip     @relation(fields: [trip_id], references: [id])
  driver_id       String
  driver          Driver   @relation(fields: [driver_id], references: [id])
  
  // Atomic Locking
  status          AssignmentStatus @default(PENDING)
  accepted_at     DateTime?
  declined_at     DateTime?
  decline_reason  String?
  
  created_at      DateTime @default(now())
  
  @@index([driver_id])
  @@index([trip_id])
}

enum AssignmentStatus {
  PENDING   // Trip assigned, awaiting driver response
  ACCEPTED  // Driver accepted
  DECLINED  // Driver declined
}
```

### TripAuditLog Model (NEW - Epic E.1)
```prisma
model TripAuditLog {
  id         String   @id @default(uuid())
  trip_id    String
  trip       Trip     @relation(fields: [trip_id], references: [id])
  
  action     String   // CREATED, SUBMITTED, APPROVED, REJECTED, CANCELLED
  actor_id   String   // Admin user ID
  old_status TripStatus?
  new_status TripStatus?
  notes      String?
  
  created_at DateTime @default(now())
  
  @@index([trip_id])
  @@index([created_at])
}
```

### PlatformSettings Model (NEW - Epic C.2)
```prisma
model PlatformSettings {
  id              String   @id @default(uuid())
  
  // Platform Fee (Epic C.2)
  platform_fee_pct Decimal @default(15) @db.Decimal(5, 2)
  
  // Cancellation Policy (Epic G.1)
  full_refund_hours Int    @default(48)
  no_refund_hours   Int    @default(24)
  
  updated_at      DateTime @updatedAt
  updated_by      String   // Admin user ID
}
```

## API Endpoint Specification

### Authentication & OTP (Epic B.1)
- `POST /api/auth/send-otp` - Send OTP via SMS/email
  - Request: `{ contact: string, channel: 'sms' | 'email', name?: string }`
  - Response: `{ success: boolean, otp_token: string, retry_after?: number }`
  - Rate Limit: 5 requests/hour per contact
  
- `POST /api/auth/verify-otp` - Verify OTP code
  - Request: `{ otp_token: string, otp_code: string }`
  - Response: `{ success: boolean, access_token?: string, user?: User }`
  - 3-attempt throttle → 5-minute lockout
  
- `POST /api/auth/driver-login` - Driver authentication (Epic D.1)
  - Request: `{ email: string, password: string }`
  - Response: `{ access_token: string, user: User, force_password_change: boolean }`

### Trip Management (Epic A, E)
- `GET /api/trips` - List all approved trips (public)
  - Query: `?origin_city, destination_city, departure_date, is_private`
  - Response: `{ trips: Trip[], total: number }`
  - Filters: Only `status=APPROVED`, sorted by `departure_time ASC`
  
- `GET /api/trips/{id}` - Get trip details (Epic A.2)
  - Response: `{ trip: Trip, driver: Driver, available_seats: number }`
  
- `POST /api/trips` - Create trip (Admin only - Epic E.3)
  - Request: `{ title, description, departure_time, origin, destination, itinerary, ... }`
  - Response: `{ trip_id: string, status: 'DRAFT' }`
  
- `PUT /api/trips/{id}` - Update trip (Admin only)
  - Request: Partial trip data
  - Response: `{ trip: Trip }`
  
- `DELETE /api/trips/{id}` - Cancel trip (Admin only)
  - Response: `{ success: boolean, cancelled_bookings: number }`

### Booking & Payments (Epic B, C)
- `POST /api/bookings/private` - Create private booking (Epic B.2)
  - Request: `{ trip_id: string, notes?: string }`
  - Response: `{ booking_id: string, total_amount: number, next_step: 'payment' }`
  - Locks all seats, sets `is_private=true` on trip
  
- `POST /api/bookings/shared` - Create shared booking (Epic B.3)
  - Request: `{ trip_id: string, seats: number }`
  - Response: `{ booking_id: string, hold_expires_at: DateTime, payment_url: string }`
  - 10-minute soft hold, atomic capacity check
  
- `POST /api/bookings/cancel` - Cancel booking (Epic G.1)
  - Request: `{ booking_id: string, reason?: string }`
  - Response: `{ refund_amount: number, refund_pct: number }`
  - Refund calculation based on hours until departure
  
- `GET /api/bookings/{id}` - Get booking details
  - Response: `{ booking: Booking, trip: Trip, payment: Payment }`

### Stripe Integration (Epic C.1, C.2)
- `POST /api/checkout/create-session` - Create Stripe Checkout
  - Request: `{ booking_id: string }`
  - Response: `{ session_id: string, session_url: string }`
  - Includes platform fee calculation
  
- `POST /api/webhooks/stripe` - Stripe webhook handler
  - Events: `checkout.session.completed`, `payment_intent.succeeded`
  - Updates booking status → `PAID`
  - Creates payment record
  - Notifies driver of new booking
  
- `GET /api/payments/{id}/status` - Check payment status
  - Response: `{ status: PaymentStatus, receipt_url?: string }`

### Driver Portal (Epic D)
- `GET /api/driver/trips` - Get geofiltered trips (Epic D.4)
  - Query: `?radius_km=50` (default)
  - Response: `{ trips: Trip[], distances: number[] }`
  - PostGIS query: 50km radius from driver home_location
  
- `POST /api/driver/accept-booking` - Accept booking (Epic D.2)
  - Request: `{ trip_id: string }`
  - Response: `{ success: boolean, assignment_id: string }`
  - Atomic transaction with PostgreSQL row lock
  
- `POST /api/driver/decline-booking` - Decline booking (Epic D.2)
  - Request: `{ trip_id: string, reason?: string }`
  - Response: `{ success: boolean }`
  
- `POST /api/driver/complete-trip` - Mark trip complete (Epic D.3)
  - Request: `{ trip_id: string }`
  - Response: `{ success: boolean, payout_amount: number }`
  - Triggers traveler review prompt via email/SMS

### Admin Console (Epic E)
- `POST /api/admin/trips/approve` - Approve/reject trip (Epic E.1)
  - Request: `{ trip_id: string, action: 'approve' | 'reject', notes?: string }`
  - Response: `{ trip: Trip, audit_log_id: string }`
  - Creates audit log entry
  
- `POST /api/admin/drivers/create` - Add new driver (Epic E.2)
  - Request: `{ user_data: {...}, driver_data: {...}, documents: File[] }`
  - Response: `{ driver_id: string, temp_password: string }`
  - Uploads documents to Supabase Storage
  
- `PUT /api/admin/drivers/{id}` - Update driver (Epic E.2)
  - Request: Partial driver data
  - Response: `{ driver: Driver }`
  
- `POST /api/admin/drivers/{id}/suspend` - Suspend driver
  - Response: `{ success: boolean, cancelled_assignments: number }`
  
- `GET /api/admin/payments` - View payment ledger (Epic C.2)
  - Query: `?from_date, to_date, driver_id`
  - Response: `{ payments: Payment[], total_revenue: number, platform_fees: number }`
  - CSV export available
  
- `POST /api/admin/settings/fees` - Update platform fee (Epic C.2)
  - Request: `{ platform_fee_pct: number }`
  - Response: `{ settings: PlatformSettings }`

### Location Services (Epic A.3)
- `GET /api/locations/search` - Search famous locations
  - Query: `?q=Almaty&type=CITY|LANDMARK`
  - Response: `{ locations: FamousLocation[], total: number }`
  - 40+ Kazakhstan/Kyrgyzstan locations
  
- `GET /api/locations/autocomplete` - Location autocomplete (Epic A.3)
  - Query: `?q=Iss`
  - Response: `{ suggestions: Location[] }`
  - Searches famous locations + Mapbox API
  
- `GET /api/locations/distance` - Calculate distance
  - Query: `?from_lat, from_lng, to_lat, to_lng`
  - Response: `{ distance_km: number, duration_hours: number }`

### Analytics (Epic F)
- Client-side: PostHog SDK auto-captures page views, clicks
- Server-side events tracked:
  - `booking_created` (type, seats, amount)
  - `payment_succeeded` (amount, platform_fee)
  - `driver_accepted` (time_to_accept)
  - `trip_completed` (rating, payout)
  - `otp_verified_success/failed`
  - `hold_expired`

## Frontend Component Hierarchy

```
App
├── Layout
│   ├── Navbar (with role-based menu)
│   ├── Sidebar (Admin/Driver only)
│   └── Footer
├── Public Pages (No Auth Required)
│   ├── Home (Landing Page - FlixBus-inspired Design)
│   │   ├── HeroSection
│   │   │   ├── HeroImage (scenic Car on highway - Turquoise gradient overlay)
│   │   │   ├── SearchWidget
│   │   │   │   ├── PrivateShareToggle (radio buttons: Private | Share)
│   │   │   │   ├── LocationInputs
│   │   │   │   │   ├── FromInput (with location icon, autocomplete)
│   │   │   │   │   ├── SwapButton (arrow icon between inputs)
│   │   │   │   │   └── ToInput (with location icon, autocomplete)
│   │   │   │   ├── DepartureDatePicker (calendar icon, today default)
│   │   │   │   ├── PassengerSelector (dropdown: "1 Adult" default)
│   │   │   │   └── SearchButton (Gold, full-width)
│   │   │   └── TagLine ("Easy travel")
│   │   └── FeaturedTrips
│   ├── TripList (Epic A.1)
│   │   ├── TripFilters (origin, destination, date)
│   │   └── TripCard
│   │       ├── CountdownBadge (color-coded urgency)
│   │       ├── PricingDisplay
│   │       │   ├── PriceBadge
│   │       │   ├── SavingsIndicator
│   │       │   └── SeatCounter
│   │       └── BookButton
│   └── TripDetail (Epic A.2)
│       ├── TripHeader (title, dates, driver rating)
│       ├── ItineraryView (day-by-day activities)
│       ├── PricingBreakdownModal
│       ├── VehicleDetails
│       └── BookingCTAs (Private/Shared buttons)
├── Authentication (Epic B.1)
│   ├── OTPVerification
│   │   ├── ContactInput (phone/email selector)
│   │   ├── OTPInput (6-digit)
│   │   ├── ResendTimer (30s countdown)
│   │   └── FallbackChannel (email if SMS fails)
│   └── DriverLogin (Epic D.1)
│       ├── PasswordInput
│       └── ForcePasswordChange
├── Booking Flows (Epic B.2, B.3)
│   ├── PrivateBooking
│   │   ├── VehicleDetails
│   │   ├── PriceEstimate
│   │   └── BookingForm
│   ├── SharedBooking
│   │   ├── SeatSelector (1-4 seats)
│   │   ├── SoftHoldTimer (10-min countdown)
│   │   ├── CapacityIndicator
│   │   └── PriceCalculator (dynamic)
│   └── Checkout (Epic C.1)
│       ├── StripeCheckout
│       ├── PriceSummary (with platform fee)
│       ├── BookingRecap
│       └── PaymentResult (success/cancelled)
├── Driver Portal (Epic D)
│   ├── DriverDashboard
│   │   ├── BookingQueue (pending acceptance)
│   │   ├── AcceptDeclineButtons (Epic D.2)
│   │   └── EarningsDisplay
│   ├── TripsGeofiltered (Epic D.4)
│   │   ├── RadiusToggle (50km / All Trips)
│   │   ├── TripList (with distance)
│   │   └── MapView (optional - future)
│   └── CompleteTripForm (Epic D.3)
│       ├── CompletionConfirm
│       └── PayoutSummary
├── Admin Console (Epic E)
│   ├── TripApproval (Epic E.1)
│   │   ├── PendingTripsList
│   │   ├── TripReviewModal
│   │   │   ├── ApproveButton
│   │   │   ├── RejectButton
│   │   │   └── AuditLogViewer
│   │   └── TripFilters (status, date)
│   ├── DriverManagement (Epic E.2)
│   │   ├── DriverList
│   │   ├── AddDriverForm
│   │   │   ├── UserInfoFields
│   │   │   ├── VehicleInfoFields
│   │   │   ├── DocumentUploader (Supabase Storage)
│   │   │   └── TempPasswordDisplay
│   │   ├── DriverDetailView
│   │   │   ├── DocumentViewer
│   │   │   ├── ExpiryAlerts (30/15/7 days)
│   │   │   └── SuspendButton
│   │   └── DocumentExpiryDashboard
│   ├── CreateTrip (Epic E.3)
│   │   ├── TripForm (title, description, dates, capacity)
│   │   ├── ItineraryBuilder
│   │   │   ├── DayTabs
│   │   │   ├── ActivityList
│   │   │   └── ActivityBlock (drag & drop)
│   │   ├── LocationAutocomplete (40+ famous locations)
│   │   └── PricingConfig (base price per seat)
│   ├── PaymentLedger (Epic C.2)
│   │   ├── PaymentsList (filterable)
│   │   ├── RevenueSummary (total, platform fees)
│   │   ├── CSVExportButton
│   │   └── PlatformFeeSettings
│   │       └── FeePercentageInput (default 15%)
│   └── Analytics (Epic F.2)
│       ├── FunnelDashboard
│       │   ├── ConversionRates
│       │   ├── DropOffAnalysis
│       │   └── TimeToAccept (driver metric)
│       └── SuccessMetrics
│           ├── CompletedTrips (target: 50+/30 days)
│           ├── DoubleBookingRate (target: <2%)
│           └── AvgAcceptTime (target: <5 min)
└── Shared Components
    ├── Button (variant: primary/secondary/ghost/glass)
    ├── Input (with Zod validation)
    ├── Select (shadcn/ui)
    ├── Modal (with backdrop)
    ├── Toast (success/error/info)
    ├── Badge (urgency colors)
    ├── Spinner (loading states)
    ├── ErrorBoundary
    └── Pagination
```

## Security Implementation

### Authentication & Authorization
- **JWT-based authentication** (24-hour expiry, refresh tokens)
- **OTP verification** (Epic B.1):
  - Twilio SMS + Resend email
  - 6-digit random code, 10-minute expiry
  - 3-attempt throttle → 5-minute lockout
  - Rate limiting: 5 requests/hour per contact
- **Driver authentication** (Epic D.1):
  - bcrypt password hashing (salt rounds: 10)
  - Force password change on first login
  - Session management with secure cookies
- **Role-based access control (RBAC)**:
  - `TRAVELLER`: Browse, book, view own bookings
  - `DRIVER`: Accept/decline, view geofiltered trips, complete trips
  - `ADMIN`: Full access (trip approval, driver management, settings)
- **Route protection**:
  - Middleware checks JWT validity + role
  - API routes validate user role before execution

### Data Protection
- **Input sanitization**: Zod schema validation on all API routes
- **XSS prevention**: Content Security Policy (CSP) headers
- **CSRF protection**: SameSite cookies, CSRF tokens
- **SQL injection prevention**: Prisma ORM with parameterized queries
- **Rate limiting**: 
  - OTP: 5 requests/hour per contact
  - API: 100 requests/minute per IP
  - Webhooks: Stripe signature verification
- **Request validation**: All inputs validated with Zod schemas

### API Security
- **HTTPS enforced**: All production traffic uses TLS 1.3
- **Stripe webhook verification**: Signature validation on all webhook events
- **PostGIS security**: Geography queries use prepared statements
- **Atomic transactions**: PostgreSQL row-level locking for booking acceptance
- **IP whitelisting**: Admin routes restricted to known IPs (optional)
- **Environment variables**: All secrets stored in `.env` (never committed)

### Payment Security (Epic C.1)
- **PCI DSS compliance**: Stripe handles all card data
- **3D Secure (SCA)**: Enabled for all EU/UK transactions
- **Webhook security**: Stripe signature verification required
- **Idempotency**: Payment intents use idempotency keys
- **Refund security**: Admin-only refund approval

### Document Security (Epic E.2)
- **Supabase Storage**: Driver documents stored securely
- **Pre-signed URLs**: Temporary access (1-hour expiry)
- **File type validation**: Only PDF, JPG, PNG allowed
- **File size limits**: Max 5MB per document
- **Access control**: Admin + document owner only

## Performance Optimization

### Frontend Optimization
- **Server Components**: Data-heavy pages (trip list, trip details) use Next.js Server Components
- **Client Components**: Interactive features (OTP input, seat selector, countdown) use 'use client'
- **Dynamic imports**: Code-splitting for large components (admin console, analytics dashboard)
- **Image optimization**: Next.js Image component with automatic WebP conversion
- **React Query**: Server state caching (5-minute stale time for trip listings)
- **Zustand**: Lightweight client state (user preferences, UI state)
- **Debounced search**: 300ms delay on location autocomplete
- **Lazy loading**: Below-fold components load on scroll
- **Prefetching**: Next.js Link prefetches on hover

### Backend Optimization
- **Database query optimization**:
  - Indexed fields: `trip.status`, `trip.departure_time`, `booking.hold_expires_at`
  - Composite indexes: `(origin_city, destination_city)`, `(trip_id, status)`
  - PostGIS spatial index on `origin_location`, `home_location`
- **Connection pooling**: Prisma connection pool (10 connections)
- **Query batching**: React Query batches parallel requests
- **Atomic transactions**: Minimized transaction scope (booking acceptance)
- **Soft hold cleanup**: Cron job runs every 1 minute (not per-request)

### Caching Strategy
- **API Routes**: No caching (real-time data required)
- **Static assets**: CDN caching (Vercel Edge Network)
- **Database**: No Redis layer (Supabase handles query caching)
- **Client-side**: React Query cache (5-minute stale time)

### PostGIS Performance (Epic D.4)
- **Spatial index**: `GIST` index on `geography` columns
- **Query optimization**: 
  ```sql
  -- Efficient 50km radius query
  SELECT * FROM trips 
  WHERE ST_DWithin(origin_location::geography, $driver_home::geography, 50000)
  ORDER BY ST_Distance(origin_location::geography, $driver_home::geography) ASC
  LIMIT 20;
  ```
- **Distance caching**: Calculated distances cached in API response

### Infrastructure
- **CDN integration**: Vercel Edge Network (automatic)
- **Edge caching**: Static pages cached at edge locations
- **Database indexing**: See data models section for all indexes
- **Auto-scaling**: Vercel serverless functions scale automatically
- **Function timeout**: 10 seconds (default), 60 seconds for webhooks

## Monitoring & Analytics

### System Metrics (Production Monitoring)
- **Vercel Analytics**:
  - Response times (p50, p75, p95, p99)
  - Error rates (4xx, 5xx)
  - Function execution time
  - Cold start frequency
- **Database Performance** (Supabase Dashboard):
  - Query execution time
  - Connection pool usage
  - Slow query log (>1s)
  - Index hit rate (target: >99%)
- **API Monitoring**:
  - Endpoint latency
  - Request volume
  - Error distribution by endpoint
  - Webhook delivery success rate (Stripe)

### Business Metrics (Success Criteria from Product Spec)
- **30-Day Post-Launch Goals**:
  - ✅ **50+ completed trips** (tracked via PostHog)
  - ✅ **<2% double-booking rate** (atomic locking enforces this)
  - ✅ **<5 min avg driver accept time** (tracked via `time_to_accept` event)
  - ✅ **>90% OTP verification success** (delivery + validation rate)
  - ✅ **>95% payment success rate** (Stripe Checkout completion)
- **Revenue Metrics** (Epic C.2):
  - Total GMV (Gross Merchandise Value)
  - Platform fee revenue (15% default)
  - Average booking value
  - Driver payout amounts
- **Operational Metrics**:
  - Trip approval time (admin SLA: <24 hours)
  - Driver acceptance rate (target: >80%)
  - Cancellation rate by window (<48h, <24h)
  - Refund processing time

### User Analytics (Epic F.1, F.2)
- **PostHog Event Tracking** (no PII):
  - `trip_viewed` (trip_id, origin_city, destination_city)
  - `trip_detail_viewed` (trip_id, is_private)
  - `booking_started` (type: private/shared, seats)
  - `otp_requested` (channel: sms/email)
  - `otp_verified_success` / `otp_verified_failed` (attempt_number)
  - `payment_initiated` (amount, platform_fee)
  - `payment_succeeded` / `payment_failed`
  - `driver_accepted` (time_to_accept_seconds)
  - `trip_completed` (rating, payout_amount)
  - `hold_expired` (seats_requested)
  - `booking_cancelled` (hours_until_departure, refund_pct)
- **Funnel Analysis** (Epic F.2):
  1. Trip Viewed → 2. Detail Viewed → 3. Booking Started → 
  4. OTP Verified → 5. Payment Initiated → 6. Payment Succeeded → 
  7. Driver Accepted → 8. Trip Completed
  - Target conversion (View → Complete): >10%
  - Drop-off analysis at each step
- **User Journey Tracking**:
  - Anonymous session IDs (PostHog)
  - Device type, browser, location (city-level only)
  - Search patterns (popular routes)
  - Booking behavior (private vs shared preference)
  - Time to book (browse → payment)

### Error Tracking (Recommended: Sentry)
- **Frontend Errors**:
  - React error boundaries
  - Uncaught exceptions
  - API request failures
- **Backend Errors**:
  - API route exceptions
  - Database query failures
  - External service errors (Stripe, Twilio, Resend)
  - Webhook processing failures
- **Alert Thresholds**:
  - Error rate >1% → Slack alert
  - Payment failure rate >5% → Urgent alert
  - OTP delivery failure rate >10% → Investigate Twilio/Resend

## Deployment Strategy

### Development Workflow (Git Flow)
1. **Feature branches**: `feature/epic-b-otp-verification`
2. **PR reviews**: Require 1 approval + passing tests
3. **Automated testing**: GitHub Actions runs on every PR
4. **Staging deployment**: Auto-deploy `develop` branch to staging
5. **Production deployment**: Manual trigger from `main` branch

### CI/CD Pipeline (GitHub Actions)

**On Pull Request:**
```yaml
- Code linting (ESLint, Prettier)
- Type checking (TypeScript strict mode)
- Unit tests (Vitest) - target: >80% coverage
- Integration tests (API routes)
- Build process (Next.js build)
- Prisma schema validation
```

**On Merge to Main:**
```yaml
- All PR checks
- E2E tests (Playwright) - critical user flows
- Database migration check (dry-run)
- Deploy to Vercel production
- Run smoke tests
- Send Slack notification
```

### Environment Management

**Development** (`localhost:3000`):
- Local PostgreSQL (Docker) or Supabase dev project
- Stripe test mode
- Twilio test credentials (no real SMS sent)
- PostHog development project
- `.env.local` file (not committed)

**Staging** (`staging.steppergo.com`):
- Supabase staging database
- Stripe test mode
- Twilio sandbox (real SMS to verified numbers)
- PostHog staging project
- Environment variables in Vercel dashboard
- Purpose: QA testing, demo to stakeholders

**Production** (`steppergo.com`):
- Supabase production database (daily backups)
- Stripe live mode
- Twilio production (real SMS)
- PostHog production project
- Environment variables in Vercel (encrypted)
- Feature flags: Off by default, toggle via admin panel

### Database Migrations

**Process:**
1. Develop migration locally: `npx prisma migrate dev --name add-driver-portal`
2. Test migration on staging: `npx prisma migrate deploy`
3. Review migration SQL in `prisma/migrations/`
4. Run migration on production (during low-traffic window)
5. Verify schema: `npx prisma db pull` to confirm

**Critical Migrations (Gate 2):**
```bash
# 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

# 2. Add new tables (Driver, Payment, DriverAssignment, etc.)
npx prisma migrate deploy

# 3. Backfill existing data (if needed)
# Run custom SQL scripts in prisma/migrations/
```

### Rollback Strategy
- **Code rollback**: Vercel instant rollback to previous deployment
- **Database rollback**: Restore from Supabase daily backup (RTO: 1 hour)
- **Feature flags**: Disable problematic features via admin panel
- **Hotfix process**: Create `hotfix/` branch → expedited review → deploy

### Post-Deployment Verification (Smoke Tests)

**Automated (Playwright E2E):**
1. ✅ Browse trips → Trip detail page loads
2. ✅ Start booking → OTP verification flow
3. ✅ Driver login → View geofiltered trips
4. ✅ Admin login → View pending trips

### Post-Deployment Verification (Smoke Tests)

**Automated (Playwright E2E):**
1. ✅ Browse trips → Trip detail page loads
2. ✅ Start booking → OTP verification flow
3. ✅ Driver login → View geofiltered trips
4. ✅ Admin login → View pending trips

**Manual Checks:**
1. ✅ Stripe webhook receiving events (check Stripe dashboard)
2. ✅ OTP delivery (send test SMS + email)
3. ✅ PostHog events tracking (check PostHog dashboard)
4. ✅ Database connections healthy (Supabase dashboard)
5. ✅ No console errors on critical pages

---

## Critical Implementation Details

### Atomic Booking Acceptance (Epic D.2)
**Problem:** Multiple drivers accepting the same trip simultaneously → double-booking  
**Solution:** PostgreSQL row-level locking with atomic transaction

```typescript
// lib/driver-service.ts
export async function acceptBooking(tripId: string, driverId: string) {
  return await prisma.$transaction(async (tx) => {
    // Step 1: Lock the trip row
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { driver_assignment: true }
    });
    
    // Step 2: Check if already assigned
    if (trip.driver_assignment) {
      throw new Error('Trip already assigned to another driver');
    }
    
    // Step 3: Check for timeslot conflict
    const conflictingTrips = await tx.trip.findMany({
      where: {
        driver_assignment: {
          driver_id: driverId,
          status: 'ACCEPTED'
        },
        departure_time: {
          gte: new Date(trip.departure_time.getTime() - 4 * 60 * 60 * 1000), // -4h
          lte: new Date(trip.departure_time.getTime() + 4 * 60 * 60 * 1000)  // +4h
        }
      }
    });
    
    if (conflictingTrips.length > 0) {
      throw new Error('Timeslot conflict with another trip');
    }
    
    // Step 4: Create driver assignment
    const assignment = await tx.driverAssignment.create({
      data: {
        trip_id: tripId,
        driver_id: driverId,
        status: 'ACCEPTED',
        accepted_at: new Date()
      }
    });
    
    // Step 5: Update booking status
    await tx.booking.updateMany({
      where: { trip_id: tripId, status: 'PAID' },
      data: { status: 'DRIVER_ACCEPTED' }
    });
    
    return assignment;
  });
}
```

**Result:** <2% double-booking rate (enforced by database constraints)

---

### Soft Hold with 10-Minute Expiry (Epic B.3)
**Problem:** Race condition during checkout (2 users booking last seat)  
**Solution:** Temporary seat reservation with automatic expiry

```typescript
// lib/booking-service.ts
export async function createSharedBooking(tripId: string, userId: string, seats: number) {
  return await prisma.$transaction(async (tx) => {
    // Lock trip row
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { bookings: true }
    });
    
    // Calculate available seats (excluding expired holds)
    const now = new Date();
    const activeBookings = trip.bookings.filter(b => 
      (b.status === 'PAID' || b.status === 'DRIVER_ACCEPTED') ||
      (b.status === 'HELD' && b.hold_expires_at > now)
    );
    
    const bookedSeats = activeBookings.reduce((sum, b) => sum + b.seats_booked, 0);
    const available = trip.total_seats - bookedSeats;
    
    if (available < seats) {
      throw new Error(`Only ${available} seats available`);
    }
    
    // Create booking with 10-min hold
    const booking = await tx.booking.create({
      data: {
        trip_id: tripId,
        user_id: userId,
        type: 'SHARED',
        seats_booked: seats,
        status: 'HELD',
        hold_expires_at: new Date(Date.now() + 10 * 60 * 1000), // +10 minutes
        price_per_seat: trip.base_price_per_seat,
        total_amount: trip.base_price_per_seat * seats,
        platform_fee_pct: 15, // TODO: Get from PlatformSettings
        // ... calculate fees
      }
    });
    
    return booking;
  });
}

// Cron job: Every 1 minute
export async function expireHolds() {
  const expired = await prisma.booking.updateMany({
    where: {
      status: 'HELD',
      hold_expires_at: { lt: new Date() }
    },
    data: { status: 'EXPIRED' }
  });
  
  console.log(`Expired ${expired.count} holds`);
}
```

**Frontend Timer Component:**
```typescript
// components/SoftHoldTimer.tsx
export function SoftHoldTimer({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        // Redirect to trip page with "Hold expired" message
        router.push(`/trips/${tripId}?error=hold_expired`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  return (
    <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-lg">
      <p className="font-bold text-amber-900">
        Your seats are held for: {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
      <p className="text-sm text-amber-700">Complete payment before timer expires</p>
    </div>
  );
}
```

---

### OTP Verification with 3-Attempt Throttle (Epic B.1)
**Problem:** Brute-force OTP guessing attacks  
**Solution:** Rate limiting + lockout mechanism

```typescript
// lib/otp-service.ts
export async function sendOTP(contact: string, channel: 'sms' | 'email', name?: string) {
  // Rate limiting check
  const recentAttempts = await prisma.user.findFirst({
    where: {
      OR: [{ phone: contact }, { email: contact }],
      otp_locked_until: { gt: new Date() }
    }
  });
  
  if (recentAttempts) {
    const retryAfter = Math.ceil((recentAttempts.otp_locked_until.getTime() - Date.now()) / 1000);
    throw new Error(`Too many attempts. Try again in ${retryAfter} seconds`);
  }
  
  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const otpToken = crypto.randomBytes(32).toString('hex');
  
  // Save OTP
  const user = await prisma.user.upsert({
    where: channel === 'sms' ? { phone: contact } : { email: contact },
    update: {
      otp_code: otpCode,
      otp_expires_at: otpExpiresAt,
      otp_attempts: 0
    },
    create: {
      name: name || 'User',
      [channel === 'sms' ? 'phone' : 'email']: contact,
      otp_code: otpCode,
      otp_expires_at: otpExpiresAt,
      otp_attempts: 0
    }
  });
  
  // Send OTP
  if (channel === 'sms') {
    await twilioClient.messages.create({
      to: contact,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: `Your StepperGO verification code is: ${otpCode}\n\nValid for 10 minutes.`
    });
  } else {
    await resend.emails.send({
      from: 'StepperGO <noreply@steppergo.com>',
      to: contact,
      subject: 'Your Verification Code',
      html: `<p>Your verification code is: <strong>${otpCode}</strong></p>`
    });
  }
  
  return { otp_token: otpToken };
}

export async function verifyOTP(otpToken: string, otpCode: string) {
  const user = await prisma.user.findFirst({
    where: {
      otp_code: otpCode,
      otp_expires_at: { gt: new Date() }
    }
  });
  
  if (!user) {
    // Increment attempts
    await prisma.user.updateMany({
      where: { otp_code: { not: null } },
      data: {
        otp_attempts: { increment: 1 }
      }
    });
    
    // Check if we need to lock
    const userWithAttempts = await prisma.user.findFirst({
      where: { otp_code: otpCode }
    });
    
    if (userWithAttempts && userWithAttempts.otp_attempts >= 3) {
      await prisma.user.update({
        where: { id: userWithAttempts.id },
        data: {
          otp_locked_until: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          otp_attempts: 0,
          otp_code: null
        }
      });
    }
    
    throw new Error('Invalid or expired OTP');
  }
  
  // Mark as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp_verified_at: new Date(),
      otp_code: null,
      otp_attempts: 0,
      status: 'ACTIVE'
    }
  });
  
  // Generate JWT
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
  
  return { access_token: accessToken, user };
}
```

---

### PostGIS Geofilter Query (Epic D.4)
**Problem:** Show drivers only nearby trips (50km radius)  
**Solution:** PostGIS geography queries with spatial index

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column (already in schema)
-- Prisma: home_location Unsupported("geography(Point,4326)")

-- Create spatial index (automatic with Prisma migration)
CREATE INDEX idx_driver_home_location ON drivers USING GIST(home_location);
CREATE INDEX idx_trip_origin_location ON trips USING GIST(origin_location);
```

```typescript
// lib/driver-service.ts
export async function getGeoFilteredTrips(driverId: string, radiusKm: number = 50) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver.home_location) {
    throw new Error('Driver home location not set');
  }
  
  // Raw SQL query with PostGIS
  const trips = await prisma.$queryRaw`
    SELECT 
      t.*,
      ST_Distance(t.origin_location::geography, ${driver.home_location}::geography) AS distance_meters
    FROM trips t
    WHERE 
      t.status = 'APPROVED'
      AND t.departure_time > NOW()
      AND ST_DWithin(
        t.origin_location::geography,
        ${driver.home_location}::geography,
        ${radiusKm * 1000}  -- Convert km to meters
      )
    ORDER BY distance_meters ASC
    LIMIT 20
  `;
  
  return trips.map(trip => ({
    ...trip,
    distance_km: Math.round(trip.distance_meters / 1000)
  }));
}
```

---

### Stripe Webhook Handler (Epic C.1)
**Problem:** Payment confirmation must update booking status  
**Solution:** Webhook verification + idempotent processing

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Handle event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Get booking ID from metadata
    const bookingId = session.metadata?.booking_id;
    
    if (!bookingId) {
      return Response.json({ error: 'No booking ID' }, { status: 400 });
    }
    
    // Update booking (idempotent - safe to run multiple times)
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId }
      });
      
      if (booking.status === 'PAID') {
        // Already processed
        return;
      }
      
      // Create payment record
      await tx.payment.create({
        data: {
          booking_id: bookingId,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_session_id: session.id,
          amount: booking.total_amount,
          currency: booking.currency,
          platform_fee_pct: booking.platform_fee_pct,
          platform_fee_amount: booking.platform_fee_amount,
          driver_payout: booking.driver_payout,
          status: 'COMPLETED'
        }
      });
      
      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'PAID',
          payment_id: session.payment_intent as string
        }
      });
      
      // Update trip occupied seats
      await tx.trip.update({
        where: { id: booking.trip_id },
        data: {
          occupied_seats: { increment: booking.seats_booked }
        }
      });
    });
    
    // Send confirmation email/SMS (async, no await)
    sendBookingConfirmation(bookingId);
    
    // Track PostHog event
    trackServerEvent('payment_succeeded', {
      booking_id: bookingId,
      amount: session.amount_total / 100,
      platform_fee: booking.platform_fee_amount
    });
  }
  
  return Response.json({ received: true });
}
```

---

## Testing Strategy

### Unit Tests (Vitest) - Target: >80% Coverage

**Critical Functions:**
```typescript
// tests/unit/otp-service.test.ts
describe('OTP Service', () => {
  it('should generate 6-digit OTP', () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
  });
  
  it('should throttle after 3 failed attempts', async () => {
    await verifyOTP('token', '111111'); // Fail 1
    await verifyOTP('token', '222222'); // Fail 2
    await verifyOTP('token', '333333'); // Fail 3
    
    await expect(verifyOTP('token', '444444')).rejects.toThrow('Too many attempts');
  });
});

// tests/unit/capacity-check.test.ts
describe('Capacity Check', () => {
  it('should prevent overbooking', async () => {
    // Trip has 4 seats, 3 already booked
    await expect(createSharedBooking(tripId, userId, 2)).rejects.toThrow('Only 1 seats available');
  });
  
  it('should handle concurrent bookings', async () => {
    // Simulate 2 users booking last seat simultaneously
    const results = await Promise.allSettled([
      createSharedBooking(tripId, 'user1', 1),
      createSharedBooking(tripId, 'user2', 1)
    ]);
    
    // Only one should succeed
    const succeeded = results.filter(r => r.status === 'fulfilled');
    expect(succeeded).toHaveLength(1);
  });
});
```

### Integration Tests (API Routes)

```typescript
// tests/integration/booking-flow.test.ts
describe('Booking Flow', () => {
  it('should complete private booking end-to-end', async () => {
    // 1. Send OTP
    const { otp_token } = await POST('/api/auth/send-otp', {
      contact: '+77771234567',
      channel: 'sms'
    });
    
    // 2. Verify OTP (use test code in test env)
    const { access_token } = await POST('/api/auth/verify-otp', {
      otp_token,
      otp_code: '123456'
    });
    
    // 3. Create private booking
    const { booking_id } = await POST('/api/bookings/private', {
      trip_id: 'test-trip-id'
    }, { Authorization: `Bearer ${access_token}` });
    
    // 4. Create Stripe session
    const { session_url } = await POST('/api/checkout/create-session', {
      booking_id
    }, { Authorization: `Bearer ${access_token}` });
    
    expect(session_url).toContain('checkout.stripe.com');
  });
});
```

### E2E Tests (Playwright) - Critical User Flows

```typescript
// tests/e2e/booking.spec.ts
test('Complete shared booking journey', async ({ page }) => {
  // 1. Browse trips
  await page.goto('/trips');
  await expect(page.locator('.trip-card')).toHaveCount(3);
  
  // 2. View trip detail
  await page.click('.trip-card:first-child');
  await expect(page).toHaveURL(/\/trips\/.+/);
  
  // 3. Click "Book Shared"
  await page.click('text=Book Shared Ride');
  
  // 4. Select 2 seats
  await page.selectOption('select[name=seats]', '2');
  
  // 5. OTP verification
  await page.fill('input[name=phone]', '+77771234567');
  await page.click('text=Send Code');
  await page.fill('input[name=otp]', '123456'); // Test OTP in test env
  await page.click('text=Verify');
  
  // 6. See hold timer
  await expect(page.locator('text=/held for: \\d+:\\d+/')).toBeVisible();
  
  // 7. Complete payment (redirect to Stripe)
  await page.click('text=Pay Now');
  await expect(page).toHaveURL(/checkout.stripe.com/);
});
```

---

## Environment Variables Checklist

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/steppergo?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/steppergo"  # For migrations

# Authentication
JWT_SECRET="your-secret-key-min-32-chars"

# Stripe (Payments)
STRIPE_SECRET_KEY="sk_test_..."  # Test mode
STRIPE_SECRET_KEY="sk_live_..."  # Production mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# Resend (Email OTP)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@steppergo.com"

# PostHog (Analytics)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
POSTHOG_PERSONAL_API_KEY="phx_..."  # For server-side events

# Mapbox (Geocoding)
NEXT_PUBLIC_MAPBOX_TOKEN="pk...."

# Supabase Storage (Driver Documents)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_KEY="eyJ..."  # Server-side only

# App Configuration
NEXT_PUBLIC_URL="https://steppergo.com"  # Production
NEXT_PUBLIC_URL="http://localhost:3000"  # Development

# PWA (Push Notifications)
VAPID_PUBLIC_KEY="BNKj..."  # Web Push VAPID public key
VAPID_PRIVATE_KEY="xyz..."  # Web Push VAPID private key

# Rate Limiting (Optional - use Upstash Redis)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## Progressive Web App (PWA) Implementation

### Overview
StepperGO is designed as a Progressive Web App to provide native app-like experience on mobile devices while maintaining web accessibility.

### Key PWA Features

#### 1. Installability
**User Experience:**
- "Add to Home Screen" prompt for mobile users
- Desktop installation support (Chrome, Edge, Safari)
- Standalone display mode (no browser UI)
- Custom splash screen with StepperGO branding
- App shortcuts for quick actions (Browse Trips, My Bookings)

**Implementation:**
```json
// public/manifest.json
{
  "name": "StepperGO - Central Asia Rides",
  "short_name": "StepperGO",
  "description": "Book private or shared rides across Kazakhstan & Kyrgyzstan",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#00C2B0",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/trips-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/booking-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/trips-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["travel", "transportation"],
  "shortcuts": [
    {
      "name": "Browse Trips",
      "short_name": "Trips",
      "description": "View available trips",
      "url": "/trips",
      "icons": [{ "src": "/icons/trips-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "My Bookings",
      "short_name": "Bookings",
      "description": "View your bookings",
      "url": "/bookings",
      "icons": [{ "src": "/icons/bookings-96x96.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share-trip",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

#### 2. Offline Support
**Caching Strategy:**

```javascript
// Service Worker caching strategy
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `steppergo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `steppergo-dynamic-${CACHE_VERSION}`;
const API_CACHE = `steppergo-api-${CACHE_VERSION}`;

// Precache critical assets
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/trips',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Cache-first strategy for static assets
// Network-first strategy for API calls
// Stale-while-revalidate for images
```

**Offline Features:**
- View last 20 browsed trips (cached)
- Save booking drafts locally (IndexedDB)
- Queue booking submissions for sync
- Offline page with helpful messaging
- Background sync when connection restored

**Next.js PWA Configuration:**
```javascript
// next.config.mjs
import withPWA from 'next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'trip-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
        }
      }
    },
    {
      urlPattern: /^\/api\/trips$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-trips',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
});

export default config;
```

#### 3. Push Notifications
**Use Cases:**
- Driver accepts booking (Epic D.2)
- Trip departure reminder (24 hours before)
- OTP verification code delivery (fallback)
- Booking confirmation
- Trip completion review request

**Implementation:**
```typescript
// lib/push-notifications.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:support@steppergo.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
  }
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error) {
    console.error('Push notification failed:', error);
    return { success: false, error };
  }
}

// Usage: Driver accepts booking
await sendPushNotification(userSubscription, {
  title: '🚗 Driver Accepted!',
  body: 'Your trip to Bishkek has been confirmed by Amir',
  icon: '/icons/icon-192x192.png',
  url: '/bookings/abc123',
  tag: 'booking-accepted'
});
```

**Client-side Subscription:**
```typescript
// components/PushNotificationPrompt.tsx
'use client';

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        )
      });
      
      // Save subscription to database
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };

  if (permission === 'granted') return null;

  return (
    <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-4">
      <p className="font-medium">Enable Notifications</p>
      <p className="text-sm text-gray-600 mb-2">
        Get instant alerts when drivers accept your bookings
      </p>
      <button 
        onClick={requestPermission}
        className="px-4 py-2 bg-teal-500 text-white rounded"
      >
        Enable
      </button>
    </div>
  );
}
```

#### 4. Background Sync
**Use Cases:**
- Sync booking submissions made while offline
- Update trip cache in background
- Send queued analytics events
- Retry failed API requests

**Implementation:**
```javascript
// public/sw.js - Service Worker
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
  
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalyticsEvents());
  }
});

async function syncOfflineBookings() {
  const db = await openIndexedDB();
  const bookings = await db.getAll('pending-bookings');
  
  for (const booking of bookings) {
    try {
      const response = await fetch('/api/bookings/shared', {
        method: 'POST',
        body: JSON.stringify(booking.data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await db.delete('pending-bookings', booking.id);
        
        // Show success notification
        self.registration.showNotification('Booking Submitted!', {
          body: 'Your booking has been successfully submitted',
          icon: '/icons/icon-192x192.png'
        });
      }
    } catch (error) {
      console.error('Sync failed for booking:', booking.id, error);
    }
  }
}
```

**Client-side Trigger:**
```typescript
// lib/offline-queue.ts
export async function queueBooking(bookingData: any) {
  // Save to IndexedDB
  const db = await openIndexedDB();
  await db.add('pending-bookings', {
    id: crypto.randomUUID(),
    data: bookingData,
    timestamp: Date.now()
  });
  
  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in registration) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-bookings');
  }
}
```

#### 5. Install Prompt Component
```typescript
// components/InstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 30 seconds or on second visit
      const visitCount = parseInt(localStorage.getItem('visitCount') || '0');
      localStorage.setItem('visitCount', String(visitCount + 1));
      
      if (visitCount >= 1) {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed successfully');
      // Track in PostHog
      posthog.capture('pwa_installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-xl shadow-2xl z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded"
      >
        <X size={20} />
      </button>
      
      <div className="flex items-start gap-3">
        <img 
          src="/icons/icon-96x96.png" 
          alt="StepperGO"
          className="w-12 h-12 rounded-lg"
        />
        <div className="flex-1">
          <p className="font-bold text-lg mb-1">Install StepperGO</p>
          <p className="text-sm text-teal-50 mb-3">
            Quick access, offline bookings, and instant notifications!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border-2 border-white/30 rounded-lg hover:bg-white/10 transition"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 6. Offline Page
```typescript
// app/offline/page.tsx
import { Wifi, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Wifi size={40} className="text-gray-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            You're Offline
          </h1>
          
          <p className="text-gray-600 mb-6">
            Don't worry! Your recent trips and bookings are saved. 
            We'll sync everything when you're back online.
          </p>
          
          <div className="bg-teal-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-teal-900">
              ✓ Recent trips cached<br/>
              ✓ Booking drafts saved<br/>
              ✓ Auto-sync when online
            </p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
          
          <a
            href="/trips"
            className="block mt-3 text-teal-600 hover:text-teal-700"
          >
            View Cached Trips
          </a>
        </div>
      </div>
    </div>
  );
}
```

### PWA Performance Metrics

**Target Lighthouse Scores:**
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >95
- **PWA: 100**

**Success Metrics:**
- **Install rate**: >15% of mobile visitors
- **Offline usage**: >5% of sessions start offline
- **Push notification opt-in**: >30% of active users
- **Return rate**: 2x higher for installed users vs web
- **Session duration**: 1.5x longer in PWA mode
- **Background sync success**: >95% of queued bookings

**Analytics Tracking:**
```typescript
// Track PWA-specific events in PostHog
posthog.capture('pwa_installed');
posthog.capture('pwa_install_prompt_shown');
posthog.capture('pwa_install_dismissed');
posthog.capture('offline_booking_queued');
posthog.capture('background_sync_success');
posthog.capture('push_notification_granted');
posthog.capture('push_notification_clicked');
```

### Testing PWA

**Lighthouse Audit:**
```bash
# Run PWA audit
npx lighthouse https://steppergo.com --preset=desktop --view

# Check PWA checklist
npx lighthouse https://steppergo.com --only-categories=pwa --view
```

**Manual Testing Checklist:**
- [ ] Install prompt appears on mobile (after 2nd visit)
- [ ] App installs successfully (iOS Safari, Android Chrome)
- [ ] Splash screen shows with correct branding
- [ ] Standalone mode works (no browser UI)
- [ ] Offline page appears when offline
- [ ] Cached trips viewable offline
- [ ] Booking draft saves offline
- [ ] Background sync works when connection restored
- [ ] Push notifications received and clickable
- [ ] App shortcuts work from home screen
- [ ] App uninstalls cleanly

### Browser Support

**Installation:**
- ✅ Android Chrome 70+
- ✅ Android Edge 79+
- ✅ iOS Safari 16.4+ (limited features)
- ✅ Desktop Chrome 70+
- ✅ Desktop Edge 79+
- ❌ Firefox (no install prompt, but works as PWA)

**Push Notifications:**
- ✅ Android Chrome
- ✅ Desktop Chrome/Edge
- ❌ iOS Safari (no Web Push support yet)

**Background Sync:**
- ✅ Android Chrome
- ✅ Desktop Chrome/Edge
- ❌ iOS Safari

### NPM Dependencies

```json
{
  "dependencies": {
    "next-pwa": "^5.6.0",
    "web-push": "^3.6.6",
    "idb": "^7.1.1"
  },
  "devDependencies": {
    "@types/web-push": "^3.6.3"
  }
}
```

### Additional PWA Environment Variables

```env
# Web Push VAPID Keys (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="BNKj..."
VAPID_PRIVATE_KEY="xyz..."
VAPID_SUBJECT="mailto:support@steppergo.com"
```
