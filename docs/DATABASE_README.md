# Database Schema Documentation

This folder contains comprehensive documentation for the StepperGO database schema.

## 📚 Available Documentation

### 1. [DATABASE_SCHEMA_ER_DIAGRAM.md](./DATABASE_SCHEMA_ER_DIAGRAM.md)
**Comprehensive ER Diagram Documentation** (Full Reference)

This is the main documentation file containing:
- Complete ER diagrams for all 8 domain clusters
- Detailed entity relationships
- Data flow patterns
- All enumerations and their values
- Index strategies
- Multi-tenant support details
- Security considerations
- JSON field structures
- Business rules and logic

**Best for**: Understanding the complete database architecture, learning about relationships, and reference during development.

### 2. [DATABASE_SCHEMA_QUICK_REFERENCE.md](./DATABASE_SCHEMA_QUICK_REFERENCE.md)
**Quick Reference Guide** (Cheat Sheet)

Quick access guide containing:
- Summary statistics (41 models, 8 domains)
- Core models by domain
- Key relationships cheat sheet
- Common query patterns
- Status enum lifecycles
- Critical indexes
- Business rules (revenue sharing, payouts, etc.)
- JSON field schemas
- Useful Prisma queries
- Security best practices
- Performance optimization tips
- Common gotchas

**Best for**: Quick lookups during development, finding query patterns, and learning best practices.

---

## 🗺️ Database Domain Overview

The StepperGO database is organized into **8 major domains**:

### 1. 🔐 User & Auth Domain
Core authentication and user management
- **Models**: User, Session, RefreshToken, OTP
- **Key Feature**: Multi-role support (PASSENGER, DRIVER, ADMIN, ACTIVITY_OWNER)

### 2. 🚗 Driver Domain
Driver profiles, vehicles, and availability
- **Models**: Driver, Vehicle, Review, DriverLocation, DriverAvailabilitySchedule, DriverAvailabilityHistory, DriverCredentialDelivery
- **Key Feature**: Real-time GPS tracking and availability management

### 3. 🗺️ Trip Domain
Trip creation, driver discovery, and assignment
- **Models**: Trip, TripDriverVisibility, TripAcceptanceLog
- **Key Feature**: Radius-based driver discovery and acceptance workflow

### 4. 🎫 Passenger & Booking Domain
Booking management and seat allocation
- **Models**: Booking
- **Key Feature**: Multi-seat bookings with passenger details

### 5. 💳 Payment & Payout Domain
Payment processing and driver compensation
- **Models**: Payment, Payout
- **Key Feature**: 85/15 revenue split with automated payouts

### 6. 💬 Messaging Domain
Trip-based real-time messaging
- **Models**: Conversation, ConversationParticipant, Message
- **Key Feature**: One conversation per trip with delivery status

### 7. 🎯 Activity Owner & Activities Domain
Tours and activity booking system
- **Models**: ActivityOwner, Activity, ActivityPhoto, ActivitySchedule, ActivityBooking, ActivityReview
- **Key Feature**: Independent booking system from ride-sharing

### 8. 🛡️ Admin & Analytics Domain
Platform administration and analytics
- **Models**: AnalyticsEvent, AdminAction, DocumentVerification, FileUpload, WebhookLog, Notification
- **Key Feature**: Comprehensive audit trails

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| Total Models | 41 |
| Domain Clusters | 8 |
| Enumerations | 10 |
| Indexes | 100+ |
| Primary Relationships | 60+ |

---

## 🔗 Key Relationships

### Core User Relationships
```
User (1:1) Driver
User (1:1) ActivityOwner
User (1:M) Bookings
User (1:M) Trips
User (1:M) ActivityBookings
```

### Core Trip Relationships
```
Trip (1:M) Bookings
Trip (1:1) Conversation
Trip (M:1) Driver
Trip (M:1) User (organizer)
```

### Core Payment Relationships
```
Booking (1:1) Payment
Driver (1:M) Payouts
```

---

## 🚀 Quick Start Examples

