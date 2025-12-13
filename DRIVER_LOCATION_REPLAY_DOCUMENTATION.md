# Driver Location Replay Feature

## Overview

This feature ensures that passengers who connect to a trip **after** recent driver location updates receive the current driver location state. Previously, late-connecting passengers would miss location updates until the next real-time broadcast, resulting in a poor user experience with outdated or missing driver position information.

## Problem Statement

**Before this feature:**
- Driver updates location at T=0
- Location saved to database and broadcast to connected passengers
- Passenger connects at T=30s → No location shown
- Passenger must wait for next driver update to see location
- This creates a "missed state" problem for late joiners

**After this feature:**
- Driver updates location at T=0
- Passenger connects at T=30s → **Receives replayed location immediately**
- Passenger sees current driver position on connection
- Real-time updates continue as normal

## Implementation

### Architecture

```
┌─────────────────┐
│   Driver App    │
│                 │
│  Updates GPS    │
└────────┬────────┘
         │
         │ WebSocket: driver:location:update
         │
         ▼
┌─────────────────────────────┐
│   Socket.IO Server          │
│                             │
│  1. Save to DB              │
│  2. Broadcast to trip room  │
└─────────────────────────────┘
         │
         │ Real-time broadcast
         │
         ▼
┌─────────────────────────────┐
│  Connected Passengers       │
│  (Receive location live)    │
└─────────────────────────────┘

         ┌────────────────────┐
         │  New Passenger     │
         │  Connects Late     │
         └─────────┬──────────┘
                   │
                   │ WebSocket: passenger:subscribe
                   │
                   ▼
         ┌─────────────────────────────┐
         │  Socket Handler             │
         │                             │
         │  1. Join trip rooms         │
         │  2. Fetch last location     │ ◄── NEW!
         │  3. Replay if < 5 min old   │ ◄── NEW!
         │  4. Send to passenger only  │ ◄── NEW!
         └─────────────────────────────┘
                   │
                   │ driver.location.updated (replayed)
                   │
                   ▼
         ┌─────────────────────┐
         │  Passenger receives │
         │  current location!  │
         └─────────────────────┘
```

### Key Components

#### 1. Configuration Constants (`src/lib/constants/realtime.ts`)

```typescript
// Location replay settings
export const LOCATION_REPLAY_ENABLED = true;
export const LOCATION_REPLAY_MAX_AGE = 300000; // 5 minutes in milliseconds
export const LOCATION_REPLAY_COUNT = 1; // Number of locations to replay
```

**Configuration Guide:**
- `LOCATION_REPLAY_ENABLED`: Toggle feature on/off
- `LOCATION_REPLAY_MAX_AGE`: Maximum age of location to replay (default: 5 minutes)
  - Prevents replaying stale data
  - Configurable based on use case
- `LOCATION_REPLAY_COUNT`: Number of recent locations to replay (currently: 1)
  - Could be increased for route history in future

#### 2. Replay Function (`src/lib/realtime/socketHandlers.ts`)

```typescript
async function replayDriverLocation(
  socket: Socket,
  tripId: string
): Promise<boolean>
```

**Responsibilities:**
- Fetch trip with driver location from database
- Validate location exists and is recent (< 5 minutes)
- Calculate ETA to pickup and destination
- Create location event with all metadata
- Send directly to connecting passenger (not broadcast)
- Handle edge cases gracefully

**Edge Cases Handled:**
- Trip has no assigned driver → Skip replay, return false
- Driver has no location data → Skip replay, return false
- Location is too old (>5 min) → Skip replay, log reason
- Database error → Log error, return false

#### 3. Modified Subscription Handler

```typescript
socket.on('passenger:subscribe', async (data: { tripIds: string[] }) => {
  // ... existing logic ...
  
  // NEW: Replay last known driver location for each accessible trip
  let replayedCount = 0;
  for (const tripId of accessibleTripIds) {
    const replayed = await replayDriverLocation(socket, tripId);
    if (replayed) {
      replayedCount++;
    }
  }

  socket.emit('passenger:subscribed', {
    message: 'Successfully subscribed to trip updates',
    tripIds: accessibleTripIds,
    locationsReplayed: replayedCount, // NEW: Inform client of replays
  });
});
```

