# Seat Accounting Race Condition Fix - Technical Documentation

## Overview

This document describes the comprehensive fix implemented to prevent race conditions in the booking system, particularly focusing on seat accounting for both standard and shared rides.

## Problem Statement

### Original Issues

1. **Standard Bookings (`/api/bookings`)**
   - `availableSeats` was read outside the transaction
   - Seat decrement happened after booking creation
   - Multiple concurrent requests could read the same seat count before any write, leading to overbooking

2. **Shared Bookings (`/api/bookings/shared`)**
   - Manual seat recalculation from bookings without row locking
   - No optimistic locking or version checking
   - Classic race condition vulnerable to concurrent updates

3. **Lack of Real-Time Updates**
   - Seat availability changes not broadcast to connected clients
   - Stale data on client side leading to poor UX and potential double bookings
   - No real-time notification to drivers about cancellations

## Solution Architecture

### 1. Database Schema Changes

#### Added Version Field for Optimistic Locking

```sql
-- Added to Trip table
ALTER TABLE "Trip" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Trip_version_idx" ON "Trip"("version");
```

**Purpose**: Enable optimistic locking to detect concurrent modifications.

#### Prisma Schema Update

```prisma
model Trip {
  // ... other fields
  
  // Concurrency Control
  version       Int       @default(0) @map("version") // Optimistic locking version
  
  // ... relations and indexes
  @@index([version])
}
```

### 2. Row-Level Locking with SELECT FOR UPDATE

All booking operations now use PostgreSQL's row-level locking mechanism:

```typescript
// Lock the trip row for the duration of the transaction
const tripRaw = await tx.$queryRaw<Array<TripData>>`
  SELECT id, "availableSeats", version, status, ...
  FROM "Trip"
  WHERE id = ${tripId}
  FOR UPDATE
`;
```

**Benefits**:
- Prevents concurrent transactions from reading the same row
- Forces serial execution of seat modifications
- Guarantees consistency without deadlocks

### 3. Optimistic Locking Implementation

Every seat update includes a version check:

```typescript
const updateResult = await tx.$executeRaw`
  UPDATE "Trip"
  SET "availableSeats" = "availableSeats" - ${seatsBooked},
      version = version + 1,
      status = CASE 
        WHEN "availableSeats" - ${seatsBooked} = 0 THEN 'FULL'::text
        ELSE status::text
      END
  WHERE id = ${tripId}
    AND version = ${expectedVersion}
`;

// Check if update was successful
if (updateResult === 0) {
  throw new Error('Booking failed due to concurrent modification. Please try again.');
}
```

**How it works**:
1. Read current version with locked row
2. Perform business logic validation
3. Update with version check in WHERE clause
4. Increment version in same query
5. If affected rows = 0, version mismatch detected → rollback

### 4. Real-Time Broadcasting

#### Seat Availability Updates

After successful booking or cancellation:

```typescript
const io = realtimeBroadcastService.getIO();
if (io) {
  const tripRoom = `trip:${tripId}`;
  io.to(tripRoom).emit('trip.seats.updated', {
    tripId,
    availableSeats,
    totalSeats,
    bookedSeats: totalSeats - availableSeats,
    status,
    timestamp: new Date().toISOString(),
  });
}
```

**Event Structure**:
```typescript
interface SeatUpdateEvent {
  tripId: string;
  availableSeats: number;
  totalSeats: number;
  bookedSeats: number;
  status: string;
  timestamp: string;
}
```

#### Booking Cancellation Broadcast

Notifies both passengers and drivers:

```typescript
await realtimeBroadcastService.broadcastBookingCancellation({
  bookingId,
  tripId,
  driverId,
  userId,
  seatsReleased,
  reason,
});
```

## Implementation Details

### Standard Bookings Flow

```
1. Client sends POST /api/bookings
2. Start transaction
3. SELECT ... FOR UPDATE to lock trip row
4. Validate trip status, user authorization
5. Check seat availability (race-safe, inside lock)
6. Create booking record
7. Update seats with optimistic lock check
8. Create payment record (if cash)
9. Commit transaction
10. Broadcast seat update via WebSocket
11. Return success response
```