### Find Available Drivers
```typescript
const drivers = await prisma.driver.findMany({
  where: {
    availability: 'AVAILABLE',
    acceptsPrivateTrips: true,
  },
  include: {
    user: true,
    location: true
  }
});
```

### Get User Bookings
```typescript
const bookings = await prisma.booking.findMany({
  where: { userId },
  include: {
    trip: {
      include: { driver: { include: { user: true } } }
    },
    payment: true
  },
  orderBy: { createdAt: 'desc' }
});
```

### Create Trip with Driver Discovery
```typescript
const trip = await prisma.trip.create({
  data: {
    title: "Almaty to Astana",
    organizerId: userId,
    originLat: 43.238293,
    originLng: 76.889710,
    destLat: 51.169392,
    destLng: 71.449074,
    departureTime: new Date('2025-01-15T08:00:00Z'),
    totalSeats: 4,
    availableSeats: 4,
    basePrice: 20000,
    status: 'PUBLISHED',
    tripType: 'PRIVATE',
    driverDiscoveryRadius: 10
  }
});
```

---

## 💡 Business Logic Highlights

### Revenue Sharing
- **Platform Fee**: 15%
- **Driver Earnings**: 85%
- Only ONLINE payments included in automated payouts

### Trip Lifecycle
```
DRAFT → PUBLISHED → OFFERED → IN_PROGRESS → 
DEPARTED → EN_ROUTE → ARRIVED → COMPLETED
```

### Driver Discovery
- Radius-based matching (default: 10km)
- Tracked in TripDriverVisibility
- Acceptance timeout via acceptanceDeadline

### Multi-Tenant Support
- Trip.tenantId for organization isolation
- Payout.tenantId for tenant-specific processing

---

## 🔒 Security Features

✅ **Password Hashing**: bcrypt with salt rounds  
✅ **Token Security**: SHA-256 hashed refresh tokens  
✅ **OTP Security**: Hashed OTP codes  
✅ **Payment Security**: Only last 4 digits stored  
✅ **Audit Trails**: AdminAction logs all admin operations  
✅ **Soft Deletes**: FileUpload.deletedAt for retention  

---

## 📈 Performance Optimizations

- **100+ Indexes** for critical queries
- **Geospatial Indexes** for driver location queries
- **Composite Indexes** for complex filtering
- **Denormalized Counts** for quick stats (e.g., Driver.completedTrips)
- **Cursor-based Pagination** for large datasets

---

## 🔧 Development Tools

### View Database
```bash
npm run db:studio
```

### Generate Prisma Client
```bash
npm run db:generate
```

### Create Migration
```bash
npm run db:migrate
```

### Seed Database
```bash
npm run db:seed
```

---

## 📝 Documentation Structure

```
docs/
├── DATABASE_SCHEMA_ER_DIAGRAM.md         # Complete reference (32KB)
├── DATABASE_SCHEMA_QUICK_REFERENCE.md    # Cheat sheet (14KB)
└── DATABASE_README.md                     # This file
```

---

## 🤝 Contributing

When adding new models or relationships:

1. Update the Prisma schema (`prisma/schema.prisma`)
2. Run `npm run db:migrate` to create migration
3. Update ER diagram documentation
4. Update quick reference guide
5. Add examples to quick reference

---

## 📞 Support

For questions about the database schema:
- Check the [Quick Reference Guide](./DATABASE_SCHEMA_QUICK_REFERENCE.md) first
- Refer to the [Complete ER Diagram](./DATABASE_SCHEMA_ER_DIAGRAM.md) for details
- Review the [Prisma Schema](../prisma/schema.prisma) for implementation

---

## 🔄 Version History

- **v1.0** (Nov 26, 2025) - Initial comprehensive documentation
  - 41 models across 8 domains
  - Complete ER diagrams with Mermaid syntax
  - Quick reference guide
  - Business rules and query patterns

---

**Last Updated**: November 26, 2025  
**Maintained By**: StepperGO Development Team
