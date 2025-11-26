# StepperGO Database Schema - Quick Reference Guide

**Quick Access**: Essential information about the StepperGO database schema

---

## Table of Contents

1. [Quick Stats](#quick-stats)
2. [Core Models by Domain](#core-models-by-domain)
3. [Key Relationships Cheat Sheet](#key-relationships-cheat-sheet)
4. [Common Query Patterns](#common-query-patterns)
5. [Status Enums Reference](#status-enums-reference)
6. [Critical Indexes](#critical-indexes)
7. [Business Rules](#business-rules)

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Models** | 41 |
| **Domain Clusters** | 8 |
| **Enumerations** | 10 |
| **Indexes** | 100+ |
| **One-to-One Relations** | 6 |
| **One-to-Many Relations** | 50+ |
| **Many-to-Many Relations** | 2 |

---

## Core Models by Domain

### 🔐 1. User & Auth Domain (4 models)
- `User` - Core user accounts
- `Session` - Active sessions
- `RefreshToken` - Token refresh mechanism
- `OTP` - Phone verification codes

### 🚗 2. Driver Domain (7 models)
- `Driver` - Driver profiles
- `Vehicle` - Driver vehicles
- `Review` - Driver reviews
- `DriverLocation` - Real-time GPS
- `DriverAvailabilitySchedule` - Scheduled breaks
- `DriverAvailabilityHistory` - Status change log
- `DriverCredentialDelivery` - Credential delivery tracking

### 🗺️ 3. Trip Domain (3 models)
- `Trip` - Trip details
- `TripDriverVisibility` - Driver discovery
- `TripAcceptanceLog` - Acceptance tracking

### 🎫 4. Passenger & Booking Domain (1 model)
- `Booking` - Passenger bookings

### 💳 5. Payment & Payout Domain (2 models)
- `Payment` - Payment transactions
- `Payout` - Driver compensation

### 💬 6. Messaging Domain (3 models)
- `Conversation` - Trip chat rooms
- `ConversationParticipant` - Chat members
- `Message` - Individual messages

### 🎯 7. Activity Owner & Activities Domain (6 models)
- `ActivityOwner` - Activity business owners
- `Activity` - Tours/excursions
- `ActivityPhoto` - Activity images
- `ActivitySchedule` - Time slots
- `ActivityBooking` - Activity reservations
- `ActivityReview` - Activity feedback

### 🛡️ 8. Admin & Analytics Domain (6 models)
- `AnalyticsEvent` - User behavior tracking
- `AdminAction` - Admin audit log
- `DocumentVerification` - Document approval
- `FileUpload` - File management
- `WebhookLog` - Webhook processing
- `Notification` - Platform notifications

---

## Key Relationships Cheat Sheet

### Primary Foreign Keys

```typescript
// User Relationships
User.id → Driver.userId (1:1)
User.id → ActivityOwner.userId (1:1)
User.id → DriverLocation.driverId (1:1)
User.id → Session.userId (1:M)
User.id → Booking.userId (1:M)
User.id → Trip.organizerId (1:M)

// Trip Relationships
Trip.id → Booking.tripId (1:M)
Trip.id → Conversation.tripId (1:1)
Trip.id → TripDriverVisibility.tripId (1:M)
Trip.organizerId → User.id (M:1)
Trip.driverId → Driver.id (M:1)

// Booking Relationships
Booking.id → Payment.bookingId (1:1)
Booking.tripId → Trip.id (M:1)
Booking.userId → User.id (M:1)

// Activity Relationships
ActivityOwner.id → Activity.ownerId (1:M)
Activity.id → ActivityPhoto.activityId (1:M)
Activity.id → ActivitySchedule.activityId (1:M)
Activity.id → ActivityBooking.activityId (1:M)
Activity.id → ActivityReview.activityId (1:M)

// Driver Relationships
Driver.id → Vehicle.driverId (1:M)
Driver.id → Review.driverId (1:M)
Driver.id → Payout.driverId (1:M)

// Messaging Relationships
Conversation.id → Message.conversationId (1:M)
Conversation.id → ConversationParticipant.conversationId (1:M)
```

---

## Common Query Patterns

### Find Available Drivers Near Location
```typescript
// Indexes used:
// - Driver.availability
// - DriverLocation(latitude, longitude)
// - Driver.lastActivityAt

const drivers = await prisma.driver.findMany({
  where: {
    availability: 'AVAILABLE',
    acceptsPrivateTrips: true,
    location: {
      isActive: true,
      // Geospatial query for radius
    }
  }
});
```

### Get User Bookings with Trip Details
```typescript
// Indexes used:
// - Booking(userId)
// - Booking.status

const bookings = await prisma.booking.findMany({
  where: { userId },
  include: {
    trip: {
      include: {
        driver: {
          include: { user: true }
        }
      }
    },
    payment: true
  },
  orderBy: { createdAt: 'desc' }
});
```

### Find Trips Needing Driver Assignment
```typescript
// Indexes used:
// - Trip(status, driverDiscoveryRadius)
// - Trip.departureTime

const trips = await prisma.trip.findMany({
  where: {
    status: 'PUBLISHED',
    driverId: null,
    departureTime: {
      gte: new Date()
    }
  }
});
```

### Get Unpaid Driver Bookings for Payout
```typescript
// Indexes used:
// - Booking(payoutSettled)
// - Booking(paymentMethodType)

const unpaidBookings = await prisma.booking.findMany({
  where: {
    payoutSettled: false,
    paymentMethodType: 'ONLINE',
    status: 'COMPLETED',
    payment: {
      status: 'SUCCEEDED'
    },
    trip: {
      driverId: driverId
    }
  }
});
```

---

## Status Enums Reference

### TripStatus Lifecycle (17 states)
```
DRAFT → PUBLISHED → OFFERED → FULL/IN_PROGRESS
                              ↓
DEPARTED → EN_ROUTE → DRIVER_ARRIVED → PASSENGERS_BOARDED
                              ↓
IN_TRANSIT → ARRIVED → COMPLETED
           ↓
       DELAYED (optional)
           ↓
     CANCELLED (any state)
```

### BookingStatus Lifecycle
```
PENDING → CONFIRMED → COMPLETED
        ↓           ↓
    CANCELLED   REFUNDED
```

### PaymentStatus Lifecycle
```
PENDING → PROCESSING → SUCCEEDED
                     ↓
                  FAILED
                     ↓
                  REFUNDED
```

### PayoutStatus Lifecycle
```
PENDING → PROCESSING → PAID
                     ↓
                  FAILED
                     ↓
                 CANCELLED
```

### DriverStatus
```
PENDING → APPROVED → [Active]
        ↓
     REJECTED
        ↓
   SUSPENDED (temporary)
```

---

## Critical Indexes

### Performance-Critical Indexes

**User Queries**
```sql
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "Session_token_idx" ON "Session"("token");
```

**Driver Discovery**
```sql
CREATE INDEX "Driver_status_idx" ON "Driver"("status");
CREATE INDEX "Driver_availability_idx" ON "Driver"("availability");
CREATE INDEX "DriverLocation_latitude_longitude_idx" 
  ON "DriverLocation"("latitude", "longitude");
```

**Trip Management**
```sql
CREATE INDEX "Trip_status_driverDiscoveryRadius_idx" 
  ON "Trip"("status", "driver_discovery_radius");
CREATE INDEX "Trip_originLat_originLng_idx" 
  ON "Trip"("originLat", "originLng");
CREATE INDEX "Trip_departureTime_idx" ON "Trip"("departureTime");
```

**Booking & Payment**
```sql
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_payoutSettled_idx" ON "Booking"("payout_settled");
CREATE INDEX "Payment_stripeIntentId_idx" ON "Payment"("stripeIntentId");
```

**Messaging**
```sql
CREATE INDEX "Message_conversationId_sentAt_idx" 
  ON "Message"("conversation_id", "sent_at");
CREATE INDEX "ConversationParticipant_userId_conversationId_idx" 
  ON "ConversationParticipant"("user_id", "conversation_id");
```

---

## Business Rules

### Revenue Sharing
```typescript
const PLATFORM_FEE = 0.15;      // 15%
const DRIVER_EARNINGS = 0.85;   // 85%

// Example:
// Booking Amount: 20,000 KZT
// Platform Fee: 3,000 KZT
// Driver Payout: 17,000 KZT
```

### Payment Methods
- **ONLINE**: Processed via Stripe, included in automatic payouts
- **CASH_TO_DRIVER**: Direct payment, excluded from payouts

### Payout Eligibility
- Only `ONLINE` payment bookings
- Only `COMPLETED` bookings
- Only bookings with `SUCCEEDED` payment status
- `payoutSettled = false`

### Seat Management
- Private Trip: `totalSeats` allocated to single booking
- Shared Trip: Multiple bookings, track `availableSeats`
- Formula: `availableSeats = totalSeats - sum(seatsBooked)`

### Driver Discovery
- Radius-based: `driverDiscoveryRadius` (default: 10km)
- Filter by: `availability`, `acceptsPrivateTrips`, `acceptsSharedTrips`
- Track in: `TripDriverVisibility` table
- Timeout: `acceptanceDeadline` field

### Activity Publishing Rules
- Only `status='ACTIVE'` AND `isPublished=true` visible to passengers
- `DRAFT`, `PENDING_APPROVAL`, `INACTIVE` hidden from public

### Multi-Tenant Isolation
- `Trip.tenantId` - Filter trips by organization
- `Payout.tenantId` - Separate payout processing per tenant

### Auto-Offline Logic
- Driver goes OFFLINE if no activity for `autoOfflineMinutes` (default: 30)
- Tracked via `Driver.lastActivityAt`

---

## JSON Field Schemas

### Trip.itinerary
```json
{
  "stops": [
    {
      "order": 1,
      "name": "Almaty Central",
      "address": "123 Main St, Almaty",
      "lat": 43.238293,
      "lng": 76.889710,
      "arrivalTime": "2025-01-15T08:00:00Z",
      "departureTime": "2025-01-15T08:30:00Z"
    }
  ]
}
```

### Booking.passengers
```json
[
  {
    "name": "John Doe",
    "phone": "+77001234567",
    "age": 30,
    "isChild": false,
    "seatNumber": "A1"
  }
]
```

### Driver.languages
```json
[
  {
    "code": "en",
    "name": "English",
    "proficiency": "FLUENT"
  },
  {
    "code": "ru",
    "name": "Russian",
    "proficiency": "NATIVE"
  }
]
```

### Activity.groupPricing
```json
[
  {
    "minParticipants": 1,
    "maxParticipants": 4,
    "pricePerPerson": 20000
  },
  {
    "minParticipants": 5,
    "maxParticipants": 10,
    "pricePerPerson": 15000
  }
]
```

### Payout.metadata
```json
{
  "bookingIds": ["clx123", "clx456"],
  "grossAmount": 40000,
  "platformFee": 6000,
  "netAmount": 34000,
  "tripsCompleted": 2
}
```

---

## Useful Prisma Queries

### Find Trip with Full Details
```typescript
const trip = await prisma.trip.findUnique({
  where: { id: tripId },
  include: {
    organizer: true,
    driver: {
      include: {
        user: true,
        vehicles: true
      }
    },
    bookings: {
      include: {
        user: true,
        payment: true
      }
    },
    conversation: {
      include: {
        messages: {
          take: 50,
          orderBy: { sentAt: 'desc' }
        },
        participants: {
          include: { user: true }
        }
      }
    }
  }
});
```

### Create Booking with Payment
```typescript
const booking = await prisma.booking.create({
  data: {
    tripId,
    userId,
    seatsBooked: 2,
    totalAmount: 40000,
    passengers: [
      { name: "John Doe", phone: "+77001234567" },
      { name: "Jane Doe", phone: "+77001234568" }
    ],
    payment: {
      create: {
        amount: 40000,
        currency: "KZT",
        status: "PENDING"
      }
    }
  },
  include: { payment: true }
});
```

### Update Driver Location
```typescript
await prisma.driverLocation.upsert({
  where: { driverId },
  update: {
    latitude: 43.238293,
    longitude: 76.889710,
    heading: 90.5,
    speed: 65.0,
    accuracy: 5.0,
    lastUpdated: new Date(),
    isActive: true
  },
  create: {
    driverId,
    latitude: 43.238293,
    longitude: 76.889710,
    isActive: true
  }
});
```

---

## Security Best Practices

### Password Storage
```typescript
// Use bcrypt with salt rounds >= 10
const passwordHash = await bcrypt.hash(password, 12);
```

### Token Security
```typescript
// Store only hashed tokens
const tokenHash = crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');
```

### Payment Data
```typescript
// Only store last 4 digits of card
const last4 = cardNumber.slice(-4);
// Never store full card numbers
```

### OTP Security
```typescript
// Hash OTP codes before storage
const codeHash = crypto
  .createHash('sha256')
  .update(code)
  .digest('hex');
```

---

## Data Migration Tips

### Adding New Fields
```typescript
// Always provide defaults or make nullable
model Driver {
  newFeature Boolean @default(false)
  // OR
  newFeature Boolean?
}
```

### Renaming Fields
```typescript
// Use @map for backward compatibility
model Driver {
  acceptsPrivateTrips Boolean @map("accepts_private_trips")
}
```

### Deleting Models
```typescript
// 1. Remove foreign keys first
// 2. Remove indexes
// 3. Remove model
// 4. Run migration
```

---

## Performance Optimization

### Use Select for Large Objects
```typescript
// Instead of including everything
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true
    // Don't include relations unless needed
  }
});
```

### Pagination Best Practices
```typescript
// Use cursor-based pagination for large datasets
const trips = await prisma.trip.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastTripId },
  orderBy: { createdAt: 'desc' }
});
```

### Batch Operations
```typescript
// Use transactions for multiple operations
await prisma.$transaction([
  prisma.booking.update({ where: { id }, data: { status: 'COMPLETED' } }),
  prisma.trip.update({ where: { id }, data: { status: 'COMPLETED' } }),
  prisma.driver.update({ where: { id }, data: { completedTrips: { increment: 1 } } })
]);
```

---

## Common Gotchas

❌ **Don't forget cascade deletes**
```typescript
// Will fail if driver has related records
await prisma.driver.delete({ where: { id } });

// Use onDelete: Cascade in schema
```

❌ **Don't update denormalized counts manually**
```typescript
// Use atomic increment/decrement
await prisma.driver.update({
  where: { id },
  data: {
    completedTrips: { increment: 1 }
  }
});
```

❌ **Don't query without proper indexes**
```typescript
// Slow: no index on custom fields
await prisma.driver.findMany({
  where: { yearsExperience: { gt: 5 } }
});

// Add index first in schema
@@index([yearsExperience])
```

---

## Resources

- **Full Documentation**: [DATABASE_SCHEMA_ER_DIAGRAM.md](./DATABASE_SCHEMA_ER_DIAGRAM.md)
- **Prisma Schema**: [schema.prisma](../prisma/schema.prisma)
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Last Updated**: November 26, 2025  
**Maintained By**: StepperGO Development Team
