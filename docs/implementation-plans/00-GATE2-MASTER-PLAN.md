# Gate 2 Implementation Plans - Master Document

## Overview
This document provides implementation planning for all Gate 2 user stories (Epics A-G). Each epic has detailed technical specifications aligned with the new product architecture.

**Date:** November 2025  
**Target:** Gate 2 MVP Launch  
**Timeline:** 8 weeks  

---

## Technical Stack

### Frontend
- **Framework**: Next.js 14.2.33 (App Router)
- **Language**: TypeScript 5.6 (strict mode)
- **Styling**: TailwindCSS 3.4 + shadcn/ui
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Supabase PostgreSQL with PostGIS extension
- **ORM**: Prisma 6.18.0
- **Auth**: JWT tokens (24-hour expiry)
- **API**: Next.js API Routes (App Router)

### External Services
- **Payments**: Stripe Checkout + Webhooks
- **SMS OTP**: Twilio
- **Email OTP**: Resend
- **Analytics**: PostHog
- **Geocoding**: Mapbox API

---

## Epic B — Booking (Private vs Shared)

### B.1 - Traveler Identity (OTP Verification)

**Implementation Priority:** P0 (Blocker for all bookings)

**Key Components:**
```
src/app/auth/
├── verify/
│   ├── page.tsx              # OTP verification page
│   └── components/
│       ├── OTPInput.tsx      # 6-digit input
│       ├── ContactInput.tsx  # Phone/email input
│       └── ResendTimer.tsx   # 30s countdown
├── api/
│   ├── send-otp/route.ts     # POST /api/auth/send-otp
│   └── verify-otp/route.ts   # POST /api/auth/verify-otp
```

**Database Schema:**
```prisma
model User {
  id              String    @id @default(uuid())
  role            Role      @default(TRAVELLER)
  name            String?
  phone           String?   @unique
  email           String?   @unique
  otp_verified_at DateTime?
  status          UserStatus @default(ACTIVE)
  created_at      DateTime  @default(now())
}

enum Role {
  TRAVELLER
  DRIVER
  ADMIN
}
```

**API Endpoints:**

1. **POST /api/auth/send-otp**
```typescript
interface SendOTPRequest {
  channel: 'sms' | 'email';
  value: string; // phone or email
  name?: string;
}

interface SendOTPResponse {
  success: boolean;
  otp_token: string; // Hashed, for verification
  expires_at: string; // 10 minutes
  retry_after?: number; // If rate-limited
}
```

2. **POST /api/auth/verify-otp**
```typescript
interface VerifyOTPRequest {
  otp_token: string;
  otp_code: string; // 6 digits
}

interface VerifyOTPResponse {
  success: boolean;
  user: { id: string; role: string };
  access_token: string; // JWT
  error?: string;
}
```

**Implementation Steps:**
1. [ ] Install Twilio SDK: `npm install twilio`
2. [ ] Install Resend SDK: `npm install resend`
3. [ ] Create OTP service in `/src/lib/otp-service.ts`
4. [ ] Implement rate limiting (5 requests/hour per phone/email)
5. [ ] Add OTP verification UI with 6-digit input
6. [ ] Implement 3-attempt throttle logic
7. [ ] Add fallback channel (email if SMS fails)
8. [ ] PostHog events: `otp_requested`, `otp_verified_success/failed`

**Testing:**
- [ ] Unit tests for OTP generation/validation
- [ ] Integration tests for Twilio/Resend
- [ ] E2E test: Full OTP flow
- [ ] Rate limiting tests

---

### B.2 - Private Booking (Whole Vehicle)

**Implementation Priority:** P0

**Key Components:**
```
src/app/bookings/
├── private/
│   └── [tripId]/
│       ├── page.tsx          # Private booking page
│       └── components/
│           ├── VehicleDetails.tsx
│           ├── PriceEstimate.tsx
│           └── BookingForm.tsx
```

**Database Schema:**
```prisma
model Booking {
  id              String   @id @default(uuid())
  trip_id         String
  user_id         String
  type            BookingType // 'private' | 'shared'
  seats           Int      // = trip.seat_capacity for private
  status          BookingStatus
  hold_expires_at DateTime? // NULL for private
  created_at      DateTime @default(now())
  
  trip Trip @relation(fields: [trip_id], references: [id])
  user User @relation(fields: [user_id], references: [id])
}

enum BookingType {
  PRIVATE
  SHARED
}

enum BookingStatus {
  PENDING
  HELD
  PAID
  DRIVER_ACCEPTED
  COMPLETED
  CANCELLED
  EXPIRED
}
```

