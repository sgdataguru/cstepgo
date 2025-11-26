# StepperGO Developer Onboarding Guide

**Version:** 1.0  
**Last Updated:** November 25, 2025  
**Purpose:** Comprehensive onboarding guide for new developers joining the StepperGO project

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [Module & Component Inventory](#module--component-inventory)
5. [Data Models](#data-models)
6. [Persona-Based Workflows](#persona-based-workflows)
7. [API Reference](#api-reference)
8. [Code Conventions](#code-conventions)
9. [Development Workflow](#development-workflow)
10. [Feature Gaps & Roadmap](#feature-gaps--roadmap)

---

## Introduction

### What is StepperGO?

StepperGO is a modern multi-sided travel platform combining three business models:
- **BlaBlaCar-style shared rides**: Per-seat pricing for intercity travel
- **Uber-style private cabs**: On-demand private transportation
- **Klook-style activities**: Tourism and event bookings

### Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: Socket.IO, Server-Sent Events (SSE)
- **External Services**: Stripe, Twilio, Google Maps API, AWS S3, PostHog

### Project Status (MVP Achieved - Nov 2025)

✅ **Complete**: Trip booking system, payment POC, real-time tracking, driver portal, receipts, payouts, Activity Owner backend  
🚧 **In Progress**: Activity Owner frontend, Admin monitoring dashboard  
❌ **Pending**: Stripe production, Activity passenger UI, push notifications

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   PASSENGERS    │──┐
│  (Web/Mobile)   │  │
└─────────────────┘  │
                     │     ┌──────────────────┐     ┌─────────────────┐
┌─────────────────┐  │     │  NEXT.JS APP     │     │   DATABASE      │
│    DRIVERS      │──┼────▶│  - Pages         │────▶│  - PostgreSQL   │
│  Driver Portal  │  │     │  - API Routes    │     │  - Prisma ORM   │
└─────────────────┘  │     │  - WebSocket     │     └─────────────────┘
                     │     └──────────────────┘              │
┌─────────────────┐  │              │                         │
│ ACTIVITY OWNERS │──┘              │                         ▼
│   Dashboard     │                 │                ┌─────────────────┐
└─────────────────┘                 │                │  EXTERNAL APIs  │
                                    │                │  - Stripe       │
┌─────────────────┐                 │                │  - Twilio       │
│     ADMIN       │─────────────────┘                │  - Google Maps  │
│   Console       │                                  │  - AWS S3       │
└─────────────────┘                                  └─────────────────┘
```

### Folder Structure

```
cstepgo/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── page.tsx             # Landing page
│   │   ├── trips/               # Trip browsing & creation
│   │   ├── my-trips/            # Passenger booking management
│   │   ├── drivers/             # Public driver profiles
│   │   ├── driver/              # Driver portal (authenticated)
│   │   ├── activity-owners/     # Activity Owner dashboard
│   │   ├── admin/               # Admin console
│   │   └── api/                 # API routes (50+ endpoints)
│   ├── components/              # UI Components
│   │   ├── landing/             # Landing page widgets
│   │   ├── driver/              # Driver-specific components
│   │   ├── chat/                # Real-time chat
│   │   ├── tracking/            # GPS tracking components
│   │   ├── receipts/            # Receipt generation
│   │   ├── navigation/          # GPS navigation
│   │   └── ui/                  # Shared UI components
│   ├── hooks/                   # React hooks (9 custom hooks)
│   ├── lib/                     # Business logic & utilities
│   │   ├── services/            # Business services
│   │   ├── auth/                # Authentication
│   │   ├── realtime/            # WebSocket handlers
│   │   ├── validations/         # Zod schemas
│   │   └── utils/               # Helper functions
│   ├── types/                   # TypeScript definitions
│   └── config/                  # Configuration files
├── prisma/
│   ├── schema.prisma            # Database schema (30+ models)
│   └── migrations/              # Migration history
└── docs/                        # Documentation
    ├── onboarding/              # This guide
    ├── implementation-plans/    # Feature implementation specs
    ├── stories/                 # User stories
    └── api/                     # API documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (or Supabase account)
- Git

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sgdataguru/cstepgo.git
   cd cstepgo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Key variables to configure (see [`.env.example`](../../.env.example)):
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/steppergo
   
   # Authentication
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_ENCRYPTION_KEY=your_encryption_key_for_sensitive_data
   
   # Google Maps (required for location features)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # Stripe (for payments)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   # Twilio (for SMS/OTP)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   ```

4. **Database setup**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # (Optional) Seed test data
   npm run db:seed
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Visit [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed test data

# Code Quality
npm run lint             # Run ESLint
```

### Authentication Setup

StepperGO uses JWT-based authentication with role-based access control (RBAC):

- **Roles**: `PASSENGER`, `DRIVER`, `ACTIVITY_OWNER`, `ADMIN`
- **Auth implementation**: [`src/lib/auth/`](../../src/lib/auth/)
- **Session management**: JWT tokens stored in HTTP-only cookies
- **OTP verification**: Twilio-based SMS verification ([`src/lib/services/otpService.ts`](../../src/lib/services/otpService.ts))

---

## Module & Component Inventory

### Frontend Pages

#### Passenger Pages

| Page | Path | File | Description |
|------|------|------|-------------|
| Landing | `/` | [`src/app/page.tsx`](../../src/app/page.tsx) | Hero section with search widget |
| Trip Listing | `/trips` | [`src/app/trips/page.tsx`](../../src/app/trips/page.tsx) | Browse all available trips |
| Trip Detail | `/trips/[id]` | [`src/app/trips/[id]/page.tsx`](../../src/app/trips/[id]/page.tsx) | View trip details, itinerary, booking |
| Create Trip | `/trips/create` | [`src/app/trips/create/page.tsx`](../../src/app/trips/create/page.tsx) | Multi-step trip creation flow |
| Register | `/auth/register` | [`src/app/auth/register/page.tsx`](../../src/app/auth/register/page.tsx) | Passenger registration with OTP |
| My Trips | `/my-trips` | [`src/app/my-trips/page.tsx`](../../src/app/my-trips/page.tsx) | View all bookings with filters |
| Booking Detail | `/my-trips/[id]` | [`src/app/my-trips/[id]/page.tsx`](../../src/app/my-trips/[id]/page.tsx) | Detailed booking with driver info |
| Track Driver | `/my-trips/[id]/track` | [`src/app/my-trips/[id]/track/page.tsx`](../../src/app/my-trips/[id]/track/page.tsx) | Real-time driver tracking map |
| Trip Receipt | `/my-trips/[id]/receipt` | [`src/app/my-trips/[id]/receipt/page.tsx`](../../src/app/my-trips/[id]/receipt/page.tsx) | View/download receipt |

#### Driver Pages

| Page | Path | File | Description |
|------|------|------|-------------|
| Driver Profile | `/drivers/[driverId]` | [`src/app/drivers/[driverId]/page.tsx`](../../src/app/drivers/[driverId]/page.tsx) | Public driver profile |
| Driver Login | `/driver/login` | [`src/app/driver/login/page.tsx`](../../src/app/driver/login/page.tsx) | Driver authentication |
| Portal Dashboard | `/driver/portal/dashboard` | [`src/app/driver/portal/dashboard/page.tsx`](../../src/app/driver/portal/dashboard/page.tsx) | Main driver dashboard |
| Portal Earnings | `/driver/portal/earnings` | [`src/app/driver/portal/earnings/page.tsx`](../../src/app/driver/portal/earnings/page.tsx) | Earnings & payouts view |
| Portal Profile | `/driver/portal/profile` | [`src/app/driver/portal/profile/page.tsx`](../../src/app/driver/portal/profile/page.tsx) | Driver profile management |
| Portal Ratings | `/driver/portal/ratings` | [`src/app/driver/portal/ratings/page.tsx`](../../src/app/driver/portal/ratings/page.tsx) | Reviews & feedback |
| Portal Notifications | `/driver/portal/notifications` | [`src/app/driver/portal/notifications/page.tsx`](../../src/app/driver/portal/notifications/page.tsx) | Driver notifications |

#### Activity Owner Pages (⚠️ Frontend Partially Complete)

| Page | Path | File | Status |
|------|------|------|--------|
| AO Register | `/activity-owners/auth/register` | [`src/app/activity-owners/auth/register/page.tsx`](../../src/app/activity-owners/auth/register/page.tsx) | 🔧 Scaffold only |
| AO Login | `/activity-owners/auth/login` | [`src/app/activity-owners/auth/login/page.tsx`](../../src/app/activity-owners/auth/login/page.tsx) | 🔧 Scaffold only |
| AO Dashboard | `/activity-owners/dashboard` | [`src/app/activity-owners/dashboard/page.tsx`](../../src/app/activity-owners/dashboard/page.tsx) | 🔧 Scaffold only |

**Note**: Activity Owner backend is complete (see API section), but frontend UI needs implementation.

#### Admin Pages

| Page | Path | File | Description |
|------|------|------|-------------|
| Admin Drivers | `/admin/drivers` | [`src/app/admin/drivers/page.tsx`](../../src/app/admin/drivers/page.tsx) | Driver approval list |
| New Driver | `/admin/drivers/new` | [`src/app/admin/drivers/new/page.tsx`](../../src/app/admin/drivers/new/page.tsx) | Manual driver registration |

### Key UI Components

#### Landing Components ([`src/components/landing/`](../../src/components/landing/))

- `HeroSection` - Hero with animated background
- `SearchWidget` - Trip search form with autocomplete
- `LocationInput` - Google Places autocomplete input

#### Tracking Components ([`src/components/tracking/`](../../src/components/tracking/))

- `LiveTrackingMap` - Real-time driver tracking with Google Maps
  - Uses custom markers (green pickup, red destination, blue driver)
  - Displays route polyline
  - File: [`src/components/tracking/LiveTrackingMap.tsx`](../../src/components/tracking/LiveTrackingMap.tsx)
- `ETADisplay` - Shows estimated arrival times

#### Receipt Components ([`src/components/receipts/`](../../src/components/receipts/))

- `Receipt` - Printable receipt component
  - File: [`src/components/receipts/Receipt.tsx`](../../src/components/receipts/Receipt.tsx)
  - Features: Print-friendly styling, business branding, payment details

#### Driver Components ([`src/components/driver/`](../../src/components/driver/))

- `EnhancedDriverDashboard` - Main driver dashboard
- `TripAcceptanceModal` - Accept/decline trip offers
- `AvailabilityToggle` - Online/offline status toggle

### Custom React Hooks ([`src/hooks/`](../../src/hooks/))

| Hook | File | Purpose |
|------|------|---------|
| `useAutocomplete` | [`src/hooks/useAutocomplete.ts`](../../src/hooks/useAutocomplete.ts) | Google Places autocomplete |
| `useCountdown` | [`src/hooks/useCountdown.ts`](../../src/hooks/useCountdown.ts) | Trip departure countdown |
| `useNavigation` | [`src/hooks/useNavigation.ts`](../../src/hooks/useNavigation.ts) | GPS navigation logic |
| `useDriverWebSocket` | [`src/hooks/useDriverWebSocket.ts`](../../src/hooks/useDriverWebSocket.ts) | Driver real-time updates |
| `usePassengerWebSocket` | [`src/hooks/usePassengerWebSocket.ts`](../../src/hooks/usePassengerWebSocket.ts) | Passenger real-time tracking |
| `useSocketChat` | [`src/hooks/useSocketChat.ts`](../../src/hooks/useSocketChat.ts) | Real-time chat |
| `useTripStatusUpdates` | [`src/hooks/useTripStatusUpdates.ts`](../../src/hooks/useTripStatusUpdates.ts) | Trip status SSE |

---

## Data Models

### Core Models (from [`prisma/schema.prisma`](../../prisma/schema.prisma))

#### User & Authentication

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  phone         String?  @unique
  name          String
  role          UserRole @default(PASSENGER)
  // Relations: bookings, driverProfile, trips, activityOwnerProfile
}

enum UserRole {
  PASSENGER
  DRIVER
  ACTIVITY_OWNER
  ADMIN
}
```

#### Trip Management

```prisma
model Trip {
  id             String     @id
  title          String
  organizerId    String
  driverId       String?
  departureTime  DateTime
  originName     String
  destName       String
  totalSeats     Int
  availableSeats Int
  basePrice      Decimal
  tripType       TripType   @default(PRIVATE)  // PRIVATE or SHARED
  status         TripStatus @default(DRAFT)
  // Relations: bookings, driver, organizer
}

enum TripType {
  PRIVATE  // Full cab booking
  SHARED   // Per-seat booking
}

enum TripStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

#### Booking & Payment

```prisma
model Booking {
  id                String            @id
  tripId            String
  userId            String
  status            BookingStatus     @default(PENDING)
  seatsBooked       Int               @default(1)
  totalAmount       Decimal
  paymentMethodType PaymentMethodType @default(ONLINE)
  payoutSettled     Boolean           @default(false)
  // Relations: trip, user, payment
}

model Payment {
  id                 String        @id
  bookingId          String        @unique
  stripeIntentId     String?
  amount             Decimal
  status             PaymentStatus @default(PENDING)
  // Relations: booking
}

enum PaymentMethodType {
  ONLINE            // Stripe payment
  CASH_TO_DRIVER    // Pay driver directly
}
```

#### Driver Management

```prisma
model Driver {
  id                String       @id
  userId            String       @unique
  status            DriverStatus @default(PENDING)
  vehicleType       String
  rating            Float        @default(0)
  completedTrips    Int          @default(0)
  availability      String       @default("OFFLINE")
  acceptsPrivateTrips Boolean    @default(true)
  acceptsSharedTrips  Boolean    @default(true)
  // Relations: user, trips, payouts, reviews
}
```

#### Payout System

```prisma
model Payout {
  id               String       @id
  driverId         String
  amount           Decimal
  status           PayoutStatus @default(PENDING)
  periodStart      DateTime
  periodEnd        DateTime
  tripsCount       Int
  bookingsCount    Int
  // Relations: driver
}
```

**Business Rules** (see [`src/config/business.ts`](../../src/config/business.ts)):
- Platform commission: 15%
- Driver earnings: 85%
- Only `ONLINE` payments generate payouts
- `CASH_TO_DRIVER` bookings excluded from payouts

#### Activity Owner Models (⚠️ Backend Complete)

```prisma
model ActivityOwner {
  id                 String   @id
  userId             String   @unique
  businessName       String
  verificationStatus String   @default("PENDING")
  // Relations: user, activities
}

model Activity {
  id              String   @id
  ownerId         String
  title           String
  category        String   // TOUR, EXCURSION, ATTRACTION, etc.
  status          String   @default("DRAFT")
  pricePerPerson  Int
  maxParticipants Int
  // Relations: owner, photos, schedules, bookings, reviews
}

model ActivityBooking {
  id            String @id
  activityId    String
  passengerId   String
  scheduledDate DateTime
  participants  Int
  totalAmount   Int
  status        String @default("CONFIRMED")
  // Relations: activity, passenger
}
```

**Note**: Activity models are in the schema and backend APIs exist, but passenger-facing UI is not yet built.

### Model Relationships

```
User (PASSENGER)
  └── Booking → Trip → Driver
        └── Payment → Stripe
        
User (DRIVER)
  └── Driver → Trip → Bookings
        └── Payout (automated)
        
User (ACTIVITY_OWNER)
  └── ActivityOwner → Activity → ActivityBooking
```

---

## Persona-Based Workflows

### Passenger Workflow: Book a Trip

**End-to-End Flow**: Browse → Select → Book → Pay → Track → Complete

#### 1. Browse Trips
- **Entry**: Landing page [`/`](../../src/app/page.tsx)
- **Action**: Use `SearchWidget` component to search by origin/destination
- **Component**: [`src/components/landing/SearchWidget.tsx`](../../src/components/landing/SearchWidget.tsx)
- **API**: `GET /api/trips` with query params
- **File**: [`src/app/api/trips/route.ts`](../../src/app/api/trips/route.ts)

#### 2. View Trip Details
- **Page**: [`/trips/[id]`](../../src/app/trips/[id]/page.tsx)
- **API**: `GET /api/trips/[id]`
- **Shows**: Itinerary, driver info, pricing, available seats
- **Actions**: Book private cab OR book seat (shared ride)

#### 3. Create Booking
- **Component**: Booking form on trip detail page
- **API**: `POST /api/bookings` (private) or `POST /api/bookings/shared` (shared seat)
- **Files**: 
  - [`src/app/api/bookings/route.ts`](../../src/app/api/bookings/route.ts)
  - [`src/app/api/bookings/shared/route.ts`](../../src/app/api/bookings/shared/route.ts)
- **Service**: [`src/lib/services/bookingService.ts`](../../src/lib/services/bookingService.ts)
- **Models**: Creates `Booking` and `Payment` records

#### 4. Payment Processing
- **API**: `POST /api/payments/mock-success` (POC implementation)
- **File**: [`src/app/api/payments/mock-success/route.ts`](../../src/app/api/payments/mock-success/route.ts)
- **Status**: Updates `Payment.status` to `SUCCEEDED`
- **⚠️ Note**: Stripe production integration pending

#### 5. View Bookings
- **Page**: [`/my-trips`](../../src/app/my-trips/page.tsx)
- **API**: `GET /api/passengers/bookings` with filters
- **File**: [`src/app/api/passengers/bookings/route.ts`](../../src/app/api/passengers/bookings/route.ts)
- **Filters**: Date range, trip type, status

#### 6. Track Driver (Real-time)
- **Page**: [`/my-trips/[id]/track`](../../src/app/my-trips/[id]/track/page.tsx)
- **Component**: `LiveTrackingMap`
- **File**: [`src/components/tracking/LiveTrackingMap.tsx`](../../src/components/tracking/LiveTrackingMap.tsx)
- **API**: `GET /api/passengers/bookings/[bookingId]/track` (SSE)
- **File**: [`src/app/api/passengers/bookings/[bookingId]/track/route.ts`](../../src/app/api/passengers/bookings/[bookingId]/track/route.ts)
- **WebSocket**: Real-time location updates via Socket.IO
- **Handler**: [`src/lib/realtime/socketHandlers.ts`](../../src/lib/realtime/socketHandlers.ts)

#### 7. View Receipt
- **Page**: [`/my-trips/[id]/receipt`](../../src/app/my-trips/[id]/receipt/page.tsx)
- **API**: `GET /api/receipts/[bookingId]`
- **File**: [`src/app/api/receipts/[bookingId]/route.ts`](../../src/app/api/receipts/[bookingId]/route.ts)
- **Service**: [`src/lib/services/receiptService.ts`](../../src/lib/services/receiptService.ts)
- **Component**: [`src/components/receipts/Receipt.tsx`](../../src/components/receipts/Receipt.tsx)

**Sequence Diagram**:
```
Passenger → SearchWidget → GET /api/trips → TripList
Passenger → TripDetail → POST /api/bookings → Booking Created
Passenger → Payment → POST /api/payments/mock-success → Payment Succeeded
Passenger → MyTrips → GET /api/passengers/bookings → BookingList
Passenger → TrackDriver → WebSocket → Real-time Location Updates
```

---

### Driver Workflow: Accept & Complete Trip

**End-to-End Flow**: Login → Discovery → Accept → Navigate → Complete → Payout

#### 1. Driver Login
- **Page**: [`/driver/login`](../../src/app/driver/login/page.tsx)
- **API**: `POST /api/drivers/login`
- **File**: [`src/app/api/drivers/login/route.ts`](../../src/app/api/drivers/login/route.ts)
- **Auth**: Returns JWT with `DRIVER` role

#### 2. View Dashboard
- **Page**: [`/driver/portal/dashboard`](../../src/app/driver/portal/dashboard/page.tsx)
- **API**: `GET /api/drivers/dashboard`
- **Shows**: Available trips, current bookings, earnings summary

#### 3. Manage Availability
- **Component**: `AvailabilityToggle` on dashboard
- **API**: `PUT /api/drivers/availability`
- **File**: [`src/app/api/drivers/availability/route.ts`](../../src/app/api/drivers/availability/route.ts)
- **Service**: [`src/lib/services/driverAvailabilityService.ts`](../../src/lib/services/driverAvailabilityService.ts)
- **Statuses**: `AVAILABLE`, `BUSY`, `OFFLINE`

#### 4. Discover Available Trips
- **API**: `GET /api/drivers/trips/available`
- **File**: [`src/app/api/drivers/trips/available/route.ts`](../../src/app/api/drivers/trips/available/route.ts)
- **Filters**: By trip type (private/shared), distance, earnings potential
- **Real-time**: `GET /api/drivers/realtime/trips` (SSE feed)

#### 5. Accept Trip
- **Component**: `TripAcceptanceModal`
- **API**: `POST /api/drivers/trips/accept/[tripId]`
- **File**: [`src/app/api/drivers/trips/accept/[tripId]/route.ts`](../../src/app/api/drivers/trips/accept/[tripId]/route.ts)
- **Updates**: `Trip.driverId`, `Trip.status` → `IN_PROGRESS`

#### 6. Update Trip Status
- **API**: `PUT /api/drivers/trips/[tripId]/status`
- **File**: [`src/app/api/drivers/trips/[tripId]/status/route.ts`](../../src/app/api/drivers/trips/[tripId]/status/route.ts)
- **Statuses**: `IN_PROGRESS` → `COMPLETED`
- **Broadcasts**: Real-time updates to passengers via WebSocket

#### 7. GPS Navigation (During Trip)
- **Page**: [`/navigation/demo`](../../src/app/navigation/demo/page.tsx) (demo)
- **API**: `POST /api/navigation/trips/[tripId]/start`
- **Location Updates**: `PUT /api/navigation/trips/[tripId]/location`
- **Files**: 
  - [`src/app/api/navigation/trips/[tripId]/start/route.ts`](../../src/app/api/navigation/trips/[tripId]/start/route.ts)
  - [`src/app/api/navigation/trips/[tripId]/location/route.ts`](../../src/app/api/navigation/trips/[tripId]/location/route.ts)
- **Service**: [`src/lib/navigation/navigationService.ts`](../../src/lib/navigation/navigationService.ts)

#### 8. View Earnings & Payouts
- **Page**: [`/driver/portal/earnings`](../../src/app/driver/portal/earnings/page.tsx)
- **API**: `GET /api/drivers/payouts`
- **File**: [`src/app/api/drivers/payouts/route.ts`](../../src/app/api/drivers/payouts/route.ts)
- **Service**: [`src/lib/services/driverPayoutService.ts`](../../src/lib/services/driverPayoutService.ts)
- **Auto-Payout**: Triggered by admin via `POST /api/admin/payouts/run`

**Sequence Diagram**:
```
Driver → Login → POST /api/drivers/login → JWT Token
Driver → Dashboard → GET /api/drivers/trips/available → Available Trips
Driver → Accept → POST /api/drivers/trips/accept/[id] → Trip Assigned
Driver → Navigate → PUT /api/navigation/trips/[id]/location → WebSocket Broadcast
Passenger ← Real-time Location Updates
Driver → Complete → PUT /api/drivers/trips/[id]/status → Trip Completed
System → Payout Service → Creates Payout Record
```

---

### Activity Owner Workflow (⚠️ Backend Only)

**Status**: Backend APIs complete, frontend UI pending (Story #41)

#### 1. Register as Activity Owner
- **API**: `POST /api/activity-owners/register`
- **File**: [`src/app/api/activity-owners/register/route.ts`](../../src/app/api/activity-owners/register/route.ts)
- **Creates**: `User` with `ACTIVITY_OWNER` role + `ActivityOwner` profile

#### 2. Manage Activities (CRUD)
- **Create**: `POST /api/activities`
- **List**: `GET /api/activities/owner`
- **Update**: `PUT /api/activities/[id]`
- **Delete**: `DELETE /api/activities/[id]`
- **Toggle Status**: `POST /api/activities/[id]/toggle-status`
- **Files**: [`src/app/api/activities/`](../../src/app/api/activities/)
- **Service**: [`src/lib/services/activityService.ts`](../../src/lib/services/activityService.ts)
- **Validation**: [`src/lib/validations/activitySchemas.ts`](../../src/lib/validations/activitySchemas.ts)

#### 3. View Bookings
- **API**: `GET /api/activities/[id]/bookings`
- **File**: [`src/app/api/activities/[id]/bookings/route.ts`](../../src/app/api/activities/[id]/bookings/route.ts)

**⚠️ Frontend Gap**: 
- Dashboard UI scaffolded at [`/activity-owners/dashboard`](../../src/app/activity-owners/dashboard/page.tsx)
- Needs full implementation of activity management UI
- Passenger activity browsing UI not built (Story #41)

---

### Admin Workflow

#### 1. Manual Driver Registration
- **Page**: [`/admin/drivers/new`](../../src/app/admin/drivers/new/page.tsx)
- **API**: `POST /api/admin/drivers` (implicit via form submission)
- **Creates**: `Driver` profile with admin approval

#### 2. Driver Approval
- **Page**: [`/admin/drivers`](../../src/app/admin/drivers/page.tsx)
- **API**: `POST /api/admin/approvals/driver`
- **File**: [`src/app/api/admin/approvals/driver/route.ts`](../../src/app/api/admin/approvals/driver/route.ts)
- **Actions**: Approve or reject driver applications

#### 3. Run Payouts
- **API**: `POST /api/admin/payouts/run`
- **File**: [`src/app/api/admin/payouts/run/route.ts`](../../src/app/api/admin/payouts/run/route.ts)
- **Service**: [`src/lib/services/driverPayoutService.ts`](../../src/lib/services/driverPayoutService.ts)
- **Logic**: 
  - Finds unpaid bookings (`payoutSettled=false`)
  - Calculates driver earnings (85% of `ONLINE` payments)
  - Creates `Payout` records
  - Uses `MockPayoutAdapter` (production uses Stripe Connect)

**⚠️ Frontend Gap**: Admin monitoring dashboard (Story #42) - Implementation plan ready at [`docs/implementation-plans/42-admin-monitor-bookings-and-revenue.md`](../../docs/implementation-plans/42-admin-monitor-bookings-and-revenue.md)

---

## API Reference

### Quick Reference: API Routes by Domain

#### Trip APIs
```
GET    /api/trips                    # List trips
POST   /api/trips                    # Create trip
GET    /api/trips/[id]               # Get trip details
PUT    /api/trips/[id]               # Update trip
DELETE /api/trips/[id]               # Delete trip
POST   /api/trips/[id]/broadcast-offer  # Broadcast to drivers
```

#### Booking APIs (Passenger)
```
POST   /api/bookings                 # Book private trip
POST   /api/bookings/shared          # Book shared seat
GET    /api/passengers/bookings      # List bookings (with filters)
GET    /api/passengers/bookings/[id] # Get booking details
PATCH  /api/passengers/bookings/[id]/cancel  # Cancel booking
GET    /api/passengers/bookings/[id]/track   # Real-time tracking (SSE)
```

#### Driver Portal APIs
```
POST   /api/drivers/login            # Driver login
GET    /api/drivers/dashboard        # Dashboard data
GET    /api/drivers/trips/available  # Available trips
POST   /api/drivers/trips/accept/[id]  # Accept trip
PUT    /api/drivers/trips/[id]/status  # Update trip status
PUT    /api/drivers/availability      # Update availability
GET    /api/drivers/payouts           # List payouts
GET    /api/drivers/earnings/[id]     # Earnings summary
```

#### Activity Owner APIs (Backend Complete)
```
POST   /api/activities               # Create activity
GET    /api/activities/owner         # List owner's activities
GET    /api/activities/[id]          # Get activity
PUT    /api/activities/[id]          # Update activity
DELETE /api/activities/[id]          # Delete activity
POST   /api/activities/[id]/toggle-status  # Activate/deactivate
GET    /api/activities/[id]/bookings # Activity bookings
```

#### Payment APIs
```
POST   /api/payments/mock-success    # Mock payment (POC)
```
**⚠️ Note**: Production Stripe integration pending

#### Receipt APIs
```
GET    /api/receipts/[bookingId]     # Get receipt data
```

#### Admin APIs
```
GET    /api/admin/drivers            # List drivers
POST   /api/admin/approvals/driver   # Approve/reject driver
GET    /api/admin/documents          # Document verification queue
POST   /api/admin/payouts/run        # Trigger payout processing
```

#### Real-time APIs
```
GET    /api/socket                   # WebSocket connection
GET    /api/realtime/trip-status/[id]  # SSE trip status updates
```

#### Location & Navigation
```
GET    /api/locations/autocomplete   # Google Places autocomplete
GET    /api/navigation/route         # Get route directions
POST   /api/navigation/trips/[id]/start  # Start navigation
PUT    /api/navigation/trips/[id]/location  # Update driver location
```

#### Authentication
```
POST   /api/otp/send                 # Send OTP
POST   /api/otp/verify               # Verify OTP
POST   /api/auth/refresh             # Refresh JWT
```

### API Implementation Pattern

Most APIs follow this structure:

```typescript
// Example: src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { bookingService } from '@/lib/services/bookingService';
import { bookingSchema } from '@/lib/validations/bookingSchemas';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Validate input
    const body = await req.json();
    const validatedData = bookingSchema.parse(body);
    
    // 3. Business logic via service layer
    const booking = await bookingService.createBooking({
      ...validatedData,
      userId: user.id,
    });
    
    // 4. Return response
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Code Conventions

### Project Structure Conventions

1. **File Naming**:
   - Components: PascalCase (e.g., `TripCard.tsx`)
   - Utilities: camelCase (e.g., `formatCurrency.ts`)
   - API routes: `route.ts` (Next.js convention)
   - Pages: `page.tsx` (Next.js convention)

2. **Folder Organization**:
   - Group by feature/domain (e.g., `components/driver/`, `lib/services/`)
   - Co-locate related files (e.g., components with their styles)

3. **Import Order**:
   ```typescript
   // 1. External dependencies
   import React from 'react';
   import { NextRequest } from 'next/server';
   
   // 2. Internal utilities
   import { formatCurrency } from '@/lib/utils';
   
   // 3. Components
   import { Button } from '@/components/ui/Button';
   
   // 4. Types
   import type { Booking } from '@/types/booking';
   ```

### Code Style

1. **TypeScript**: Strict mode enabled (`tsconfig.json`)
   - Always define types/interfaces
   - Avoid `any` type
   - Use Zod for runtime validation

2. **Components**:
   - Functional components only (no class components)
   - Use TypeScript interfaces for props
   - Example:
     ```typescript
     interface TripCardProps {
       trip: Trip;
       onBook: (tripId: string) => void;
     }
     
     export function TripCard({ trip, onBook }: TripCardProps) {
       // Component logic
     }
     ```

3. **Error Handling**:
   - Use try/catch in API routes
   - Return proper HTTP status codes
   - Log errors with context

4. **Database Queries**:
   - Use Prisma Client: `import { prisma } from '@/lib/prisma';`
   - Always use transactions for multi-step operations
   - Example:
     ```typescript
     const booking = await prisma.$transaction(async (tx) => {
       const booking = await tx.booking.create({ data });
       await tx.payment.create({ data: paymentData });
       return booking;
     });
     ```

### Validation

Use Zod schemas for all user inputs:

```typescript
// src/lib/validations/bookingSchemas.ts
import { z } from 'zod';

export const createBookingSchema = z.object({
  tripId: z.string().cuid(),
  seatsBooked: z.number().int().positive(),
  passengers: z.array(passengerSchema),
});
```

Reference: [`src/lib/validations/`](../../src/lib/validations/)

### Business Rules

Centralized in [`src/config/business.ts`](../../src/config/business.ts):

```typescript
export const BUSINESS_CONFIG = {
  platformFeePercentage: 15,
  driverEarningsPercentage: 85,
  currency: 'KZT',
  // ...
};
```

### Authentication Pattern

```typescript
// In API route
import { verifyAuth } from '@/lib/auth/jwt';

const user = await verifyAuth(req);
if (!user || user.role !== 'DRIVER') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

Reference: [`src/lib/auth/jwt.ts`](../../src/lib/auth/jwt.ts)

---

## Development Workflow

### Feature Development Process

1. **Understand the Story**:
   - Read user story in [`docs/stories/`](../../docs/stories/)
   - Review implementation plan in [`docs/implementation-plans/`](../../docs/implementation-plans/)

2. **Database Changes**:
   ```bash
   # Edit schema
   vim prisma/schema.prisma
   
   # Create migration
   npx prisma migrate dev --name add_feature_name
   
   # Generate client
   npm run db:generate
   ```

3. **Implement Service Layer** (Business Logic):
   - Create service in `src/lib/services/`
   - Add Zod validation in `src/lib/validations/`
   - Example: [`src/lib/services/bookingService.ts`](../../src/lib/services/bookingService.ts)

4. **Create API Routes**:
   - Add route in `src/app/api/`
   - Follow RESTful conventions
   - Use authentication/authorization

5. **Build Frontend**:
   - Create page in `src/app/`
   - Build components in `src/components/`
   - Use hooks for state management

6. **Testing** (Manual):
   ```bash
   # Start dev server
   npm run dev
   
   # Test in browser
   # Use Prisma Studio to inspect DB
   npm run db:studio
   ```

7. **Documentation**:
   - Update this guide if adding major features
   - Document API changes in [`docs/api/`](../../docs/api/)

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/passenger-activity-booking

# Make changes
git add .
git commit -m "feat: implement passenger activity booking UI"

# Push and create PR
git push origin feature/passenger-activity-booking
```

### Debugging Tips

1. **Database Issues**:
   ```bash
   # View data
   npm run db:studio
   
   # Reset database (⚠️ deletes all data)
   npx prisma migrate reset
   ```

2. **API Debugging**:
   - Check Network tab in browser DevTools
   - Add console.log in API routes
   - Use Postman/Thunder Client for API testing

3. **WebSocket Issues**:
   - Check Socket.IO connection in browser console
   - Inspect [`src/lib/realtime/socketHandlers.ts`](../../src/lib/realtime/socketHandlers.ts)

4. **Environment Variables**:
   - Ensure `.env.local` is properly configured
   - Restart dev server after changing env vars

---

## Feature Gaps & Roadmap

### Completed (MVP - Nov 2025) ✅

- ✅ Trip browsing and search
- ✅ Trip creation with itinerary
- ✅ Private cab booking
- ✅ Shared ride seat booking
- ✅ Payment processing (POC)
- ✅ Real-time driver tracking
- ✅ Trip history and receipts
- ✅ Driver portal (dashboard, earnings, availability)
- ✅ Driver payouts (automated)
- ✅ Activity Owner backend (CRUD APIs, models)
- ✅ Real-time chat
- ✅ GPS navigation

### In Progress 🚧

1. **Activity Owner Frontend (Story #41)**:
   - Status: Backend complete, frontend scaffolded
   - Gap: Need full dashboard UI for managing activities
   - Plan: [`docs/implementation-plans/41-passenger-browse-and-book-activities.md`](../../docs/implementation-plans/41-passenger-browse-and-book-activities.md)
   - Deliverables:
     - Activity management dashboard
     - Passenger activity browsing UI
     - Activity booking flow

2. **Admin Monitoring Dashboard (Story #42)**:
   - Status: Implementation plan ready
   - Gap: No admin dashboard for monitoring bookings/revenue
   - Plan: [`docs/implementation-plans/42-admin-monitor-bookings-and-revenue.md`](../../docs/implementation-plans/42-admin-monitor-bookings-and-revenue.md)
   - Deliverables:
     - Real-time booking monitor
     - Revenue analytics
     - Driver performance metrics

3. **Stripe Production Integration**:
   - Status: Mock payment POC complete
   - Gap: Need full Stripe integration
   - Tasks:
     - Replace `MockPayoutAdapter` with Stripe Connect
     - Implement webhook handlers
     - Add payment method management

### Upcoming Features ❌

1. **Push Notifications**:
   - Trip updates to passengers
   - Trip offers to drivers
   - Booking confirmations

2. **Multi-language Support**:
   - English, Russian, Kazakh
   - i18n setup

3. **Mobile App**:
   - React Native or Flutter
   - Leverage existing APIs

4. **Advanced Analytics**:
   - Driver performance dashboard
   - Revenue forecasting
   - User behavior insights

### Known Technical Debt

1. **Testing**:
   - No automated tests yet
   - Need unit tests for services
   - Need integration tests for APIs

2. **Error Handling**:
   - Inconsistent error responses across APIs
   - Need global error handler

3. **Performance**:
   - No caching layer (Redis planned)
   - API response optimization needed

4. **Security**:
   - Rate limiting not implemented
   - Need CSRF protection
   - Input sanitization improvements

---

## Additional Resources

### Key Documentation Files

- **Architecture Map**: [`STEPPERGO_COMPONENT_MAP_AND_GAP_ANALYSIS.md`](../../STEPPERGO_COMPONENT_MAP_AND_GAP_ANALYSIS.md)
- **Implementation Plans**: [`docs/implementation-plans/`](../../docs/implementation-plans/)
- **User Stories**: [`docs/stories/`](../../docs/stories/)
- **API Documentation**: [`docs/api/`](../../docs/api/)

### Quick Reference Guides

- **Stories 33-42 Index**: [`docs/STORIES_33-42_INDEX.md`](../../docs/STORIES_33-42_INDEX.md)
- **Quick Start**: [`QUICK_START.md`](../../QUICK_START.md)
- **GPS Navigation**: [`docs/GPS_NAVIGATION.md`](../../docs/GPS_NAVIGATION.md)
- **WebSocket Features**: [`docs/WEBSOCKET_REALTIME_FEATURES.md`](../../docs/WEBSOCKET_REALTIME_FEATURES.md)

### External Documentation

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Stripe API](https://stripe.com/docs/api)

---

## Getting Help

### Development Support

1. **Code Questions**: Review this guide and existing code examples
2. **Architecture Questions**: See [`STEPPERGO_COMPONENT_MAP_AND_GAP_ANALYSIS.md`](../../STEPPERGO_COMPONENT_MAP_AND_GAP_ANALYSIS.md)
3. **Feature Implementation**: Check [`docs/implementation-plans/`](../../docs/implementation-plans/) for detailed specs
4. **Database Schema**: Review [`prisma/schema.prisma`](../../prisma/schema.prisma) with comments

### Common Issues

1. **Build Errors**: Clear `.next` folder and rebuild
2. **Database Connection**: Check `DATABASE_URL` in `.env.local`
3. **Google Maps Not Loading**: Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
4. **WebSocket Not Connecting**: Ensure Socket.IO server is running

---

**Welcome to StepperGO! 🚀**

This guide should help you get started quickly. As you work on features, feel free to update this document to reflect your learnings and keep it current for future developers.

For questions or clarifications, reach out to the team lead or check the implementation plans for specific features.
