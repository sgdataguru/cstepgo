# WebSocket Real-Time Features Documentation

## Overview

StepperGO now includes a comprehensive real-time communication system built on Socket.IO. This enables instant notifications, live trip offers, status updates, and driver location tracking.

## Architecture

### Components

1. **Event Types** (`src/types/realtime-events.ts`)
   - Comprehensive type definitions for all real-time events
   - Type-safe event payloads with TypeScript

2. **Broadcasting Service** (`src/lib/services/realtimeBroadcastService.ts`)
   - Centralized service for managing real-time events
   - Driver and passenger subscription management
   - Distance-based driver matching

3. **Socket Handlers** (`src/lib/realtime/socketHandlers.ts`)
   - Event handlers for driver and passenger actions
   - Authentication and room management
   - Subscription lifecycle management

4. **Client Hooks**
   - `useDriverWebSocket` - Driver-side real-time connection
   - `usePassengerWebSocket` - Passenger-side real-time connection

## Features

### For Drivers

#### Trip Offers
- Real-time trip offers broadcast to eligible drivers
- Distance-based filtering (within driver's service radius)
- Urgency levels (low, normal, high, urgent)
- Difficulty ratings (easy, normal, challenging, difficult)
- Acceptance deadline with countdown

#### Dashboard
- Live connection status indicator
- Real-time trip offer notifications
- Instant acceptance/decline feedback
- Auto-refresh statistics

#### Location Tracking
- Continuous location updates during active trips
- Broadcast to passengers in real-time
- GPS coordinates, heading, speed, and accuracy

### For Passengers

#### Trip Updates
- Real-time trip status notifications
- Driver acceptance alerts
- Status change updates (en-route, arrived, etc.)
- Driver location tracking on map

#### Notifications
- Priority-based notifications
- Category filtering (trip, booking, payment, system, chat)
- Unread count tracking

## Event Types

### Trip Events

#### `trip.offer.created`
Sent to eligible drivers when a new trip is published.

```typescript
{
  type: 'trip.offer.created',
  tripId: string,
  title: string,
  departureTime: string,
  originName: string,
  destName: string,
  distance: number, // km from driver
  estimatedEarnings: number,
  urgency: 'low' | 'normal' | 'high' | 'urgent',
  difficulty: 'easy' | 'normal' | 'challenging' | 'difficult',
  acceptanceDeadline: string,
  // ... more fields
}
```

#### `trip.offer.accepted`
Sent when a driver accepts an offer.

```typescript
{
  type: 'trip.offer.accepted',
  tripId: string,
  driverId: string,
  driverName: string,
  acceptedAt: string,
}
```

#### `trip.status.updated`
Sent when trip status changes.

```typescript
{
  type: 'trip.status.updated',
  tripId: string,
  previousStatus: TripStatus,
  newStatus: TripStatus,
  driverName?: string,
  notes?: string,
}
```

### Location Events

#### `driver.location.updated`
Sent to passengers during active trips.

```typescript
{
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
    destinationMinutes?: number,
  },
}
```

### Notification Events

#### `notification.driver` / `notification.passenger`
General notifications to users.

```typescript
{
  type: 'notification.driver' | 'notification.passenger',
  notificationId: string,
  title: string,
  message: string,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  category: 'trip' | 'booking' | 'payment' | 'system' | 'chat',
  actionUrl?: string,
}
```

## Usage

### Driver Dashboard Integration

```typescript
import { EnhancedDriverDashboard } from '@/components/driver/EnhancedDriverDashboard';

export default function DriverDashboardPage() {
  // Get driver info and session token
  const driverId = 'driver-id';
  const driverName = 'Driver Name';
  const token = 'session-token';

  return (
    <EnhancedDriverDashboard
      driverId={driverId}
      driverName={driverName}
      token={token}
    />
  );
}
```

### Using Driver WebSocket Hook

```typescript
import { useDriverWebSocket } from '@/hooks/useDriverWebSocket';

function DriverComponent({ token }: { token: string }) {
  const {
    isConnected,
    isSubscribed,
    tripOffers,
    acceptOffer,
    declineOffer,
    updateLocation,
    error,
  } = useDriverWebSocket({
    token,
    filters: {
      maxDistance: 50, // 50 km radius
      minEarnings: 5000, // Minimum ₸5000
    },
    onTripOffer: (offer) => {
      console.log('New offer:', offer.tripId);
      // Show notification
    },
    onTripStatusUpdate: (update) => {
      console.log('Status changed:', update.newStatus);
      // Update UI
    },
  });

  return (
    <div>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Offers: {tripOffers.length}</p>
      
      {tripOffers.map(offer => (
        <div key={offer.tripId}>
          <h3>{offer.title}</h3>
          <button onClick={() => acceptOffer(offer.tripId)}>
            Accept
          </button>
          <button onClick={() => declineOffer(offer.tripId)}>
            Decline
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Using Passenger WebSocket Hook

```typescript
import { usePassengerWebSocket } from '@/hooks/usePassengerWebSocket';

function PassengerComponent({ token, tripId }: { token: string; tripId: string }) {
  const {
    isConnected,
    driverLocation,
    error,
  } = usePassengerWebSocket({
    token,
    tripIds: [tripId],
    onTripStatusUpdate: (update) => {
      console.log('Trip status:', update.newStatus);
      // Update UI
    },
    onDriverLocation: (location) => {
      console.log('Driver at:', location.latitude, location.longitude);
      // Update map marker
    },
  });

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      {driverLocation && (
        <p>
          Driver location: {driverLocation.latitude}, {driverLocation.longitude}
        </p>
      )}
    </div>
  );
}
```

## API Endpoints

### Broadcast Trip Offer
```
POST /api/trips/[id]/broadcast-offer
```

Broadcasts a trip offer to all eligible drivers within the discovery radius.

**Request:** None (trip ID in URL)

**Response:**
```json
{
  "success": true,
  "tripId": "trip-id",
  "tripTitle": "Trip Title",
  "driversNotified": 5,
  "eligibleDrivers": 5
}
```

### Accept Trip Offer
```
POST /api/drivers/trips/accept/[tripId]
```

Driver accepts a trip offer. Broadcasts acceptance to passengers.

**Headers:**
- `x-driver-id`: Driver ID

**Response:**
```json
{
  "success": true,
  "message": "Trip accepted successfully!",
  "data": {
    "trip": { /* trip details */ },
    "driver": { /* driver details */ }
  }
}
```

## Configuration

### Environment Variables

```bash
# Socket.IO Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Default values in constants
WEBSOCKET_HEARTBEAT_INTERVAL=30000  # 30 seconds
TRIP_OFFER_DEFAULT_TIMEOUT=300      # 5 minutes
DEFAULT_DISCOVERY_RADIUS=50         # 50 km
```

### Constants

See `src/lib/constants/realtime.ts` for all configurable values:

- Connection timeouts
- Trip offer timeouts
- Discovery radius limits
- Location update intervals
- Notification priorities

## Room Naming Convention

Socket.IO rooms are used for efficient broadcasting:

- `user:{userId}` - Personal user room
- `driver:{driverId}` - Driver-specific room
- `trip:{tripId}` - Trip-specific room (all participants)
- `conversation:{conversationId}` - Chat conversation room
- `region:{region}` - Regional broadcasting (future)

## Error Handling

### Client-Side
- Automatic reconnection with exponential backoff
- Max reconnection attempts: 5
- Reconnection delay: 2 seconds
- Connection error notifications
- Graceful degradation if WebSocket unavailable

### Server-Side
- Try-catch blocks for all async operations
- Logging for debugging
- Graceful handling of missing data
- Database transaction rollback on errors

## Security

### Authentication
- All WebSocket connections require valid session token
- Token verified against database on connection
- User data attached to socket for authorization

### Authorization
- Room access controlled by database queries
- Drivers only see trips within their service area
- Passengers only see their own trips
- Trip acceptance verified server-side

### Rate Limiting
- Rate limiting on status updates (existing)
- Subscription cleanup to prevent memory leaks
- Connection limits per user (Socket.IO built-in)

## Performance

### Optimizations
- Room-based broadcasting (no unnecessary messages)
- Distance-based pre-filtering
- Subscription caching
- Periodic cleanup of inactive subscriptions
- Efficient database queries with proper indexes

### Scalability
- Socket.IO adapter support for multi-server setup
- Redis adapter recommended for production
- Stateless design for horizontal scaling
- Connection pooling for database

## Testing

### Manual Testing

1. **Driver Offer Reception:**
   - Create trip as passenger
   - Broadcast offer via API
   - Verify driver receives offer in real-time
   - Check distance calculation
   - Verify urgency and difficulty levels

2. **Trip Acceptance:**
   - Driver accepts offer
   - Verify passenger receives notification
   - Check database updates
   - Verify other drivers see offer disappear

3. **Location Updates:**
   - Start active trip
   - Driver sends location updates
   - Verify passenger sees updates on map
   - Check ETA calculations

4. **Reconnection:**
   - Disconnect driver
   - Create new offer
   - Reconnect driver
   - Verify offer appears after reconnection

### Automated Testing (To Be Added)

- Unit tests for broadcasting service
- Integration tests for Socket.IO handlers
- E2E tests for complete flows

## Troubleshooting

### Connection Issues
- Check `NEXT_PUBLIC_APP_URL` environment variable
- Verify session token is valid
- Check browser console for errors
- Ensure WebSocket not blocked by firewall

### Offers Not Appearing
- Verify driver has active status
- Check driver location is set
- Verify trip is within discovery radius
- Check database for TripDriverVisibility records

### Location Updates Not Working
- Verify trip status is active (IN_PROGRESS)
- Check driver is sending location updates
- Verify passenger is subscribed to trip
- Check Socket.IO room membership

## Future Enhancements

- [ ] Redis adapter for multi-server setup
- [ ] Push notifications for mobile apps
- [ ] Regional broadcasting for scalability
- [ ] Advanced driver matching algorithms
- [ ] Analytics and monitoring dashboard
- [ ] Rate limiting per user
- [ ] Message queuing for offline users
- [ ] Geo-fencing for automated notifications

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs for backend issues
3. Verify database schema is up to date
4. Check Socket.IO connection in network tab
5. Contact development team

## Resources

- Socket.IO Documentation: https://socket.io/docs
- Next.js API Routes: https://nextjs.org/docs/api-routes
- Prisma Client: https://www.prisma.io/docs/concepts/components/prisma-client
- TypeScript Handbook: https://www.typescriptlang.org/docs/
