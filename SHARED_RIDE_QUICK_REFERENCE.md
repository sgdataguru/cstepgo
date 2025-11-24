# Shared Ride Booking - Quick Reference Guide

## 🚀 Quick Start

### For Backend Developers

#### 1. Database Migration
```bash
# Apply schema changes
npx prisma generate
npx prisma migrate dev --name add_shared_ride_support
```

#### 2. Test the API
```bash
# Check seat availability
curl http://localhost:3000/api/trips/TRIP_ID/availability?seats=2

# Book shared ride seats
curl -X POST http://localhost:3000/api/bookings/shared \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "TRIP_ID",
    "userId": "USER_ID",
    "seatsBooked": 2,
    "passengers": [
      {"name": "John Doe", "age": 30},
      {"name": "Jane Smith", "age": 28}
    ]
  }'

# List bookings
curl "http://localhost:3000/api/bookings/shared?userId=USER_ID"
```

### For Frontend Developers

#### API Endpoints to Use

**1. Check Availability**
```typescript
const checkAvailability = async (tripId: string, seats: number) => {
  const response = await fetch(
    `/api/trips/${tripId}/availability?seats=${seats}`
  );
  return response.json();
};
```

**2. Book Seats**
```typescript
const bookSharedRide = async (bookingData: {
  tripId: string;
  userId: string;
  seatsBooked: number;
  passengers: Array<{name: string; age?: number}>;
}) => {
  const response = await fetch('/api/bookings/shared', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  return response.json();
};
```

**3. List Bookings**
```typescript
const getUserBookings = async (userId: string, page = 1) => {
  const response = await fetch(
    `/api/bookings/shared?userId=${userId}&page=${page}&limit=20`
  );
  return response.json();
};
```

## 📝 Key Concepts

### Trip Types
- **PRIVATE**: Entire vehicle booked by one party
- **SHARED**: Individual seats can be booked by different passengers

### Pricing
- **Private Trips**: Fixed price for entire trip
- **Shared Trips**: Price per seat × number of seats + platform fee

### Multi-Tenancy
- Optional `tenantId` field isolates data between organizations
- Cross-tenant booking attempts are automatically rejected
- Leave `tenantId` empty for single-tenant deployments

## 🔒 Security Notes

### Atomic Booking
- Uses database transactions to prevent double-booking
- Real-time availability check within transaction
- Automatic rollback on any error

### Validation
- Input validation with Zod schemas
- Passenger count must match seats booked
- Availability checked before and during booking
- Tenant context validated when provided

### Division by Zero Protection
All pricing calculations include safeguards:
```typescript
const pricePerSeat = trip.pricePerSeat 
  ? Number(trip.pricePerSeat)
  : trip.totalSeats > 0 
    ? Number(trip.basePrice) / trip.totalSeats
    : Number(trip.basePrice); // Fallback
```

## 🎯 Common Use Cases

### Use Case 1: Passenger Books 2 Seats
```typescript
// 1. Check availability first
const availability = await checkAvailability(tripId, 2);
if (!availability.data.availability.canBook) {
  alert(availability.data.availability.message);
  return;
}

// 2. Show pricing
console.log(`Total: ${availability.data.pricing.estimatedTotal} KZT`);

// 3. Book if user confirms
const booking = await bookSharedRide({
  tripId,
  userId: currentUser.id,
  seatsBooked: 2,
  passengers: [
    { name: "Alice", age: 32 },
    { name: "Bob", age: 29 }
  ]
});

// 4. Show confirmation
console.log(`Booking ID: ${booking.data.bookingId}`);
console.log(`Seats remaining: ${booking.data.seatsRemaining}`);
```

### Use Case 2: Driver Filters for Shared Rides Only
```typescript
const getSharedRides = async (driverId: string) => {
  const response = await fetch(
    `/api/drivers/trips/available?tripTypes=SHARED&radius=15`,
    { headers: { 'x-driver-id': driverId } }
  );
  return response.json();
};
```

### Use Case 3: Check Real-Time Seat Availability
```typescript
const SeatAvailabilityDisplay = ({ tripId, requestedSeats }) => {
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    const checkSeats = async () => {
      const data = await checkAvailability(tripId, requestedSeats);
      setAvailability(data.data.availability);
    };
    checkSeats();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkSeats, 30000);
    return () => clearInterval(interval);
  }, [tripId, requestedSeats]);

  if (!availability) return <div>Loading...</div>;

  return (
    <div>
      <p>{availability.availableSeats} of {availability.totalSeats} seats available</p>
      {!availability.canBook && (
        <p className="text-red-500">{availability.message}</p>
      )}
    </div>
  );
};
```

## 🐛 Troubleshooting

### "Insufficient seats available"
- Another user booked seats between availability check and booking
- Recommend user to check availability again and try with fewer seats

### "Tenant context mismatch"
- Booking attempted across different tenants
- Ensure `tenantId` matches between trip and booking request
- Leave `tenantId` undefined for single-tenant deployments

### "Trip is not available for booking"
- Trip status is not PUBLISHED
- Check trip.status field (should be PUBLISHED)
- Trips in DRAFT, FULL, or COMPLETED status cannot be booked

### Division by zero error (should not occur)
- Trip has `totalSeats = 0` (invalid configuration)
- API now returns 500 error with clear message
- Fix by updating trip.totalSeats to valid number

## 📊 Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success (GET requests) | Process data |
| 201 | Created (booking successful) | Show confirmation |
| 400 | Bad request (validation error) | Show error to user |
| 404 | Trip not found | Invalid trip ID |
| 500 | Server error | Retry or contact support |

## 🔗 Related Documentation

- Full Implementation Guide: `SHARED_RIDE_BOOKING_IMPLEMENTATION.md`
- API Types: `src/types/shared-ride-types.ts`
- Schema: `prisma/schema.prisma`
- Test Examples: See implementation guide section 7

## 📞 Support

Questions? Check:
1. Full documentation in `SHARED_RIDE_BOOKING_IMPLEMENTATION.md`
2. Type definitions in `src/types/shared-ride-types.ts`
3. API endpoint implementations in `src/app/api/bookings/shared/`