### Database Schema

Uses existing `DriverLocation` table:

```prisma
model DriverLocation {
  driverId    String   @id @map("driver_id")
  latitude    Decimal  @db.Decimal(10, 8)
  longitude   Decimal  @db.Decimal(11, 8)
  heading     Decimal? @db.Decimal(5, 2)
  speed       Decimal? @db.Decimal(5, 2)
  accuracy    Decimal? @db.Decimal(8, 2)
  lastUpdated DateTime @default(now()) @map("last_updated")
  isActive    Boolean  @default(true) @map("is_active")
  
  driver User @relation(fields: [driverId], references: [id])
}
```

## Usage

### Client-Side Integration

#### Passenger WebSocket Hook

```typescript
import { usePassengerWebSocket } from '@/hooks/usePassengerWebSocket';

function TripTrackingPage({ tripId }: { tripId: string }) {
  const { 
    isConnected, 
    isSubscribed, 
    driverLocation 
  } = usePassengerWebSocket({
    token: session.token,
    tripIds: [tripId],
    onDriverLocation: (location) => {
      // Update map with driver position
      updateDriverMarker(location.latitude, location.longitude);
      
      // Show ETA
      if (location.eta) {
        setPickupETA(location.eta.pickupMinutes);
        setDestinationETA(location.eta.destinationMinutes);
      }
    },
  });

  return (
    <div>
      {/* driverLocation will be populated with replayed location */}
      {driverLocation && (
        <DriverMap
          position={{
            lat: driverLocation.latitude,
            lng: driverLocation.longitude,
          }}
          heading={driverLocation.heading}
          eta={driverLocation.eta}
        />
      )}
    </div>
  );
}
```

#### Expected Socket Events

**When passenger connects:**

```javascript
// 1. Passenger subscribes
socket.emit('passenger:subscribe', {
  tripIds: ['trip-123', 'trip-456']
});

// 2. Server confirms subscription with replay count
socket.on('passenger:subscribed', (data) => {
  console.log(data);
  // {
  //   message: 'Successfully subscribed to trip updates',
  //   tripIds: ['trip-123', 'trip-456'],
  //   locationsReplayed: 2  // ← NEW: 2 locations were replayed
  // }
});

// 3. Passenger receives replayed locations (if available)
socket.on('driver.location.updated', (location) => {
  console.log('Replayed driver location:', location);
  // {
  //   type: 'driver.location.updated',
  //   tripId: 'trip-123',
  //   driverId: 'driver-456',
  //   latitude: 43.2220,
  //   longitude: 76.8512,
  //   heading: 90,
  //   speed: 50,
  //   accuracy: 10,
  //   eta: {
  //     pickupMinutes: 15,
  //     destinationMinutes: 45
  //   },
  //   timestamp: '2024-12-13T10:30:00Z'
  // }
});

// 4. Continue receiving real-time updates
socket.on('driver.location.updated', (location) => {
  // New location updates arrive as they happen
});
```

## Testing

### Automated Tests

Run the test suite:

```bash
npm test src/__tests__/realtime/driverLocationReplay.test.ts
```

**Test Coverage:**
- ✅ Constants validation
- ✅ Replay threshold logic (5-minute window)
- ✅ Event structure validation
- ✅ ETA calculations
- ✅ Location freshness scenarios (30s, 1m, 2m, 5m, 6m, 10m)
- ✅ Passenger subscription response
- ✅ Late join scenarios
- ✅ Reconnection scenarios
- ✅ Multiple trips handling
- ✅ Edge cases (missing driver, missing location, feature toggle)

### Manual Validation

Run the validation script:

```bash
npx tsx scripts/validate-location-replay.ts
```

This script will:
1. Check for recent driver locations in database
2. Identify trips with replayable locations
3. Find active passenger bookings eligible for replay
4. Verify configuration settings
5. Provide manual testing instructions

