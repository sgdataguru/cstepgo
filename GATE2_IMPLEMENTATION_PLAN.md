# Gate 2 Demo Implementation Plan - StepperGO

## 📋 Current Setup Assessment

### ✅ What We Have
- [x] Next.js 14 with App Router
- [x] TypeScript 5.6
- [x] TailwindCSS
- [x] React Hook Form
- [x] Stripe JS SDK
- [x] Radix UI Components
- [x] Zod for validation
- [x] Date-fns for date handling
- [x] Lucide React icons

### ❌ What We Need to Add
- [ ] Prisma ORM
- [ ] PostgreSQL Database
- [ ] PostHog Analytics
- [ ] Stripe Server SDK
- [ ] Email Service (Resend or Postmark)
- [ ] Database migrations
- [ ] Webhook handlers

---

## 🎯 Gate 2 Features Implementation

### Feature 1: ✅ Booking Core

#### Database Schema (Prisma)
```prisma
model Booking {
  id            String   @id @default(cuid())
  tripId        String
  userId        String
  status        BookingStatus
  totalAmount   Decimal
  currency      String   @default("KZT")
  passengers    Json     // Array of passenger details
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  trip          Trip     @relation(fields: [tripId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
  payment       Payment?
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

#### API Endpoints
- `POST /api/bookings` - Create booking with capacity lock
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

#### Components
- `BookingForm.tsx` - Passenger details form
- `CapacityLock.tsx` - Real-time seat availability
- `BookingConfirmation.tsx` - Confirmation screen

---

### Feature 2: ✅ Payments (Stripe)

#### Database Schema
```prisma
model Payment {
  id              String   @id @default(cuid())
  bookingId       String   @unique
  stripeIntentId  String   @unique
  amount          Decimal
  currency        String
  status          PaymentStatus
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  booking         Booking  @relation(fields: [bookingId], references: [id])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

#### API Endpoints
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/webhooks/stripe` - Webhook handler (with idempotency)
- `GET /api/admin/payments` - Admin payment view

#### Components
- `CheckoutForm.tsx` - Stripe checkout
- `PaymentSuccess.tsx` - Success screen
- `PaymentFailed.tsx` - Failure screen
- `AdminPaymentList.tsx` - Admin view

---

### Feature 3: ✅ Driver Application + Profile

#### Database Schema
```prisma
model Driver {
  id              String   @id @default(cuid())
  userId          String   @unique
  status          DriverStatus
  vehicleType     String
  vehicleModel    String
  licensePlate    String
  licenseNumber   String
  documentsUrl    Json     // Array of document URLs
  rating          Float    @default(0)
  completedTrips  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  trips           Trip[]
}

enum DriverStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

#### API Endpoints
- `POST /api/drivers/apply` - Submit driver application
- `GET /api/drivers/:id` - Get driver profile
- `PUT /api/admin/drivers/:id/approve` - Approve driver
- `PUT /api/admin/drivers/:id/reject` - Reject driver

#### Components
- `DriverApplicationForm.tsx` - Application form
- `DriverProfile.tsx` - Public driver profile
- `AdminDriverReview.tsx` - Admin review interface

---

### Feature 4: ✅ Analytics Funnel (PostHog)

#### Events to Track
```typescript
// Funnel: trip_viewed → checkout_started → payment_succeeded

posthog.capture('trip_viewed', {
  tripId: string,
  userId: string,
  timestamp: Date
});

posthog.capture('checkout_started', {
  tripId: string,
  userId: string,
  bookingId: string,
  amount: number
});

posthog.capture('payment_succeeded', {
  tripId: string,
  userId: string,
  bookingId: string,
  paymentId: string,
  amount: number
});

posthog.capture('booking_confirmed', {
  tripId: string,
  userId: string,
  bookingId: string
});
```

#### Database Schema
```prisma
model AnalyticsEvent {
  id         String   @id @default(cuid())
  eventName  String
  userId     String?
  metadata   Json
  createdAt  DateTime @default(now())
  
  @@index([eventName])
  @@index([userId])
}
```

---

## 🛠 Implementation Steps

### Phase 1: Database Setup (Day 1)
- [ ] Install Prisma
- [ ] Create Prisma schema
- [ ] Set up PostgreSQL connection
- [ ] Create migrations
- [ ] Seed initial data

### Phase 2: Booking System (Day 2-3)
- [ ] Create Booking model and API
- [ ] Implement capacity lock logic
- [ ] Build booking form UI
- [ ] Add optimistic updates
- [ ] Create confirmation email template
- [ ] Test booking flow

### Phase 3: Payment Integration (Day 4-5)
- [ ] Install Stripe SDK
- [ ] Create payment intent API
- [ ] Build checkout form
- [ ] Implement webhook handler
- [ ] Add idempotency key handling
- [ ] Create success/fail screens
- [ ] Build admin payment view
- [ ] Test payment flow

### Phase 4: Driver Application (Day 6)
- [ ] Create Driver model
- [ ] Build application form
- [ ] Add document upload
- [ ] Create admin review page
- [ ] Implement approval/rejection
- [ ] Show driver profile on trips
- [ ] Test driver flow

### Phase 5: Analytics (Day 7)
- [ ] Install PostHog
- [ ] Add event tracking
- [ ] Create analytics dashboard
- [ ] Set up funnel visualization
- [ ] Test non-zero conversions
- [ ] Verify staging data

### Phase 6: Testing & Polish (Day 8)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsiveness
- [ ] Documentation

---

## 📦 Dependencies to Install

```json
{
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "stripe": "^16.12.0",
    "posthog-js": "^1.165.0",
    "posthog-node": "^4.2.0",
    "resend": "^4.0.0",
    "nanoid": "^5.0.0",
    "@react-email/components": "^0.0.25"
  },
  "devDependencies": {
    "prisma": "^5.20.0",
    "@types/stripe": "^8.0.0"
  }
}
```

---

## 🔐 Environment Variables Needed

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/steppergo"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PostHog
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Email
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@steppergo.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

---

## 📊 Success Metrics

### Booking System
- [ ] 100% capacity lock accuracy
- [ ] < 500ms booking creation time
- [ ] Email sent within 10 seconds
- [ ] Zero double-bookings

### Payment System
- [ ] 99.9% webhook delivery
- [ ] 100% idempotency
- [ ] < 3s payment confirmation
- [ ] Proper error handling

### Driver Application
- [ ] < 5min application time
- [ ] 100% document upload success
- [ ] Admin review < 24h
- [ ] Driver profile visible

### Analytics
- [ ] All events tracked
- [ ] Non-zero conversions
- [ ] Funnel visualization works
- [ ] Real-time updates

---

## 🎯 Demo Checklist

### Happy Path Demo Flow
1. [ ] User views trip (analytics: trip_viewed)
2. [ ] User clicks "Book Now"
3. [ ] User fills passenger details
4. [ ] System locks capacity
5. [ ] User proceeds to checkout (analytics: checkout_started)
6. [ ] User enters payment details
7. [ ] Payment succeeds (analytics: payment_succeeded)
8. [ ] Booking confirmed
9. [ ] Confirmation email sent
10. [ ] Driver profile visible on trip
11. [ ] Admin can view payment
12. [ ] Analytics funnel shows conversion

### Edge Cases to Handle
- [ ] Out of capacity error
- [ ] Payment failure
- [ ] Duplicate booking prevention
- [ ] Webhook replay attacks
- [ ] Network timeouts
- [ ] Invalid payment methods

---

## 📝 Next Steps

Ready to start implementation! Here's what I'll do:

1. **Install all dependencies**
2. **Set up Prisma with complete schema**
3. **Create all API routes**
4. **Build all components**
5. **Add PostHog tracking**
6. **Create email templates**
7. **Write tests**

Should I proceed with the full implementation?