**API Endpoints:**

**POST /api/bookings/private**
```typescript
interface CreatePrivateBookingRequest {
  trip_id: string;
  notes?: string;
}

interface CreatePrivateBookingResponse {
  booking_id: string;
  trip: TripSummary;
  pricing: { total: number; currency: string };
  next_step: 'payment';
}
```

**Implementation Steps:**
1. [ ] Create private booking UI with "Request Private Ride" CTA
2. [ ] Implement seat locking logic (all seats reserved)
3. [ ] Add atomic transaction for booking creation
4. [ ] Trip visibility update: Remove from public list after driver accepts
5. [ ] Driver notification: Email/SMS to driver
6. [ ] PostHog event: `private_booking_submitted`

**Edge Cases:**
- Multiple simultaneous private booking attempts → First wins (DB constraint)
- User cancels before driver accepts → Trip returns to public list
- Driver declines → Full refund + trip returns to public

---

### B.3 - Shared Booking (Per-Seat)

**Implementation Priority:** P0

**Key Components:**
```
src/app/bookings/
├── shared/
│   └── [tripId]/
│       ├── page.tsx          # Shared booking page
│       └── components/
│           ├── SeatSelector.tsx  # 1-4 seats
│           ├── PriceCalculator.tsx
│           ├── SoftHoldTimer.tsx # 10-min countdown
│           └── CapacityIndicator.tsx
```

**Database Addition:**
```prisma
model Booking {
  // ... existing fields
  hold_expires_at DateTime? // NOW() + 10 minutes for shared
}
```

**API Endpoints:**

**POST /api/bookings/shared**
```typescript
interface CreateSharedBookingRequest {
  trip_id: string;
  seats: number; // 1-4
}

interface CreateSharedBookingResponse {
  booking_id: string;
  status: 'held';
  hold_expires_at: string; // ISO timestamp
  pricing: PricingBreakdown;
  payment_url: string;
}
```

**Implementation Steps:**
1. [ ] Create seat selector UI (dropdown/increment buttons)
2. [ ] Implement soft hold logic (10-minute timer)
3. [ ] Add real-time capacity check with row-level lock:
```sql
BEGIN;
SELECT * FROM trips WHERE id = $1 FOR UPDATE;
-- Calculate available seats
-- Create booking if capacity available
COMMIT;
```
4. [ ] Cron job to expire holds (every 1 minute)
5. [ ] Hold expiry UI: "Your hold expired. Please try again."
6. [ ] PostHog events: `shared_booking_held`, `shared_booking_expired`

**Capacity Enforcement:**
```typescript
// lib/capacity-check.ts
export async function checkCapacity(tripId: string, seatsRequested: number) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }});
  const activeBookings = await prisma.booking.aggregate({
    where: {
      trip_id: tripId,
      status: { in: ['HELD', 'PAID', 'DRIVER_ACCEPTED'] }
    },
    _sum: { seats: true }
  });
  
  const seatsBooked = activeBookings._sum.seats || 0;
  const availableSeats = trip.seat_capacity - seatsBooked;
  
  return availableSeats >= seatsRequested;
}
```

---

## Epic C — Payments (Stripe)

### C.1 - Card Checkout via Stripe

**Implementation Priority:** P0

**Key Components:**
```
src/app/checkout/
├── [bookingId]/
│   ├── page.tsx              # Checkout page
│   └── components/
│       ├── StripeCheckout.tsx
│       ├── PriceSummary.tsx
│       └── BookingRecap.tsx
src/app/api/
├── checkout/
│   └── create-session/route.ts
└── webhooks/
    └── stripe/route.ts
```

**Stripe Setup:**
```bash
npm install @stripe/stripe-js stripe
```

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**API Endpoints:**

**POST /api/checkout/create-session**
```typescript
interface CreateCheckoutRequest {
  booking_id: string;
}

interface CreateCheckoutResponse {
  session_id: string;
  session_url: string;
}
```

