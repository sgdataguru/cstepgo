# Unified Realtime Event System Documentation

## Overview

StepperGO uses a unified realtime event system that broadcasts events to both **Server-Sent Events (SSE)** and **Socket.IO** transports, ensuring consistent real-time updates across all clients.

## Architecture

### Event Transports

1. **SSE (Server-Sent Events)**: HTTP-based unidirectional streaming
   - Endpoint: `/api/realtime/trip-status/[tripId]`
   - Best for: Trip status subscriptions
   - Advantages: Simple, HTTP-based, works through most firewalls

2. **Socket.IO**: WebSocket-based bidirectional communication
   - Endpoint: `/api/socket`
   - Best for: Interactive features, driver subscriptions, chat
   - Advantages: Full duplex, lower latency, automatic reconnection

### Unified Event Emitter

The `unifiedEventEmitter.ts` module centralizes event emission to both transports, ensuring:
- **Consistency**: Same event structure for all channels
- **Reliability**: Graceful fallback if one transport fails
- **Maintainability**: Single source of truth for event emission

## Event Types

### Trip Events

#### 1. Trip Created
**Event**: `trip.created`  
**Emitted when**: A new trip is created  
**Channels**: Logging/Analytics (internal)

```typescript
emitTripCreated({
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED';
  title: string;
  organizerId: string;
  status: string;
})
```

#### 2. Trip Status Updated
**Event**: `trip.status.updated`  
**Emitted when**: Trip status changes (acceptance, departure, arrival, completion, cancellation)  
**Channels**: SSE + Socket.IO

```typescript
emitTripStatusUpdate({
  tripId: string;
  tripTitle: string;
  previousStatus: TripStatus;
  newStatus: TripStatus;
  driverName?: string;
  notes?: string;
  originName: string;
  destName: string;
})
```

**Example triggers:**
- Driver accepts trip: `PUBLISHED` → `IN_PROGRESS`
- Driver departs: `IN_PROGRESS` → `DEPARTED`
- Trip completed: `ARRIVED` → `COMPLETED`
- Trip cancelled: any status → `CANCELLED`

#### 3. Trip Offer Created
**Event**: `trip.offer.created`  
**Emitted when**: Private trip is published and broadcast to drivers  
**Channels**: Socket.IO (driver rooms)

```typescript
// Handled by realtimeBroadcastService.broadcastTripOffer()
// Includes: trip details, estimated earnings, distance, urgency, deadline
```

### Booking Events

#### 1. Booking Confirmed
**Event**: `booking.confirmed`  
**Emitted when**: Passenger books a trip  
**Channels**: Socket.IO (trip room)

```typescript
emitBookingConfirmed({
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED';
  bookingId: string;
  passengerId: string;
  passengerName: string;
  seatsBooked: number;
  availableSeats: number;
  totalSeats: number;
  tenantId?: string;
})
```

**Recipients:**
- Driver assigned to the trip
- Other passengers on shared rides
- Trip organizer

#### 2. Booking Cancelled
**Event**: `booking.cancelled`  
**Emitted when**: Passenger cancels their booking  
**Channels**: Socket.IO (trip room)

```typescript
emitBookingCancelled({
  tripId: string;
  tripType: 'PRIVATE' | 'SHARED';
  bookingId: string;
  passengerId: string;
  passengerName: string;
  seatsFreed: number;
  availableSeats: number;
  totalSeats: number;
  reason?: string;
  tenantId?: string;
})
```

**Recipients:**
- Driver assigned to the trip
- Other passengers on shared rides
- Trip organizer

## Event Emission Lifecycle

### Trip Creation Flow

```
1. POST /api/trips
   ↓
2. Create trip in database
   ↓
3. emitTripCreated() → Log event
   ↓
4. If PRIVATE + PUBLISHED + no driver:
   realtimeBroadcastService.broadcastTripOffer() → Socket.IO (eligible drivers)
```

### Booking Creation Flow

```
1. POST /api/bookings
   ↓
2. Create booking in transaction
   - Create booking record
   - Decrement availableSeats
   - Create payment record (if applicable)
   ↓
3. emitBookingConfirmed() → Socket.IO (trip room)
   ↓
4. If applicable: broadcastTripOffer() for private trips
```

### Booking Cancellation Flow

```
1. PATCH /api/bookings/[id] (action: cancel)
   OR POST /api/passengers/bookings/[bookingId]/cancel
   ↓
2. Cancel booking in transaction
   - Update booking status to CANCELLED
   - Increment availableSeats
   ↓
3. emitBookingCancelled() → Socket.IO (trip room)
```

### Trip Status Update Flow

```
1. PUT /api/drivers/trips/[tripId]/status
   ↓
2. Update trip status in transaction
   - Update trip.status
   - Create TripStatusUpdate log
   - Update driver availability (if completed/cancelled)
   - Update booking statuses (if applicable)
   ↓
3. Send passenger notifications (if configured)
   ↓
4. emitTripStatusUpdate() → SSE + Socket.IO
```

### Driver Acceptance Flow

```
1. POST /api/drivers/trips/accept/[tripId]
   ↓
2. Accept trip in transaction
   - Assign driver to trip
   - Update trip status to IN_PROGRESS
   - Update driver availability to BUSY
   - Confirm pending bookings
   ↓
3. emitTripStatusUpdate() → SSE + Socket.IO
   - previousStatus: PUBLISHED
   - newStatus: IN_PROGRESS
   - notes: "Driver has accepted your trip..."
```

## Subscription Patterns

### Passengers (SSE)

Subscribe to trip status updates:

```typescript
const eventSource = new EventSource(`/api/realtime/trip-status/${tripId}`);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'connected':
      console.log('Connected, current status:', data.currentStatus);
      break;
    case 'status_update':
      console.log('Status changed:', data.previousStatus, '→', data.newStatus);
      break;
    case 'heartbeat':
      // Keep-alive ping
      break;
  }
});

eventSource.addEventListener('error', (error) => {
  console.error('SSE connection error:', error);
});
```

### Passengers (Socket.IO)

Subscribe to trip and booking events:

```typescript
import { io } from 'socket.io-client';

const socket = io({
  auth: { token: userToken }
});

// Subscribe to trip updates
socket.emit('passenger:subscribe', {
  passengerId: user.passengerId,
  tripIds: [tripId1, tripId2, ...]
});

// Listen for events
socket.on('trip.status.updated', (event) => {
  console.log('Trip status updated:', event);
});

socket.on('booking.confirmed', (event) => {
  console.log('New booking confirmed:', event);
});

socket.on('booking.cancelled', (event) => {
  console.log('Booking cancelled:', event);
});
```

### Drivers (Socket.IO)

Subscribe to trip offers and updates:

```typescript
import { io } from 'socket.io-client';

const socket = io({
  auth: { token: driverToken }
});

// Subscribe to trip offers
socket.emit('driver:subscribe', {
  driverId: driver.id,
  filters: {
    maxDistance: 50, // km
    minEarnings: 5000, // KZT
    tripTypes: ['PRIVATE', 'SHARED']
  }
});

// Listen for trip offers
socket.on('trip.offer.created', (offer) => {
  console.log('New trip offer:', offer);
  // Display offer to driver with countdown timer
  // offer.acceptanceDeadline
  // offer.estimatedEarnings
  // offer.distance
});

// Listen for trip status updates
socket.on('trip.status.updated', (event) => {
  console.log('Trip status changed:', event);
});
```

## Error Handling

All event emission functions follow this pattern:

```typescript
try {
  await emitEventFunction(data);
} catch (error) {
  console.error('Event emission failed:', error);
  // Don't fail the primary operation
  // Log error for monitoring
}
```