### Manual Testing Steps

#### Scenario 1: Late Join (Happy Path)

1. **Setup:**
   - Have driver start trip and update location
   - Wait 30 seconds (location is still fresh)

2. **Test:**
   - Connect as passenger and subscribe to trip
   - Observe WebSocket events in browser console

3. **Expected Result:**
   ```
   ✓ passenger:subscribed { locationsReplayed: 1 }
   ✓ driver.location.updated (replayed with recent timestamp)
   ✓ Map shows driver's current position immediately
   ```

#### Scenario 2: Stale Location

1. **Setup:**
   - Have driver update location
   - Wait 10 minutes (location becomes stale)

2. **Test:**
   - Connect as passenger and subscribe to trip

3. **Expected Result:**
   ```
   ✓ passenger:subscribed { locationsReplayed: 0 }
   ✓ No replayed location (correctly skipped)
   ✓ Passenger waits for next real-time update
   ```

#### Scenario 3: Reconnection

1. **Setup:**
   - Passenger connected and receiving locations
   - Simulate network disconnect (close WebSocket)
   - Wait 30 seconds
   - Reconnect

2. **Test:**
   - Reconnect and resubscribe to trip

3. **Expected Result:**
   ```
   ✓ On reconnect, receives last known location again
   ✓ No gap in location awareness
   ✓ Smooth reconnection experience
   ```

#### Scenario 4: Multiple Trips

1. **Setup:**
   - Create multiple active trips with drivers
   - Each driver updates location at different times

2. **Test:**
   - Passenger subscribes to all trips at once

3. **Expected Result:**
   ```
   ✓ passenger:subscribed { tripIds: [...], locationsReplayed: N }
   ✓ Receives replayed location for each eligible trip
   ✓ All trips show current driver positions
   ```

## Monitoring & Logging

### Server Logs

The feature includes comprehensive logging:

```typescript
// Successful replay
console.log(`Replayed driver location for trip ${tripId} to passenger (age: 45s)`);

// Skipped replay (too old)
console.log(`Skipping location replay for trip ${tripId}: location too old (600s)`);

// Subscription summary
console.log(`User ${userId} subscribed to 3 trips, replayed 2 driver locations`);
```

### Metrics to Monitor

1. **Replay Rate**: `replayedCount / totalSubscriptions`
   - High rate = Good (many fresh locations)
   - Low rate = Potential issue (stale locations or inactive drivers)

2. **Location Age Distribution**
   - Track age of replayed locations
   - Alert if consistently > 4 minutes

3. **Subscription Success Rate**
   - Track `passenger:subscribed` events
   - Monitor `locationsReplayed` values

## Performance Considerations

### Database Query Optimization

The replay function uses a single optimized query:

```typescript
const trip = await prisma.trip.findUnique({
  where: { id: tripId },
  select: {
    id: true,
    driverId: true,
    status: true,
    originLat: true,
    originLng: true,
    destLat: true,
    destLng: true,
    driver: {
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            driverLocation: {
              select: {
                latitude: true,
                longitude: true,
                heading: true,
                speed: true,
                accuracy: true,
                lastUpdated: true,
              },
            },
          },
        },
      },
    },
  },
});
```

**Performance Characteristics:**
- Single query per trip (no N+1)
- Indexed lookups (trip ID, driver ID)
- Selective field projection (minimal data transfer)
- Fast in-memory age check

### Scalability

**Load Impact:**
- Extra DB query per passenger subscription
- Query is fast (<10ms typical)
- Passenger subscriptions are infrequent (connection/reconnection only)
- No impact on real-time location broadcasts

**Optimization Options (if needed):**
1. Cache recent driver locations in Redis (5-minute TTL)
2. Batch replay for multiple trips in one query
3. Pre-fetch during driver location update

## Configuration Tuning

### Adjusting Replay Window