**Implementation:**
```typescript
// app/api/checkout/create-session/route.ts
import Stripe from 'stripe';

export async function POST(req: Request) {
  const { booking_id } = await req.json();
  
  const booking = await prisma.booking.findUnique({
    where: { id: booking_id },
    include: { trip: true }
  });
  
  const platformFeePct = await getPlatformFee(); // Default 15%
  const subtotal = booking.seats * booking.trip.price_per_seat;
  const platformFee = subtotal * (platformFeePct / 100);
  const total = subtotal + platformFee;
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${booking.trip.origin} → ${booking.trip.destination}`,
          description: `${booking.seats} seat(s)`
        },
        unit_amount: Math.round(total * 100) // cents
      },
      quantity: 1
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/bookings/${booking_id}/confirmed`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/trips/${booking.trip_id}`,
    metadata: { booking_id }
  });
  
  return Response.json({ session_id: session.id, session_url: session.url });
}
```

**Webhook Handler:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const event = stripe.webhooks.constructEvent(
    body,
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const booking_id = session.metadata.booking_id;
    
    // Update booking
    await prisma.booking.update({
      where: { id: booking_id },
      data: { status: 'PAID' }
    });
    
    // Create payment record
    await prisma.payment.create({
      data: {
        booking_id,
        stripe_payment_intent_id: session.payment_intent,
        total_amount: session.amount_total / 100,
        platform_fee_pct: 15,
        platform_fee_amount: (session.amount_total / 100) * 0.15,
        driver_payout_amount: (session.amount_total / 100) * 0.85
      }
    });
    
    // Notify driver
    await notifyDriver(booking_id);
    
    // PostHog event
    await trackEvent('payment_succeeded', { booking_id });
  }
  
  return Response.json({ received: true });
}
```

**Implementation Steps:**
1. [ ] Set up Stripe account + API keys
2. [ ] Create Checkout Session API
3. [ ] Build Stripe Checkout UI
4. [ ] Implement webhook endpoint
5. [ ] Add webhook signature verification
6. [ ] Create payment confirmation page
7. [ ] Send email/SMS receipt
8. [ ] Test 3D Secure flow

---

### C.2 - Platform Fees & Ledgers

**Implementation Priority:** P1

**Database Schema:**
```prisma
model Payment {
  id                        String   @id @default(uuid())
  booking_id                String   @unique
  stripe_payment_intent_id  String   @unique
  total_amount              Decimal  @db.Decimal(10, 2)
  platform_fee_pct          Decimal  @db.Decimal(5, 2)
  platform_fee_amount       Decimal  @db.Decimal(10, 2)
  driver_payout_amount      Decimal  @db.Decimal(10, 2)
  status                    PaymentStatus @default(PENDING)
  created_at                DateTime @default(now())
  
  booking Booking @relation(fields: [booking_id], references: [id])
}

model PlatformSettings {
  key        String   @id
  value      String
  updated_at DateTime @updatedAt
  updated_by String
}
```

**Admin Pages:**
```
src/app/admin/
├── payments/
│   ├── page.tsx          # Ledger view
│   └── components/
│       ├── PaymentTable.tsx
│       ├── ExportCSV.tsx
│       └── FeeConfig.tsx
└── settings/
    └── fees/
        └── page.tsx      # Fee configuration
```

**Implementation Steps:**
1. [ ] Create admin payments ledger page
2. [ ] Add filters (date range, driver, status)
3. [ ] Implement CSV export
4. [ ] Fee configuration UI (5-30% range)
5. [ ] Driver payout summary view
6. [ ] Audit logging for fee changes

---

## Epic D — Driver Portal

### D.1 - Driver Sign-In

**Database Schema:**
```prisma
model User {
  // ... existing fields
  password_hash        String?
  password_changed_at  DateTime?
  failed_login_attempts Int     @default(0)
  lockout_until        DateTime?
}
```

**Implementation:**
```
src/app/driver/
├── login/
│   └── page.tsx
└── api/
    └── auth/
        └── driver-login/route.ts
```

**Steps:**
1. [ ] Install bcrypt: `npm install bcrypt @types/bcrypt`
2. [ ] Create driver login page
3. [ ] Implement password hashing (bcrypt, 10 rounds)
4. [ ] Force password change on first login
5. [ ] 5-attempt lockout (15 minutes)
6. [ ] JWT with role check middleware

---

### D.2 - Accept/Decline Booking (Atomic Lock)