**Key principles:**
1. **Non-blocking**: Event emission failures never fail the primary operation (booking, trip creation, etc.)
2. **Graceful degradation**: If SSE fails, Socket.IO still works (and vice versa)
3. **Monitoring**: All failures are logged for debugging and alerting

## EmissionResult Structure

All emission functions return a consistent result:

```typescript
interface EmissionResult {
  success: boolean;          // true if at least one channel succeeded
  sse: {
    sent: boolean;           // true if SSE broadcast succeeded
    connections: number;     // number of SSE connections notified
    error?: string;          // error message if failed
  };
  socketio: {
    sent: boolean;           // true if Socket.IO broadcast succeeded
    error?: string;          // error message if failed
  };
}
```

## Testing Event Emission

### Manual Testing

1. **Trip Creation**:
   ```bash
   curl -X POST http://localhost:3000/api/trips \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Trip",
       "origin": {"name": "Almaty"},
       "destination": {"name": "Astana"},
       ...
     }'
   ```
   Check logs for: "Trip created: {tripId} (PRIVATE) - ..."

2. **Booking Creation**:
   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Authorization: Bearer {token}" \
     -d '{"tripId": "...", "seatsBooked": 2, ...}'
   ```
   Check logs for: "Booking confirmed event emitted for booking {id}"

3. **Status Update**:
   ```bash
   curl -X PUT http://localhost:3000/api/drivers/trips/{tripId}/status \
     -H "x-driver-id: {driverId}" \
     -d '{"status": "DEPARTED", "notes": "Left pickup location"}'
   ```
   Check logs for successful SSE and Socket.IO emission

### Automated Validation

Run the validation script:

```bash
npx tsx scripts/validate-realtime-event-emission.ts
```

This checks:
- ✓ Unified event emitter exists
- ✓ All emission functions exported
- ✓ All API endpoints use unified emitter
- ✓ Event types and constants defined
- ✓ SSE and Socket.IO services exist

## Monitoring & Observability

### Event Emission Logs

All emissions produce structured logs:

```
Trip created: abc123 (PRIVATE) - "Almaty to Astana" by user-xyz, status: PUBLISHED
Booking confirmed event emitted for booking def456
Trip status update broadcast for trip abc123: PUBLISHED -> IN_PROGRESS
```

### Get Emission Statistics

```typescript
import { getEmissionStats } from '@/lib/realtime/unifiedEventEmitter';

const stats = getEmissionStats();
console.log(stats);
// {
//   sse: {
//     activeConnections: 5,
//     activeTripIds: ['trip1', 'trip2', ...]
//   },
//   socketio: {
//     initialized: true
//   }
// }
```

## Migration from Old System

### Before (Fragmented)

```typescript
// Status updates only to SSE
broadcastStatusUpdate(tripId, data);

// No booking events emitted
// No trip creation events emitted
```

### After (Unified)

```typescript
// Status updates to both SSE and Socket.IO
await emitTripStatusUpdate(data);

// Booking events to Socket.IO
await emitBookingConfirmed(data);
await emitBookingCancelled(data);

// Trip creation events logged
await emitTripCreated(data);
```

## Best Practices

1. **Always use unified emitter**: Don't call SSE or Socket.IO services directly
2. **Don't fail on emission errors**: Wrap in try-catch, log errors, continue
3. **Include all required fields**: TypeScript will enforce event structure
4. **Test both channels**: Verify SSE and Socket.IO both receive events
5. **Monitor emission failures**: Set up alerting for repeated failures

## Future Enhancements

- [ ] Add retry logic for failed emissions
- [ ] Implement event replay for missed updates
- [ ] Add Redis pub/sub for multi-server deployments
- [ ] Create event audit trail in database
- [ ] Add rate limiting for high-frequency events
- [ ] Implement event batching for efficiency

## Support

For issues or questions:
- Check validation script output
- Review emission logs
- Verify event types in `src/types/realtime-events.ts`
- Test with manual curl commands
- Check Socket.IO connection in browser DevTools
