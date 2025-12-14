# Private Trip Realtime Broadcasting

## Overview

This document describes the automatic realtime broadcasting feature for private trip creation and booking. This feature ensures that when a private trip is created or booked, eligible drivers are immediately notified via Socket.IO/SSE without requiring manual API calls.

## Problem Statement

Previously, private trip creation and booking did **not** trigger automatic broadcasts to drivers. The system required a manual call to `/api/trips/[id]/broadcast-offer` to notify drivers, which meant:

- Private cab bookings sat in the database with no realtime driver notification
- Violated the "realtime to driver" platform promise
- Created inconsistency between shared and private trip flows
- Required additional manual steps to activate driver matching

## Solution

Automatic broadcasting is now integrated directly into the trip creation and booking API endpoints:

### When Broadcasting Happens

Private trips are automatically broadcast to eligible drivers when **ALL** of these conditions are met:

1. **Trip Type**: `PRIVATE`
2. **Trip Status**: `PUBLISHED` (private trips are auto-published when created)
3. **Driver Assignment**: No driver assigned (`driverId` is `null`)

**Note**: Private trips are automatically published upon creation to enable immediate driver matching. This is different from shared rides which may remain in DRAFT status until manually published.

### Broadcasting Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  POST /api/trips (Create Private Trip)                     │
│                                                             │
│  1. Validate request data                                  │
│  2. Create trip in database                                │
│  3. Check broadcast conditions                             │
│  4. IF conditions met:                                     │
│     ├─ Call realtimeBroadcastService.broadcastTripOffer() │
│     ├─ Update trip status to OFFERED                       │
│     └─ Return success with driver count                    │
│     ELSE:                                                  │
│     └─ Return success without broadcast                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  POST /api/bookings (Book Private Trip)                    │
│                                                             │
│  1. Validate booking data                                  │
│  2. Create booking in transaction                          │
│  3. Fetch complete booking with trip details               │
│  4. Check broadcast conditions                             │
│  5. IF conditions met:                                     │
│     ├─ Call realtimeBroadcastService.broadcastTripOffer() │
│     ├─ Update trip status to OFFERED                       │
│     └─ Drivers notified                                    │
│     ELSE:                                                  │
│     └─ Continue normally                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### API Endpoints Modified

#### 1. POST /api/trips

**File**: `src/app/api/trips/route.ts`