**Database Schema:**
```prisma
model DriverAssignment {
  id          String   @id @default(uuid())
  trip_id     String   @unique
  driver_id   String
  status      AssignmentStatus
  accepted_at DateTime?
  completed_at DateTime?
  
  trip   Trip   @relation(fields: [trip_id], references: [id])
  driver Driver @relation(fields: [driver_id], references: [id])
}
```

**Atomic Accept Logic:**
```typescript
// app/api/driver/accept-booking/route.ts
export async function POST(req: Request) {
  const { booking_id } = await req.json();
  const driverId = getDriverIdFromSession(req);
  
  try {
    await prisma.$transaction(async (tx) => {
      // Lock trip row
      const trip = await tx.trip.findUnique({
        where: { id: booking.trip_id },
        // Use raw query for row-level lock
      });
      
      // Check: No existing driver assignment
      const existing = await tx.driverAssignment.findUnique({
        where: { trip_id: trip.id }
      });
      
      if (existing) throw new Error('Already accepted');
      
      // Check: No timeslot conflict for driver
      const conflict = await checkTimeslotConflict(driverId, trip);
      if (conflict) throw new Error('Timeslot conflict');
      
      // Update booking
      await tx.booking.update({
        where: { id: booking_id },
        data: { status: 'DRIVER_ACCEPTED', accepted_at: new Date() }
      });
      
      // Create assignment
      await tx.driverAssignment.create({
        data: {
          trip_id: trip.id,
          driver_id: driverId,
          status: 'ACCEPTED',
          accepted_at: new Date()
        }
      });
    });
    
    // Success: Notify traveler
    await notifyTraveler(booking_id);
    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 409 });
  }
}
```

---

### D.3 - Mark Trip Complete

**Implementation:**
```typescript
// app/api/driver/complete-trip/route.ts
export async function POST(req: Request) {
  const { trip_id } = await req.json();
  
  await prisma.$transaction(async (tx) => {
    // Update all bookings
    await tx.booking.updateMany({
      where: { trip_id, status: 'DRIVER_ACCEPTED' },
      data: { status: 'COMPLETED', completed_at: new Date() }
    });
    
    // Update trip
    await tx.trip.update({
      where: { id: trip_id },
      data: { status: 'COMPLETED', completed_at: new Date() }
    });
    
    // Update assignment
    await tx.driverAssignment.update({
      where: { trip_id },
      data: { status: 'COMPLETED', completed_at: new Date() }
    });
  });
  
  // Send review prompts to travelers
  const bookings = await prisma.booking.findMany({ where: { trip_id }});
  for (const booking of bookings) {
    await sendReviewEmail(booking.user_id, trip_id);
  }
  
  return Response.json({ success: true });
}
```

---

### D.4 - Geofilter (50km Radius)

**Database Schema:**
```prisma
model Driver {
  // ... existing fields
  home_location Unsupported("geography(Point, 4326)")
}

model Trip {
  // ... existing fields
  origin_location      Unsupported("geography(Point, 4326)")
  destination_location Unsupported("geography(Point, 4326)")
}
```

**Enable PostGIS:**
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Geofilter Query:**
```typescript
// lib/driver-trips.ts
export async function getDriverTrips(driverId: string, geofilter = true) {
  const driver = await prisma.driver.findUnique({ where: { id: driverId }});
  
  if (!geofilter) {
    return prisma.trip.findMany({ where: { status: 'LIVE' }});
  }
  
  // Raw SQL for PostGIS distance query
  return prisma.$queryRaw`
    SELECT *,
      ST_Distance(
        origin_location::geography,
        ${driver.home_location}::geography
      ) / 1000 AS distance_km
    FROM trips
    WHERE status = 'LIVE'
      AND ST_DWithin(
        origin_location::geography,
        ${driver.home_location}::geography,
        50000  -- 50km in meters
      )
    ORDER BY distance_km ASC
  `;
}
```

---

## Epic E — Admin Console

### E.1 - Admin Trip Approval

**Database Schema:**
```prisma
model Trip {
  // ... existing fields
  status          TripStatus @default(DRAFT)
  submitted_at    DateTime?
  reviewed_at     DateTime?
  reviewed_by     String?
  rejection_reason String?
}

model TripAuditLog {
  id        String   @id @default(uuid())
  trip_id   String
  admin_id  String
  action    String   // 'approved' | 'rejected' | 'edited'
  reason    String?
  notes     String?
  timestamp DateTime @default(now())
  
  trip  Trip @relation(fields: [trip_id], references: [id])
  admin User @relation(fields: [admin_id], references: [id])
}

enum TripStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  LIVE
  COMPLETED
  CANCELLED
}
```

**API Endpoint:**
```typescript
// app/api/admin/trips/approve/route.ts
export async function POST(req: Request) {
  const { trip_id, action, reason } = await req.json();
  const adminId = getAdminIdFromSession(req);
  
  await prisma.$transaction(async (tx) => {
    // Update trip
    await tx.trip.update({
      where: { id: trip_id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewed_at: new Date(),
        reviewed_by: adminId,
        rejection_reason: action === 'reject' ? reason : null
      }
    });
    
    // If approved, set to LIVE
    if (action === 'approve') {
      await tx.trip.update({
        where: { id: trip_id },
        data: { status: 'LIVE' }
      });
    }
    
    // Create audit log
    await tx.tripAuditLog.create({
      data: {
        trip_id,
        admin_id: adminId,
        action,
        reason,
        timestamp: new Date()
      }
    });
  });
  
  // Notify driver
  await notifyDriverOfApproval(trip_id, action);
  
  return Response.json({ success: true });
}
```

---

### E.2 - Admin Driver Management

**Database Schema:**
```prisma
model Driver {
  id                       String   @id @default(uuid())
  user_id                  String   @unique
  license_no               String   @unique
  license_expiry           DateTime
  license_photo_url        String?
  insurance_policy_no      String
  insurance_expiry         DateTime
  insurance_doc_url        String?
  vehicle_registration_no  String
  vehicle_registration_doc_url String?
  vehicle_type             VehicleType
  seat_capacity            Int
  vehicle_plate            String
  vehicle_make_model       String?
  vehicle_year             Int?
  home_location            Unsupported("geography(Point, 4326)")
  background_check_url     String?
  created_at               DateTime @default(now())
  updated_at               DateTime @updatedAt
  
  user User @relation(fields: [user_id], references: [id])
}

enum VehicleType {
  SEDAN
  SUV
  VAN
  BUS
}
```

**Document Upload:**
```typescript
// Use Supabase Storage
import { createClient } from '@supabase/supabase-js';

export async function uploadDriverDocument(
  driverId: string,
  file: File,
  docType: 'license' | 'insurance' | 'registration'
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const filePath = `drivers/${driverId}/documents/${docType}-${Date.now()}.${file.name.split('.').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('driver-documents')
    .upload(filePath, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('driver-documents')
    .getPublicUrl(filePath);
  
  return publicUrl;
}
```

**Document Expiry Alerts:**
```typescript
// Run daily cron job
export async function checkDocumentExpiry() {
  const drivers = await prisma.driver.findMany({
    where: {
      OR: [
        { license_expiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }},
        { insurance_expiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }}
      ]
    },
    include: { user: true }
  });
  
  for (const driver of drivers) {
    if (isExpiringSoon(driver.license_expiry, 30)) {
      await sendExpiryAlert(driver.user.email, 'license', driver.license_expiry);
    }
    // ... same for insurance
  }
}
```

---

## Epic F — Analytics (PostHog)

### F.1 - PostHog Event Tracking

**Setup:**
```bash
npm install posthog-js posthog-node
```

**Environment:**
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Client-Side Initialization:**
```typescript
// app/providers.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    autocapture: false, // Manual events only
    capture_pageviews: true
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

**Event Tracking Wrapper:**
```typescript
// lib/analytics.ts
import posthog from 'posthog-js';

export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  if (typeof window === 'undefined') return;
  
  // Sanitize PII
  const sanitized = { ...properties };
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.name;
  
  posthog.capture(eventName, sanitized);
};

// Usage examples:
trackEvent('trip_list_viewed', { total_trips: 10 });
trackEvent('trip_detail_viewed', { trip_id: '123', price_per_seat: 50 });
trackEvent('booking_started', { trip_id: '123', booking_type: 'shared' });
trackEvent('otp_verified_success', { channel: 'sms' });
trackEvent('payment_succeeded', { booking_id: '456', amount: 100 });
```

**Server-Side Events:**
```typescript
// lib/analytics-server.ts
import { PostHog } from 'posthog-node';

const posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!);

export async function trackServerEvent(
  eventName: string,
  distinctId: string,
  properties?: Record<string, any>
) {
  posthogServer.capture({
    distinctId,
    event: eventName,
    properties
  });
}

// Usage in API routes:
await trackServerEvent('payment_succeeded', userId, { booking_id, amount });
```