```typescript
// More aggressive (shorter window)
export const LOCATION_REPLAY_MAX_AGE = 120000; // 2 minutes

// More lenient (longer window)
export const LOCATION_REPLAY_MAX_AGE = 600000; // 10 minutes
```

**Considerations:**
- Shorter window: More accurate, fewer replays
- Longer window: Better coverage, potentially stale data
- Recommended: 5 minutes (good balance)

### Disabling Feature

```typescript
export const LOCATION_REPLAY_ENABLED = false;
```

Use cases for disabling:
- Testing legacy behavior
- Troubleshooting issues
- Gradual rollout (A/B testing)

## Future Enhancements

### Potential Improvements

1. **Route History Replay**
   ```typescript
   export const LOCATION_REPLAY_COUNT = 10; // Last 10 locations
   // Show driver's recent path on map
   ```

2. **Redis Cache Layer**
   ```typescript
   // Cache recent locations for faster replay
   await redis.set(`driver:${driverId}:location`, location, 'EX', 300);
   ```

3. **Replay Acknowledgment**
   ```typescript
   // Client confirms receipt
   socket.emit('location:replay:ack', { tripId, receivedCount: 2 });
   ```

4. **Selective Replay**
   ```typescript
   // Only replay for certain trip statuses
   if (trip.status === 'IN_PROGRESS') {
     await replayDriverLocation(socket, tripId);
   }
   ```

## Troubleshooting

### Issue: Passenger not receiving replayed location

**Diagnostic Steps:**
1. Check server logs for replay attempt
2. Verify driver location exists in database:
   ```sql
   SELECT * FROM driver_locations WHERE driver_id = 'XXX';
   ```
3. Check location age:
   ```sql
   SELECT *, NOW() - last_updated as age 
   FROM driver_locations 
   WHERE driver_id = 'XXX';
   ```
4. Confirm trip has assigned driver:
   ```sql
   SELECT id, driver_id FROM trips WHERE id = 'XXX';
   ```

**Common Causes:**
- Location older than 5 minutes
- Driver hasn't updated location yet
- Trip has no assigned driver
- Feature disabled (`LOCATION_REPLAY_ENABLED = false`)

### Issue: Replayed location shows wrong position

**Check:**
1. Driver location accuracy: `driverLocation.accuracy`
2. Location timestamp: `driverLocation.lastUpdated`
3. ETA calculations (use correct coordinates)

## Security Considerations

### Access Control

- Passenger must have booking on trip OR be organizer
- Driver locations only sent to authorized passengers
- No bulk location queries allowed

### Data Privacy

- Location data stored with standard retention policy
- Replay only sends to authorized users
- No location history exposed (only last known)

## API Reference

### Socket Events

#### `passenger:subscribe`

Subscribe to trip updates and request location replay.

**Client → Server:**
```typescript
socket.emit('passenger:subscribe', {
  tripIds: string[] // Array of trip IDs
});
```

**Server → Client:**
```typescript
socket.on('passenger:subscribed', {
  message: string,
  tripIds: string[],
  locationsReplayed: number  // Count of replayed locations
});
```

#### `driver.location.updated`

Receive driver location update (real-time or replayed).

**Server → Client:**
```typescript
socket.on('driver.location.updated', {
  type: 'driver.location.updated',
  tripId: string,
  driverId: string,
  latitude: number,
  longitude: number,
  heading?: number,
  speed?: number,
  accuracy?: number,
  eta?: {
    pickupMinutes?: number,
    destinationMinutes?: number
  },
  timestamp: string // ISO 8601
});
```

## Summary

The Driver Location Replay feature ensures **zero missed state** for passengers joining trips after driver location updates. By replaying the last known driver location (if fresh), passengers get an immediate, accurate view of the driver's position, improving UX and reducing confusion.

**Key Benefits:**
✅ No missed location state for late joiners
✅ Immediate location visibility on connection
✅ Smooth reconnection experience
✅ Configurable freshness threshold
✅ Handles edge cases gracefully
✅ Comprehensive test coverage
✅ Production-ready performance

---

**Last Updated:** December 13, 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready
