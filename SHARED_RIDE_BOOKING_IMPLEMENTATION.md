# Shared Ride Seat Booking Feature - Implementation Documentation

## Overview
This document describes the implementation of the Customer 'Book Shared Ride Seat' Flow for StepperGO, which enables passengers to book individual seats on shared rides with multi-tenant support and driver discovery integration.

## Table of Contents
1. [Schema Changes](#schema-changes)
2. [API Endpoints](#api-endpoints)
3. [Multi-Tenant Architecture](#multi-tenant-architecture)
4. [Driver Discovery Integration](#driver-discovery-integration)
5. [Atomic Seat Reservation](#atomic-seat-reservation)
6. [Usage Examples](#usage-examples)
7. [Testing](#testing)

---

## Schema Changes

### 1. Trip Type Enum
Added new `TripType` enum to differentiate between private and shared rides:

```prisma
enum TripType {
  PRIVATE
  SHARED
}
```

### 2. Trip Model Enhancements
Enhanced the `Trip` model with shared ride and multi-tenant fields:

```prisma
model Trip {
  // ... existing fields ...
  
  // Trip Type & Multi-Tenant Fields
  tripType       TripType   @default(PRIVATE) @map("trip_type")
  tenantId       String?    @map("tenant_id") // Organization/tenant identifier
  pricePerSeat   Decimal?   @map("price_per_seat") // For shared rides
  
  // ... existing fields ...
  
  @@index([tripType, status])
  @@index([tenantId])
}
```

### 3. Booking Model Enhancements
Added tenant context to bookings:

```prisma
model Booking {
  // ... existing fields ...
  
  // Multi-Tenant Fields
  tenantId    String?       @map("tenant_id")
  
  // ... existing fields ...
  
  @@index([tenantId])
}
```

### 4. Driver Preferences
Driver model already includes trip type preferences:

```prisma
model Driver {
  // ... existing fields ...
  
  acceptsPrivateTrips Boolean   @default(true) @map("accepts_private_trips")
  acceptsSharedTrips  Boolean   @default(true) @map("accepts_shared_trips")
  
  // ... existing fields ...
}
```

---

## API Endpoints

### 1. Book Shared Ride Seat
**POST** `/api/bookings/shared`

Create a new shared ride booking with atomic seat reservation.

#### Request Body
```json
{
  "tripId": "clxxxxxxxxxx",
  "userId": "clxxxxxxxxxx",
  "seatsBooked": 2,
  "passengers": [
    {
      "name": "John Doe",
      "age": 30,
      "phone": "+1234567890"
    },
    {
      "name": "Jane Smith",
      "age": 28
    }
  ],
  "notes": "Optional booking notes",
  "tenantId": "tenant-123" // Optional for multi-tenant
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Shared ride booking created successfully",
  "data": {
    "bookingId": "clxxxxxxxxxx",
    "tripId": "clxxxxxxxxxx",
    "tripTitle": "Almaty to Astana Shared Ride",
    "seatsBooked": 2,
    "seatsRemaining": 2,
    "totalAmount": 6000,
    "currency": "KZT",
    "status": "PENDING",
    "departureTime": "2024-11-25T10:00:00.000Z",
    "route": {
      "from": "Almaty",
      "to": "Astana"
    },
    "passengers": [...],
    "tenantId": "tenant-123",
    "createdAt": "2024-11-24T16:00:00.000Z"
  }
}
```

#### Features
- ✅ Atomic transaction prevents double-booking
- ✅ Real-time seat availability validation
- ✅ Per-seat pricing calculation
- ✅ Multi-tenant context enforcement
- ✅ Automatic trip status update to FULL when sold out

---

### 2. List Shared Ride Bookings
**GET** `/api/bookings/shared`

Retrieve shared ride bookings with filtering and pagination.

#### Query Parameters
- `userId` (optional): Filter by user ID
- `tripId` (optional): Filter by trip ID
- `status` (optional): Filter by booking status (PENDING, CONFIRMED, etc.)
- `tenantId` (optional): Filter by tenant ID
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "clxxxxxxxxxx",
        "tripId": "clxxxxxxxxxx",
        "tripTitle": "Almaty to Astana Shared Ride",
        "userId": "clxxxxxxxxxx",
        "userName": "John Doe",
        "seatsBooked": 2,
        "totalAmount": 6000,
        "currency": "KZT",
        "status": "CONFIRMED",
        "passengers": [...],
        "departureTime": "2024-11-25T10:00:00.000Z",
        "route": {
          "from": "Almaty",
          "to": "Astana"
        },
        "payment": {
          "id": "clxxxxxxxxxx",
          "status": "SUCCEEDED",
          "amount": 6000
        },
        "createdAt": "2024-11-24T16:00:00.000Z",
        "confirmedAt": "2024-11-24T16:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 3. Check Seat Availability
**GET** `/api/trips/[id]/availability`

Real-time seat availability check before booking.

#### Query Parameters
- `seats` (default: 1): Number of seats to check

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "tripId": "clxxxxxxxxxx",
    "tripTitle": "Almaty to Astana Shared Ride",
    "tripType": "SHARED",
    "requestedSeats": 2,
    "availability": {
      "totalSeats": 4,
      "bookedSeats": 1,
      "availableSeats": 3,
      "canBook": true,
      "message": "3 seat(s) available"
    },
    "pricing": {
      "pricePerSeat": 3000,
      "platformFee": 500,
      "estimatedTotal": 6500,
      "currency": "KZT",
      "breakdown": {
        "basePrice": 6000,
        "platformFee": 500,
        "total": 6500
      }
    },
    "trip": {
      "departureTime": "2024-11-25T10:00:00.000Z",
      "returnTime": "2024-11-25T18:00:00.000Z",
      "origin": "Almaty",
      "destination": "Astana",
      "status": "PUBLISHED"
    },
    "tenantId": "tenant-123",
    "bookings": {
      "confirmed": 1,
      "pending": 0
    }
  }
}
```

---

### 4. Driver Trip Discovery (Enhanced)
**GET** `/api/drivers/trips/available`

Enhanced to support trip type filtering.

#### New Query Parameters
- `tripTypes` (optional): Comma-separated list of trip types to filter (PRIVATE, SHARED)
  - Example: `?tripTypes=SHARED` or `?tripTypes=PRIVATE,SHARED`

#### Response Enhancements
Each trip now includes:
- `tripType`: "PRIVATE" or "SHARED"
- `pricePerSeat`: Per-seat price for shared rides
- `bookedSeats`: Number of seats already booked
- `tenantId`: Multi-tenant context

```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "clxxxxxxxxxx",
        "title": "Almaty to Astana Shared Ride",
        "tripType": "SHARED",
        "totalSeats": 4,
        "availableSeats": 3,
        "bookedSeats": 1,
        "pricePerSeat": 3000,
        "basePrice": 12000,
        "estimatedEarnings": 10200,
        "distance": 5.2,
        "tenantId": "tenant-123",
        ...
      }
    ],
    "pagination": {...}
  }
}
```

---

## Multi-Tenant Architecture

### Tenant Context Enforcement

#### 1. Trip Level
- Trips can optionally be associated with a `tenantId`
- Tenant context is preserved when creating shared rides
- Cross-tenant booking validation prevents data leakage

#### 2. Booking Level
- Bookings inherit `tenantId` from their associated trip
- Tenant mismatch errors prevent cross-tenant bookings
- Filtering by `tenantId` isolates data per organization

#### 3. Validation Example
```typescript
// In shared booking API
if (validatedData.tenantId && trip.tenantId && 
    validatedData.tenantId !== trip.tenantId) {
  throw new Error('Tenant context mismatch. Cannot book across different tenants.');
}
```

---

## Driver Discovery Integration

### Trip Type Filtering

Drivers can filter trips based on their preferences:

```typescript
// Driver preferences determine which trip types they see
const driverAcceptsPrivate = driver.acceptsPrivateTrips;
const driverAcceptsShared = driver.acceptsSharedTrips;

// API supports explicit filtering
GET /api/drivers/trips/available?tripTypes=SHARED,PRIVATE
```

### Real-Time Updates

WebSocket events now include trip type information:

```typescript
interface TripOfferEvent {
  type: 'trip.offer.created';
  tripType: 'PRIVATE' | 'SHARED';
  tripId: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  pricePerSeat?: number; // For shared rides
  tenantId?: string;
  // ... other fields
}
```

---

## Atomic Seat Reservation

### Transaction-Based Booking

The shared ride booking uses Prisma transactions to ensure atomicity:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Lock trip record
  const trip = await tx.trip.findUnique({
    where: { id: tripId },
    include: { bookings: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } } }
  });

  // 2. Calculate real-time availability
  const totalBookedSeats = trip.bookings.reduce(
    (sum, booking) => sum + booking.seatsBooked, 0
  );
  const actualAvailableSeats = trip.totalSeats - totalBookedSeats;

  // 3. Validate availability
  if (actualAvailableSeats < requestedSeats) {
    throw new Error('Insufficient seats');
  }

  // 4. Create booking
  const booking = await tx.booking.create({...});

  // 5. Update trip status
  await tx.trip.update({
    where: { id: tripId },
    data: {
      availableSeats: actualAvailableSeats - requestedSeats,
      status: newAvailableSeats === 0 ? 'FULL' : trip.status
    }
  });

  return { booking, seatsRemaining: newAvailableSeats };
});
```

### Race Condition Prevention

- Database-level locking via Prisma transactions
- Real-time seat calculation within transaction
- Automatic rollback on any error
- Status update to 'FULL' when sold out

---

## Usage Examples

### Example 1: Book 2 Seats on Shared Ride

```typescript
const response = await fetch('/api/bookings/shared', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tripId: 'clxxxxxxxxxx',
    userId: 'clxxxxxxxxxx',
    seatsBooked: 2,
    passengers: [
      { name: 'Alice Johnson', age: 32 },
      { name: 'Bob Williams', age: 29 }
    ],
    notes: 'Prefer window seats'
  })
});

const result = await response.json();
console.log(`Booked ${result.data.seatsBooked} seats`);
console.log(`${result.data.seatsRemaining} seats remaining`);
```

### Example 2: Check Availability Before Booking

```typescript
// Check if 3 seats are available
const checkResponse = await fetch(
  '/api/trips/clxxxxxxxxxx/availability?seats=3'
);
const availabilityData = await checkResponse.json();

if (availabilityData.data.availability.canBook) {
  // Proceed with booking
  console.log(`Can book! Price: ${availabilityData.data.pricing.estimatedTotal}`);
} else {
  console.log(availabilityData.data.availability.message);
}
```

### Example 3: Driver Filters for Shared Rides Only

```typescript
const response = await fetch(
  '/api/drivers/trips/available?tripTypes=SHARED&radius=15',
  {
    headers: { 'x-driver-id': driverId }
  }
);

const trips = await response.json();
// Only shared rides within 15km radius
```

---

## Testing

### API Testing

```bash
# Test shared ride booking
curl -X POST http://localhost:3000/api/bookings/shared \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "clxxxxxxxxxx",
    "userId": "clxxxxxxxxxx",
    "seatsBooked": 2,
    "passengers": [
      {"name": "Test User", "age": 30}
    ]
  }'

# Check seat availability
curl http://localhost:3000/api/trips/clxxxxxxxxxx/availability?seats=2

# List shared ride bookings
curl "http://localhost:3000/api/bookings/shared?userId=clxxxxxxxxxx&page=1&limit=10"

# Driver discovery with trip type filter
curl "http://localhost:3000/api/drivers/trips/available?tripTypes=SHARED" \
  -H "x-driver-id: clxxxxxxxxxx"
```

### Unit Test Examples

```typescript
describe('Shared Ride Booking', () => {
  it('should book seats atomically', async () => {
    const result = await bookSharedRideSeats({
      tripId: 'test-trip',
      userId: 'test-user',
      seatsBooked: 2,
      passengers: [...]
    });
    
    expect(result.success).toBe(true);
    expect(result.data.seatsBooked).toBe(2);
  });

  it('should prevent double-booking', async () => {
    // Attempt to book more seats than available
    await expect(
      bookSharedRideSeats({
        tripId: 'trip-with-1-seat',
        seatsBooked: 2,
        ...
      })
    ).rejects.toThrow('Insufficient seats');
  });

  it('should enforce tenant isolation', async () => {
    await expect(
      bookSharedRideSeats({
        tripId: 'tenant-a-trip',
        tenantId: 'tenant-b',
        ...
      })
    ).rejects.toThrow('Tenant context mismatch');
  });
});
```

---

## Migration Guide

To apply these changes to an existing database:

```bash
# Generate migration
npx prisma migrate dev --name add_shared_ride_support

# Apply migration
npx prisma migrate deploy
```

---

## Future Enhancements

1. **Dynamic Pricing**: Adjust per-seat price based on demand
2. **Seat Selection**: Allow passengers to choose specific seats
3. **Group Discounts**: Offer discounts for booking multiple seats
4. **Waitlist**: Queue system when trips are full
5. **Split Payments**: Allow group members to pay separately
6. **Real-Time Seat Map**: Visual representation of seat availability

---

## Support

For questions or issues related to shared ride booking:
- Review API documentation at `/api-docs`
- Check integration examples in `docs/examples/`
- Contact: dev-team@steppergo.com