---

### F.2 - Analytics Funnel Dashboard

**PostHog Funnel Setup:**
1. Go to PostHog → Insights → New Funnel
2. Configure steps:
   - `trip_list_viewed`
   - `trip_detail_viewed`
   - `booking_started`
   - `otp_verified_success`
   - `payment_initiated`
   - `payment_succeeded`
   - `driver_booking_accepted`
3. Save as "Booking Funnel"

**Custom Admin Dashboard:**
```typescript
// app/admin/analytics/page.tsx
import { useQuery } from '@tanstack/react-query';

export default function AnalyticsPage() {
  const { data: metrics } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/metrics');
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  });
  
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          target="15%"
        />
        <MetricCard
          title="Avg Driver Accept Time"
          value={`${metrics.avgAcceptTime} min`}
          target="<5 min"
        />
        <MetricCard
          title="Payment Success Rate"
          value={`${metrics.paymentSuccessRate}%`}
          target=">95%"
        />
        <MetricCard
          title="Trips This Month"
          value={metrics.monthlyTrips}
          target="50+"
        />
      </div>
      
      {/* Embed PostHog dashboard */}
      <iframe
        src={`https://app.posthog.com/embedded/dashboard-id`}
        className="w-full h-[600px]"
      />
    </div>
  );
}
```

---

## Epic G — Policies

### G.1 - Cancellation & Refunds

**Refund Logic:**
```typescript
// lib/refund-policy.ts
export function calculateRefund(
  departureAt: Date,
  totalPaid: number
): { percent: number; amount: number } {
  const hoursUntil = (departureAt.getTime() - Date.now()) / (1000 * 60 * 60);
  
  if (hoursUntil > 48) {
    return { percent: 100, amount: totalPaid };
  } else if (hoursUntil > 24) {
    return { percent: 50, amount: totalPaid * 0.5 };
  } else {
    return { percent: 0, amount: 0 };
  }
}

// app/api/bookings/cancel/route.ts
export async function POST(req: Request) {
  const { booking_id, reason } = await req.json();
  
  const booking = await prisma.booking.findUnique({
    where: { id: booking_id },
    include: { trip: true, payment: true }
  });
  
  const { percent, amount } = calculateRefund(
    booking.trip.departure_at,
    booking.payment.total_amount
  );
  
  if (amount > 0) {
    // Stripe refund
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.refunds.create({
      payment_intent: booking.payment.stripe_payment_intent_id,
      amount: Math.round(amount * 100) // cents
    });
  }
  
  // Update booking
  await prisma.booking.update({
    where: { id: booking_id },
    data: {
      status: 'CANCELLED',
      cancelled_at: new Date(),
      refund_amount: amount,
      refund_percent: percent,
      cancellation_reason: reason
    }
  });
  
  // Release seats (if shared)
  if (booking.type === 'SHARED') {
    // Seats automatically available again
  }
  
  // Notify parties
  await notifyTravelerOfCancellation(booking_id, amount);
  await notifyDriverOfCancellation(booking.trip_id);
  
  return Response.json({ success: true, refund_amount: amount });
}
```

---

## Testing Strategy

### Unit Tests
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### E2E Tests
```bash
npm install -D @playwright/test
```

**Key Test Scenarios:**
1. [ ] OTP verification flow
2. [ ] Private booking with seat locking
3. [ ] Shared booking with soft hold expiry
4. [ ] Stripe payment success/failure
5. [ ] Driver accept with atomic lock
6. [ ] Cancellation with refund calculation
7. [ ] Admin trip approval workflow

---

## Deployment Checklist

### Pre-Launch
- [ ] Enable PostGIS in Supabase
- [ ] Set up Stripe webhook endpoint
- [ ] Configure Twilio phone number
- [ ] Set up Resend domain
- [ ] Create PostHog project
- [ ] Set all environment variables

### Launch Day
- [ ] Run database migrations
- [ ] Seed initial admin user
- [ ] Test all payment flows
- [ ] Verify webhook delivery
- [ ] Check PostHog events firing

### Post-Launch
- [ ] Monitor error rates
- [ ] Track success metrics
- [ ] Review PostHog funnels
- [ ] Collect user feedback

---

**Status:** Ready for Gate 2 implementation  
**Next:** Begin with Epic B (OTP + Booking flows)