### Shared Bookings Flow

```
1. Client sends POST /api/bookings/shared
2. Validate input with Zod schema
3. Start transaction
4. SELECT ... FOR UPDATE to lock trip row
5. Validate trip type, status, tenant context
6. Check seat availability (race-safe)
7. Calculate pricing
8. Create booking record
9. Update seats with optimistic lock + version check
10. Update status to FULL if needed
11. Create payment record (if cash)
12. Commit transaction
13. Broadcast seat update via WebSocket
14. Return success response
```

### Cancellation Flow

```
1. Client sends PATCH /api/bookings/[id] with action=cancel
2. Verify user authorization
3. Start transaction
4. SELECT ... FOR UPDATE to lock trip row
5. Update booking status to CANCELLED
6. Restore seats with optimistic lock check
7. Update status from FULL to PUBLISHED if applicable
8. Commit transaction
9. Broadcast seat update via WebSocket
10. Notify driver of cancellation
11. Return success response
```

## Testing Strategy

### 1. Unit Tests (`src/__tests__/bookings/concurrentBookings.test.ts`)

- **Version Field Tests**: Verify version field exists and increments
- **Row-Level Locking Tests**: Validate FOR UPDATE prevents concurrent modifications
- **Seat Consistency Tests**: Ensure seat counts remain accurate across operations
- **Overbooking Prevention**: Verify system rejects bookings exceeding capacity
- **Cancellation Tests**: Confirm seats restored properly
- **Status Updates**: Check trip marked as FULL when appropriate

**Run tests**:
```bash
npm test -- concurrentBookings.test.ts
```

### 2. Validation Script (`scripts/validate-concurrent-bookings.ts`)

Simulates real-world concurrent booking scenarios:

1. **Version Field Verification**: Checks schema includes version field
2. **Test Trip Creation**: Creates trip with 10 seats
3. **Concurrent Booking Simulation**: 5 users simultaneously try to book 3 seats each
4. **Race Safety Validation**: Verifies only correct number succeed
5. **Overbooking Check**: Confirms total booked + available = total seats
6. **Optimistic Locking Test**: Validates version-based update logic

**Run validation**:
```bash
npx tsx scripts/validate-concurrent-bookings.ts
```

Expected output:
```
✅ PASS: Version field exists in Trip model
✅ PASS: Create test trip
✅ PASS: Concurrent booking race condition test
✅ PASS: No overbooking verification
✅ PASS: Optimistic locking test
✅ PASS: Cleanup test data

📊 Test Summary
Total Tests: 6
Passed: 6
Failed: 0

✅ All tests passed! Concurrent booking system is race-safe.
```

## Performance Considerations

### 1. Row-Level Locking Impact

- **Lock Duration**: Locks held only during transaction (typically < 100ms)
- **Lock Contention**: Minimal - different trips use different locks
- **Throughput**: Serializes updates per trip, but concurrent trips unaffected
- **Scalability**: Horizontal scaling possible (different DB instances per region)

### 2. Optimistic Locking Overhead

- **Extra Query**: Version check adds negligible overhead (part of UPDATE)
- **Retry Logic**: Client should retry on version mismatch (exponential backoff)
- **Version Index**: Indexed version field ensures fast lookups

### 3. Broadcasting Performance

- **Non-Blocking**: Broadcast failures don't affect booking success
- **Connection Pool**: Socket.IO handles connection scaling
- **Room Filtering**: Only sends to subscribed clients (efficient)

## Error Handling

### Concurrent Modification Detection

```typescript
if (updateResult === 0) {
  throw new Error('Booking failed due to concurrent modification. Please try again.');
}
```

**Client Handling**:
- Display user-friendly retry message
- Implement exponential backoff (1s, 2s, 4s)
- Max 3 retries before showing "high demand" message