**Changes**:
- Imports `realtimeBroadcastService`
- After trip creation, checks if broadcast conditions are met
- Calls `broadcastTripOffer(tripId)` if conditions satisfied
- Updates trip status to `OFFERED` on successful broadcast
- Gracefully handles broadcast failures (logs error but doesn't fail request)

**Code Example**:
```typescript
// Auto-broadcast private trip offers to eligible drivers in realtime
if (validTripType === 'PRIVATE' && trip.status === 'PUBLISHED' && !trip.driverId) {
  try {
    const broadcastResult = await realtimeBroadcastService.broadcastTripOffer(trip.id);
    console.log(`Private trip ${trip.id} broadcast to ${broadcastResult.sent} drivers`);
    
    await prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'OFFERED' },
    });
    
    message = `${message} Broadcast to ${broadcastResult.sent} nearby drivers.`;
  } catch (broadcastError) {
    console.error('Failed to broadcast private trip offer:', broadcastError);
    message = `${message} Note: Driver notification is in progress.`;
  }
}
```

#### 2. POST /api/bookings

**File**: `src/app/api/bookings/route.ts`

**Changes**:
- Imports `realtimeBroadcastService`
- After booking creation, fetches trip details
- Checks if trip needs broadcasting
- Calls `broadcastTripOffer(tripId)` if conditions satisfied
- Updates trip status to `OFFERED` on successful broadcast
- Gracefully handles broadcast failures (logs error but doesn't fail request)

**Code Example**:
```typescript
// Auto-broadcast private trip offers to eligible drivers in realtime
if (completeBooking && completeBooking.trip.tripType === 'PRIVATE' && 
    completeBooking.trip.status === 'PUBLISHED' && !completeBooking.trip.driverId) {
  try {
    const broadcastResult = await realtimeBroadcastService.broadcastTripOffer(completeBooking.trip.id);
    console.log(`Private trip ${completeBooking.trip.id} broadcast to ${broadcastResult.sent} drivers after booking`);
    
    await prisma.trip.update({
      where: { id: completeBooking.trip.id },
      data: { status: 'OFFERED' },
    });
  } catch (broadcastError) {
    console.error('Failed to broadcast private trip offer after booking:', broadcastError);
  }
}
```

### Broadcast Service

**Service**: `realtimeBroadcastService`  
**File**: `src/lib/services/realtimeBroadcastService.ts`

**Method**: `broadcastTripOffer(tripId: string)`

**What it does**:
1. Fetches trip details from database
2. Calculates trip urgency and deadline based on departure time
3. Calculates estimated driver earnings
4. Finds eligible drivers within discovery radius
5. Broadcasts trip offer to each eligible driver via Socket.IO
6. Logs trip visibility in `TripDriverVisibility` table
7. Returns count of drivers notified

**Return Value**:
```typescript
{
  sent: number,      // Number of drivers successfully notified
  eligible: number   // Total number of eligible drivers found
}
```

## Database Changes

### Trip Status Updates

When a private trip is broadcast, its status changes from:
- `DRAFT` or `PUBLISHED` → `OFFERED`

This status change indicates that the trip has been actively broadcast to drivers and is awaiting acceptance.

### TripDriverVisibility Tracking

Each time a trip is shown to a driver, a record is created:

```typescript
TripDriverVisibility {
  tripId: string
  driverId: string
  shownAt: DateTime
}
```

This allows tracking which drivers saw which trips, supporting analytics and ensuring fair distribution.

## Testing

### Unit Tests

**File**: `src/__tests__/trips/tripCreation.test.ts`

**Tests Added**:
1. ✅ Private cab with DRAFT status should NOT broadcast
2. ✅ Private cab with PUBLISHED status and no driver SHOULD broadcast
3. ✅ Broadcast updates trip status to OFFERED
4. ✅ Broadcast failure doesn't fail trip creation

**Running Tests**:
```bash
npm test -- src/__tests__/trips/tripCreation.test.ts
```

### Validation Script

**File**: `scripts/validate-private-trip-broadcast.ts`

**What it validates**:
1. ✅ Broadcast service is available
2. ✅ Trip API imports broadcast service
3. ✅ Booking API imports broadcast service
4. ✅ Trip API calls broadcastTripOffer
5. ✅ Booking API calls broadcastTripOffer
6. ✅ TripDriverVisibility table exists
7. ✅ Trip model has required fields
8. ✅ Manual broadcast endpoint still exists

**Running Validation**:
```bash
npx tsx scripts/validate-private-trip-broadcast.ts
```

### Manual Testing Checklist

#### Test 1: Private Trip Creation with Immediate Publish

1. Create a private trip with `status: PUBLISHED`
2. Ensure trip has no driver assigned
3. Verify drivers receive Socket.IO event `trip.offer.created`
4. Check trip status changes to `OFFERED`
5. Verify `TripDriverVisibility` records created

#### Test 2: Private Trip Booking

1. Create a private trip with `status: PUBLISHED`, no driver
2. Book the trip as a passenger
3. Verify drivers receive Socket.IO event `trip.offer.created`
4. Check trip status changes to `OFFERED`
5. Verify booking confirmed successfully

#### Test 3: DRAFT Status (Should NOT Broadcast)

1. Create a private trip with `status: DRAFT`
2. Verify NO broadcast occurs
3. Verify trip status remains `DRAFT`
4. No `TripDriverVisibility` records created

#### Test 4: Trip with Assigned Driver (Should NOT Broadcast)

1. Create a private trip with driver already assigned
2. Verify NO broadcast occurs
3. Trip status unchanged

#### Test 5: Shared Ride (Should NOT Broadcast via This Flow)

1. Create a shared ride trip
2. Verify this new broadcast logic does NOT trigger
3. Shared rides use separate broadcast flow

## Error Handling

### Graceful Degradation

If broadcasting fails for any reason:

1. **Trip/Booking Creation**: Still succeeds
2. **User Response**: Still returns success
3. **Error Logging**: Error logged to console
4. **User Message**: "Note: Driver notification is in progress."

This ensures the core functionality (trip creation/booking) is never blocked by broadcast failures.

### Common Broadcast Failures

1. **Socket.IO Not Initialized**: Service logs error, trip still created
2. **No Eligible Drivers**: Broadcast returns `{ sent: 0, eligible: 0 }`, trip still created
3. **Database Error**: Broadcast fails, trip still created
4. **Network Issues**: Broadcast times out, trip still created

## Configuration

### Broadcast Settings

**File**: `src/lib/constants/realtime.ts`

Key settings:
- `DEFAULT_DISCOVERY_RADIUS`: 10 km (drivers within this radius are notified)
- `TRIP_OFFER_DEFAULT_TIMEOUT`: 300 seconds (5 minutes acceptance window)
- `TRIP_OFFER_URGENT_TIMEOUT`: 60 seconds (1 minute for urgent trips)
- `DRIVER_EARNINGS_RATE`: 0.85 (85% of fare goes to driver)

### Environment Variables

No additional environment variables required. Uses existing:
- `DATABASE_URL`: For Prisma database connection
- Socket.IO configuration from server setup

## Backwards Compatibility

### Manual Broadcast Endpoint

The manual broadcast endpoint `/api/trips/[id]/broadcast-offer` is **still available** for:

1. Re-broadcasting trips if needed
2. Admin tools and dashboards
3. Debugging and testing
4. Edge cases requiring manual intervention

### Shared Rides

Shared rides continue to use their existing broadcast flow. This implementation only affects **PRIVATE** trips.

### Trip Status Flow

Existing trip status flow remains unchanged:
- `DRAFT` → Manual publish or immediate if created with `publishImmediately`
- `PUBLISHED` → Now auto-broadcasts if conditions met
- `OFFERED` → Driver accepts
- `CONFIRMED` → Trip confirmed
- And so on...

## Monitoring and Analytics

### Logs to Monitor

1. **Successful Broadcasts**:
   ```
   Private trip {tripId} broadcast to {count} drivers
   ```

2. **Broadcast After Booking**:
   ```
   Private trip {tripId} broadcast to {count} drivers after booking
   ```

3. **Broadcast Failures**:
   ```
   Failed to broadcast private trip offer: {error}
   ```

### Metrics to Track

1. **Broadcast Success Rate**: % of trips successfully broadcast
2. **Average Drivers Notified**: Per private trip
3. **Time to Driver Acceptance**: From broadcast to first acceptance
4. **Broadcast Failures**: Count and reasons

### Database Queries

**Count broadcasted trips**:
```sql
SELECT COUNT(*) FROM "Trip" 
WHERE "tripType" = 'PRIVATE' 
AND "status" = 'OFFERED';
```

**Average drivers per trip**:
```sql
SELECT AVG(driver_count) FROM (
  SELECT "tripId", COUNT(DISTINCT "driverId") as driver_count
  FROM "TripDriverVisibility"
  GROUP BY "tripId"
) subquery;
```

## Future Enhancements

### Potential Improvements

1. **Retry Logic**: Automatic retry if broadcast fails initially
2. **Batch Broadcasting**: Group nearby trips and broadcast in batches
3. **Smart Radius**: Dynamically adjust discovery radius based on availability
4. **Priority Broadcasting**: VIP passengers get broader driver reach
5. **A/B Testing**: Test different broadcast strategies
6. **Analytics Dashboard**: Real-time view of broadcast effectiveness

### Related Features

- Driver preference filtering (e.g., driver only wants certain trip types)
- Dynamic pricing based on driver demand
- Multi-region support with region-specific broadcast settings
- Push notifications as fallback to Socket.IO

## Support and Troubleshooting

### Common Issues

**Issue**: Drivers not receiving trip offers  
**Solutions**:
1. Check Socket.IO server is running
2. Verify driver is `AVAILABLE` status
3. Check driver is within discovery radius
4. Ensure trip status is `PUBLISHED`
5. Verify `realtimeBroadcastService` initialized

**Issue**: Trip created but status not changing to OFFERED  
**Solutions**:
1. Check if trip meets all broadcast conditions
2. Review broadcast error logs
3. Verify database `Trip.update()` permissions
4. Check if Socket.IO initialized

**Issue**: Too many/too few drivers notified  
**Solutions**:
1. Review `DEFAULT_DISCOVERY_RADIUS` setting
2. Check driver availability status in database
3. Verify driver location data is current
4. Review driver subscription filters

### Debug Mode

Enable debug logging:
```typescript
// Add to your environment or code
console.log('Broadcast result:', broadcastResult);
console.log('Trip conditions:', {
  tripType: trip.tripType,
  status: trip.status,
  driverId: trip.driverId
});
```

## Conclusion

Private trip realtime broadcasting is now fully automated and integrated into the core trip creation and booking flows. This ensures:

- ✅ Immediate driver notification for private trips
- ✅ Consistent behavior across trip types
- ✅ No manual intervention required
- ✅ Graceful error handling
- ✅ Full backwards compatibility

For questions or issues, refer to:
- API implementation: `src/app/api/trips/route.ts`, `src/app/api/bookings/route.ts`
- Broadcast service: `src/lib/services/realtimeBroadcastService.ts`
- Tests: `src/__tests__/trips/tripCreation.test.ts`
- Validation: `scripts/validate-private-trip-broadcast.ts`