### Insufficient Seats

```typescript
if (trip.availableSeats < seatsBooked) {
  throw new Error(`Not enough seats available. Only ${trip.availableSeats} seats remaining.`);
}
```

**Client Handling**:
- Show updated seat count
- Suggest alternative departure times
- Enable notifications for seat availability

### Broadcast Failures

```typescript
catch (broadcastError) {
  // Log error but don't fail the booking
  console.error('Failed to broadcast seat availability update:', broadcastError);
}
```

**System Behavior**:
- Booking still succeeds
- Error logged for monitoring
- Clients refresh on next action

## Monitoring & Observability

### Metrics to Track

1. **Concurrent Modification Rate**: How often version mismatches occur
2. **Lock Wait Time**: Average time waiting for row locks
3. **Broadcast Success Rate**: Percentage of successful real-time updates
4. **Booking Success Rate**: Ratio of successful vs. failed bookings
5. **Average Transaction Duration**: Time to complete booking transaction

### Logging

```typescript
console.log(`Seat availability broadcast for trip ${tripId}: ${availableSeats} seats remaining`);
console.log(`Concurrent modification detected on trip ${tripId} - user should retry`);
console.error('Failed to broadcast seat availability update:', broadcastError);
```

### Alerts

- Alert if concurrent modification rate > 5%
- Alert if broadcast success rate < 95%
- Alert if transaction duration > 500ms

## Migration Guide

### For Development Environment

1. **Run Migration**:
   ```bash
   npx prisma migrate dev
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Validation**:
   ```bash
   npx tsx scripts/validate-concurrent-bookings.ts
   ```

4. **Run Tests**:
   ```bash
   npm test -- concurrentBookings.test.ts
   ```

### For Production Environment

1. **Backup Database**:
   ```bash
   pg_dump steppergo_prod > backup_$(date +%Y%m%d).sql
   ```

2. **Apply Migration** (zero downtime):
   ```bash
   npx prisma migrate deploy
   ```

3. **Monitor Logs**: Watch for any errors during first hour

4. **Rollback Plan**: Keep backup for 7 days

## Security Considerations

### SQL Injection Prevention

- All queries use parameterized queries via Prisma
- Raw SQL uses template literals with proper escaping
- No string concatenation with user input

### Authorization

- User ownership verified before booking operations
- Driver authorization checked for cancellations
- Admin role can view/modify any booking

### Data Validation

- Zod schema validation on all inputs
- Business logic validation inside transactions
- Type safety with TypeScript

## Future Enhancements

### 1. Distributed Locking (if needed)

For multi-region deployments:
```typescript
// Using Redis for distributed locks
await redisLock.acquire(`trip:${tripId}`, 5000);
try {
  // Perform booking
} finally {
  await redisLock.release(`trip:${tripId}`);
}
```

### 2. Event Sourcing

For audit trail and replay capability:
```typescript
const event = {
  type: 'BOOKING_CREATED',
  aggregateId: tripId,
  version: newVersion,
  data: { bookingId, seatsBooked, userId },
  timestamp: new Date(),
};
await eventStore.append(event);
```

### 3. CQRS Pattern

Separate read and write models for better scalability:
- Write model: Current implementation
- Read model: Denormalized views with eventual consistency

### 4. WebSocket Acknowledgments

Ensure clients received updates:
```typescript
io.to(tripRoom).timeout(5000).emit('trip.seats.updated', data, (err, responses) => {
  if (err) {
    // Some clients didn't acknowledge
  }
});
```

## Conclusion

This implementation provides a robust, race-condition-free booking system with:

- ✅ Database-level locking (SELECT FOR UPDATE)
- ✅ Optimistic locking (version field)
- ✅ Real-time updates (WebSocket broadcasting)
- ✅ Comprehensive testing (unit tests + validation script)
- ✅ Error handling and retry logic
- ✅ Performance optimization
- ✅ Security best practices

The system can now safely handle high-concurrency scenarios without risk of overbooking.
